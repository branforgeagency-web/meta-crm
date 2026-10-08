const crypto = require('crypto');
const axios = require('axios');
const mongoose = require('mongoose');
const Lead = require('../models/Lead');
const { isRealValue, graphVersion } = require('../config/env');

const LEAD_FIELDS = [
  'id', 'created_time', 'field_data', 'form_id', 'platform', 'is_organic',
  'ad_id', 'ad_name', 'adset_id', 'adset_name', 'campaign_id', 'campaign_name',
].join(',');

const firstValue = (v) => (Array.isArray(v) ? v.filter(Boolean).join(', ') : v || '');

// Map Meta form answers to CRM fields. Exact standard keys first, then common custom-question names.
const mapFieldData = (fieldData = []) => {
  const out = { name: '', firstName: '', lastName: '', email: '', phone: '', course: '', location: '' };
  const locationParts = [];

  for (const f of fieldData) {
    const key = String(f.name || '').toLowerCase();
    const val = String(firstValue(f.values)).trim();
    if (!val) continue;

    if (key === 'full_name' || key === 'name') out.name = val;
    else if (key === 'first_name') out.firstName = val;
    else if (key === 'last_name') out.lastName = val;
    else if (key === 'email' || key.includes('email')) out.email = val;
    else if (key === 'phone_number' || key.includes('phone') || key.includes('mobile') || key.includes('whatsapp')) out.phone = val;
    else if (['city', 'state', 'country', 'zip_code', 'post_code', 'street_address'].includes(key) || key.includes('location')) locationParts.push(val);
    else if (!out.course && /(course|program|programme|interest|service)/.test(key)) out.course = val;
  }

  if (!out.name) out.name = [out.firstName, out.lastName].filter(Boolean).join(' ');
  out.location = locationParts.join(', ');
  return out;
};

const sourceFromPlatform = (platform) => {
  const p = String(platform || '').toLowerCase();
  if (p === 'ig' || p === 'instagram') return 'Instagram Instant Form';
  if (p === 'fb' || p === 'facebook') return 'Facebook Instant Form';
  return 'Meta Lead Form';
};

// Fetch the full lead (answers + campaign/ad set/ad names) from the Graph API.
const fetchLeadFromGraph = async (leadgenId) => {
  const accessToken = process.env.META_ACCESS_TOKEN;
  if (!isRealValue(accessToken)) throw new Error('META_ACCESS_TOKEN is not configured');

  const params = { access_token: accessToken, fields: LEAD_FIELDS };
  if (isRealValue(process.env.META_APP_SECRET)) {
    params.appsecret_proof = crypto.createHmac('sha256', process.env.META_APP_SECRET).update(accessToken).digest('hex');
  }
  const { data } = await axios.get(`https://graph.facebook.com/${graphVersion()}/${leadgenId}`, { params, timeout: 15000 });
  return data;
};

const applyGraphData = (lead, g) => {
  const mapped = mapFieldData(g.field_data);
  lead.name = mapped.name || lead.name;
  lead.email = mapped.email || lead.email;
  lead.phone = mapped.phone || lead.phone;
  lead.course = mapped.course || lead.course;
  lead.location = mapped.location || lead.location;
  lead.formData = (g.field_data || []).map((f) => ({
    field: f.name,
    label: String(f.name || '').replace(/_/g, ' ').toUpperCase(),
    value: String(firstValue(f.values)),
  }));
  lead.source = sourceFromPlatform(g.platform);
  lead.campaignId = g.campaign_id || lead.campaignId;
  lead.campaignName = g.campaign_name || lead.campaignName;
  lead.adSetId = g.adset_id || lead.adSetId;
  lead.adSetName = g.adset_name || lead.adSetName;
  lead.adId = g.ad_id || lead.adId;
  lead.adName = g.ad_name || lead.adName;
};

// Verify X-Hub-Signature-256 so only Meta can post leads.
const hasValidSignature = (req) => {
  const secret = process.env.META_APP_SECRET;
  if (!isRealValue(secret)) return true; // not configured -> warned at startup
  const header = req.get('x-hub-signature-256') || '';
  if (!header.startsWith('sha256=') || !req.rawBody) return false;
  const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(req.rawBody).digest('hex');
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

// @route GET /api/meta/webhook  (Meta verification handshake)
exports.verifyWebhook = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token && token === process.env.META_VERIFY_TOKEN) {
    console.log('[Meta Webhook Verified Successfully]');
    return res.status(200).send(challenge);
  }
  console.warn('[Meta Webhook Verification Failed]: invalid mode or verify token');
  return res.sendStatus(403);
};

// @route POST /api/meta/webhook  (leadgen events)
exports.receiveWebhook = async (req, res) => {
  if (!hasValidSignature(req)) {
    console.warn('[Meta Webhook]: Rejected request with invalid signature');
    return res.sendStatus(401);
  }

  const body = req.body || {};
  if (body.object !== 'page') return res.sendStatus(404);

  // Acknowledge immediately so Meta does not retry; process after responding.
  res.status(200).send('EVENT_RECEIVED');

  const io = req.app.get('socketio');
  for (const entry of body.entry || []) {
    for (const change of entry.changes || []) {
      if (change.field !== 'leadgen' || !change.value || !change.value.leadgen_id) continue;
      const v = change.value;
      const leadgenId = String(v.leadgen_id);

      try {
        if (await Lead.exists({ metaLeadId: leadgenId })) {
          console.log(`[Meta Webhook]: Lead ${leadgenId} already saved. Skipping.`);
          continue;
        }

        const lead = new Lead({
          metaLeadId: leadgenId,
          name: `Meta lead ${leadgenId}`,
          source: 'Meta Lead Form',
          adId: v.ad_id || '',
          adSetId: v.adgroup_id || '',
          createdAt: v.created_time ? new Date(Number(v.created_time) * 1000) : undefined,
          notes: [{ text: `Lead received from Meta (Lead ID ${leadgenId}, Form ID ${v.form_id || '-'})`, author: 'Meta Webhook' }],
        });

        try {
          applyGraphData(lead, await fetchLeadFromGraph(leadgenId));
        } catch (graphError) {
          const reason = graphError.response?.data?.error?.message || graphError.message;
          console.error(`[Meta Graph API]: Could not fetch lead ${leadgenId}: ${reason}`);
          lead.notes.push({ text: `Could not load form answers from Meta: ${reason}. Use "Refresh from Meta" once the access token is fixed.`, author: 'Meta Webhook' });
        }

        await lead.save();
        const saved = await Lead.findById(lead._id).populate('assignedTo', 'name email phone role');
        if (io) io.emit('new_lead', saved);
        console.log(`[Meta Webhook]: Saved lead ${leadgenId} (${lead.name})`);
      } catch (error) {
        if (error.code === 11000) continue; // duplicate delivery raced with another request
        console.error(`[Meta Webhook]: Failed to save lead ${leadgenId}:`, error.message);
      }
    }
  }
};

// @route POST /api/meta/leads/:id/refresh  (admin) re-fetch a lead's real details from Meta
exports.refreshLeadFromMeta = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    if (!lead.metaLeadId) return res.status(400).json({ success: false, message: 'This lead did not come from Meta' });

    applyGraphData(lead, await fetchLeadFromGraph(lead.metaLeadId));
    lead.notes.push({ text: 'Lead details refreshed from Meta', author: req.user.name });
    await lead.save();
    const updated = await Lead.findById(lead._id).populate('assignedTo', 'name email phone role');
    const io = req.app.get('socketio');
    if (io) io.emit('lead_updated', updated);
    res.json({ success: true, lead: updated, message: 'Lead refreshed from Meta' });
  } catch (error) {
    const reason = error.response?.data?.error?.message || error.message;
    res.status(502).json({ success: false, message: `Meta API error: ${reason}` });
  }
};

// @route GET /api/meta/config  (admin) shows real integration status for the Settings page
exports.getMetaConfig = (req, res) => {
  res.json({
    success: true,
    config: {
      webhookPath: '/api/meta/webhook',
      verifyToken: process.env.META_VERIFY_TOKEN,
      accessTokenConfigured: isRealValue(process.env.META_ACCESS_TOKEN),
      appSecretConfigured: isRealValue(process.env.META_APP_SECRET),
      graphVersion: graphVersion(),
    },
  });
};
