const mongoose = require('mongoose');
const Lead = require('../models/Lead');
const User = require('../models/User');
const { timezone } = require('../config/env');

const { LEAD_STATUSES, LEAD_SOURCES } = Lead;
const POPULATE_STAFF = ['assignedTo', 'name email phone role'];
const SORT_WHITELIST = ['-createdAt', 'createdAt', 'name', '-name', 'followUpDate', '-followUpDate', '-updatedAt'];

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const clean = (v) => (typeof v === 'string' ? v.trim() : v);
const actor = (req) => (req.user ? req.user.name : 'System');

const broadcast = (req, event, payload) => {
  const io = req.app.get('socketio');
  if (io) io.emit(event, payload);
};

const loadLead = (id) => Lead.findById(id).populate(...POPULATE_STAFF);

// Builds the Mongo query from list filters (shared by list + export so both match).
const buildLeadQuery = (q) => {
  const query = {};
  const { search, status, course, campaign, source, assignedTo, startDate, endDate, followUp } = q;

  if (assignedTo) {
    if (assignedTo === 'unassigned') query.assignedTo = null;
    else if (isValidId(assignedTo)) query.assignedTo = assignedTo;
  }

  if (search && search.trim()) {
    const rx = new RegExp(escapeRegex(search.trim()), 'i');
    query.$or = [
      { name: rx }, { phone: rx }, { email: rx }, { course: rx },
      { location: rx }, { campaignName: rx }, { metaLeadId: rx },
    ];
  }

  if (status && status !== 'All') query.status = status;
  if (course && course !== 'All') query.course = course;
  if (campaign && campaign !== 'All') query.campaignName = campaign;
  if (source && source !== 'All') query.source = source;
  if (followUp === 'true') query.followUpDate = { $ne: null };

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) {
      const sd = new Date(startDate);
      if (!isNaN(sd)) query.createdAt.$gte = sd;
    }
    if (endDate) {
      const eod = new Date(endDate);
      if (!isNaN(eod)) {
        eod.setHours(23, 59, 59, 999);
        query.createdAt.$lte = eod;
      }
    }
    if (!Object.keys(query.createdAt).length) delete query.createdAt;
  }
  return query;
};

// Validate :id route params once
exports.validateLeadId = (req, res, next, id) => {
  if (!isValidId(id)) return res.status(404).json({ success: false, message: 'Lead not found' });
  return next();
};

// @route GET /api/leads
exports.getLeads = async (req, res) => {
  try {
    const query = buildLeadQuery(req.query);
    const sort = SORT_WHITELIST.includes(req.query.sort) ? req.query.sort : '-createdAt';
    const pageNum = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(req.query.limit, 10) || 25, 1), 1000);

    const [leads, totalLeads] = await Promise.all([
      Lead.find(query).populate(...POPULATE_STAFF).sort(sort).skip((pageNum - 1) * limitNum).limit(limitNum),
      Lead.countDocuments(query),
    ]);

    res.json({
      success: true,
      count: leads.length,
      totalLeads,
      totalPages: Math.max(Math.ceil(totalLeads / limitNum), 1),
      currentPage: pageNum,
      leads,
    });
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ success: false, message: 'Server error fetching leads' });
  }
};

// @route GET /api/leads/filters  -> real values present in the database for filter dropdowns
exports.getFilterOptions = async (req, res) => {
  try {
    const [courses, campaigns, sources] = await Promise.all([
      Lead.distinct('course'),
      Lead.distinct('campaignName'),
      Lead.distinct('source'),
    ]);
    const tidy = (arr) => arr.filter((v) => v && String(v).trim()).sort((a, b) => a.localeCompare(b));
    res.json({
      success: true,
      courses: tidy(courses),
      campaigns: tidy(campaigns),
      sources: tidy(sources),
      statuses: LEAD_STATUSES,
      allSources: LEAD_SOURCES,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error loading filter options' });
  }
};

// @route GET /api/leads/stats
exports.getLeadStats = async (req, res) => {
  try {
    const tz = timezone();
    const statusCounts = await Lead.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
    const byStatus = Object.fromEntries(statusCounts.map((s) => [s._id, s.count]));
    const totalLeads = statusCounts.reduce((n, s) => n + s.count, 0);

    // Day boundaries in the business timezone
    const dayKey = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(d); // YYYY-MM-DD
    const todayKey = dayKey(new Date());

    // Bucket the last 14 days by calendar day in the business timezone
    const fourteenDaysAgo = new Date(Date.now() - 15 * 86400000);
    const recent = await Lead.find({ createdAt: { $gte: fourteenDaysAgo } }).select('createdAt status').lean();
    const byDay = {};
    for (const l of recent) {
      const key = dayKey(l.createdAt);
      byDay[key] = byDay[key] || { total: 0, converted: 0 };
      byDay[key].total += 1;
      if (l.status === 'Converted') byDay[key].converted += 1;
    }

    const chartData = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = dayKey(d);
      chartData.push({
        date: key,
        displayDate: new Intl.DateTimeFormat('en-IN', { timeZone: tz, month: 'short', day: 'numeric' }).format(d),
        leads: byDay[key] ? byDay[key].total : 0,
        converted: byDay[key] ? byDay[key].converted : 0,
      });
    }

    const todayLeads = byDay[todayKey] ? byDay[todayKey].total : 0;
    const thisWeekLeads = chartData.slice(-7).reduce((n, d) => n + d.leads, 0);

    const [sourceBreakdown, courseBreakdown] = await Promise.all([
      Lead.aggregate([{ $group: { _id: '$source', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Lead.aggregate([{ $group: { _id: '$course', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    ]);

    res.json({
      success: true,
      stats: {
        totalLeads,
        newLeads: byStatus['New'] || 0,
        contactedLeads: byStatus['Contacted'] || 0,
        interestedLeads: byStatus['Interested'] || 0,
        convertedLeads: byStatus['Converted'] || 0,
        notInterestedLeads: byStatus['Not Interested'] || 0,
        followUpLeads: byStatus['Follow-up'] || 0,
        closedLeads: byStatus['Closed'] || 0,
        todayLeads,
        thisWeekLeads,
      },
      charts: {
        activityOverTime: chartData,
        sourceBreakdown: sourceBreakdown.map((s) => ({ name: s._id || 'Unknown', count: s.count })),
        courseBreakdown: courseBreakdown.map((c) => ({ name: c._id || 'Not specified', count: c.count })),
      },
    });
  } catch (error) {
    console.error('Error calculating lead stats:', error);
    res.status(500).json({ success: false, message: 'Server error generating lead statistics' });
  }
};

// @route GET /api/leads/campaigns  -> per-campaign performance across ALL leads
exports.getCampaignStats = async (req, res) => {
  try {
    const rows = await Lead.aggregate([
      {
        $group: {
          _id: { $ifNull: ['$campaignName', ''] },
          total: { $sum: 1 },
          converted: { $sum: { $cond: [{ $eq: ['$status', 'Converted'] }, 1, 0] } },
          contacted: { $sum: { $cond: [{ $in: ['$status', ['Contacted', 'Interested', 'Follow-up']] }, 1, 0] } },
          sources: { $addToSet: '$source' },
          adSets: { $addToSet: '$adSetName' },
        },
      },
      { $sort: { total: -1 } },
    ]);
    res.json({
      success: true,
      campaigns: rows.map((r) => ({
        name: r._id || 'No campaign',
        total: r.total,
        converted: r.converted,
        contacted: r.contacted,
        conversionRate: r.total ? ((r.converted / r.total) * 100).toFixed(1) : '0.0',
        sourceList: r.sources.filter(Boolean).join(', '),
        adSetCount: r.adSets.filter(Boolean).length,
      })),
    });
  } catch (error) {
    console.error('Error loading campaign stats:', error);
    res.status(500).json({ success: false, message: 'Error loading campaign stats' });
  }
};

// @route GET /api/leads/:id
exports.getLeadById = async (req, res) => {
  try {
    const lead = await loadLead(req.params.id);
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    res.json({ success: true, lead });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving lead details' });
  }
};

// @route PATCH /api/leads/:id/status
exports.updateLeadStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!LEAD_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid lead status' });
    }
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

    const oldStatus = lead.status;
    if (oldStatus === status) {
      return res.json({ success: true, lead: await loadLead(lead._id), message: 'Status unchanged' });
    }
    lead.status = status;
    if (status !== 'New' && !lead.lastContactedAt) lead.lastContactedAt = new Date();
    lead.notes.push({ text: `Status updated from "${oldStatus}" to "${status}"`, author: actor(req) });

    await lead.save();
    const updatedLead = await loadLead(lead._id);
    broadcast(req, 'lead_updated', updatedLead);
    res.json({ success: true, lead: updatedLead, message: `Status updated to ${status}` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating lead status' });
  }
};

// @route PATCH /api/leads/:id/assign
exports.assignLead = async (req, res) => {
  try {
    const { staffId } = req.body;
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

    let staffName = 'Unassigned';
    if (staffId) {
      if (!isValidId(staffId)) return res.status(400).json({ success: false, message: 'Invalid staff member' });
      const staffUser = await User.findById(staffId);
      if (!staffUser) return res.status(404).json({ success: false, message: 'Selected staff member not found' });
      if (staffUser.status !== 'active') {
        return res.status(400).json({ success: false, message: 'Cannot assign leads to a disabled account' });
      }
      lead.assignedTo = staffUser._id;
      staffName = staffUser.name;
    } else {
      lead.assignedTo = null;
    }

    lead.notes.push({ text: staffId ? `Lead assigned to ${staffName}` : 'Lead unassigned', author: actor(req) });
    await lead.save();
    const updatedLead = await loadLead(lead._id);
    broadcast(req, 'lead_updated', updatedLead);
    res.json({ success: true, lead: updatedLead, message: staffId ? `Assigned to ${staffName}` : 'Lead unassigned' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error assigning lead' });
  }
};

// @route POST /api/leads/:id/notes
exports.addNote = async (req, res) => {
  try {
    const text = clean(req.body.text);
    if (!text) return res.status(400).json({ success: false, message: 'Note text cannot be empty' });

    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

    lead.notes.push({ text, author: actor(req) });
    await lead.save();
    const updatedLead = await loadLead(lead._id);
    broadcast(req, 'lead_updated', updatedLead);
    res.json({ success: true, lead: updatedLead, message: 'Note added successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error adding note' });
  }
};

// @route PATCH /api/leads/:id/followup
exports.scheduleFollowUp = async (req, res) => {
  try {
    const { followUpDate } = req.body;
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

    if (followUpDate) {
      const d = new Date(followUpDate);
      if (isNaN(d)) return res.status(400).json({ success: false, message: 'Invalid follow-up date' });
      lead.followUpDate = d;
      if (lead.status === 'New') lead.status = 'Follow-up';
      const label = new Intl.DateTimeFormat('en-IN', { timeZone: timezone(), dateStyle: 'medium' }).format(d);
      lead.notes.push({ text: `Follow-up scheduled for ${label}`, author: actor(req) });
    } else {
      lead.followUpDate = null;
      lead.notes.push({ text: 'Follow-up date cleared', author: actor(req) });
    }

    await lead.save();
    const updatedLead = await loadLead(lead._id);
    broadcast(req, 'lead_updated', updatedLead);
    res.json({ success: true, lead: updatedLead, message: followUpDate ? 'Follow-up date updated' : 'Follow-up cleared' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error scheduling follow-up' });
  }
};

// @route POST /api/leads  (manual entry of a real enquiry)
exports.createLead = async (req, res) => {
  try {
    const name = clean(req.body.name);
    const phone = clean(req.body.phone) || '';
    const email = clean(req.body.email) || '';
    const course = clean(req.body.course) || '';
    const location = clean(req.body.location) || '';
    const campaignName = clean(req.body.campaignName) || '';
    const notes = clean(req.body.notes);
    const source = LEAD_SOURCES.includes(req.body.source) ? req.body.source : 'Manual Entry';
    const status = LEAD_STATUSES.includes(req.body.status) ? req.body.status : 'New';
    let assignedTo = null;

    if (!name || (!phone && !email)) {
      return res.status(400).json({ success: false, message: 'Name and either Phone or Email are required' });
    }
    if (req.body.assignedTo) {
      if (!isValidId(req.body.assignedTo)) return res.status(400).json({ success: false, message: 'Invalid staff member' });
      const staffUser = await User.findById(req.body.assignedTo);
      if (!staffUser || staffUser.status !== 'active') {
        return res.status(400).json({ success: false, message: 'Selected staff member is not available' });
      }
      assignedTo = staffUser._id;
    }

    const formData = [
      { field: 'full_name', label: 'FULL NAME', value: name },
      phone && { field: 'phone_number', label: 'PHONE NUMBER', value: phone },
      email && { field: 'email', label: 'EMAIL ADDRESS', value: email },
      course && { field: 'course_interest', label: 'COURSE INTEREST', value: course },
      location && { field: 'location', label: 'LOCATION', value: location },
    ].filter(Boolean);

    const newLead = await Lead.create({
      name, phone, email, course, location, source, campaignName, status, assignedTo, formData,
      notes: [
        { text: `Lead added manually by ${actor(req)}`, author: actor(req) },
        ...(notes ? [{ text: notes, author: actor(req) }] : []),
      ],
    });

    const populated = await loadLead(newLead._id);
    broadcast(req, 'new_lead', populated);
    res.status(201).json({ success: true, lead: populated, message: 'Lead created successfully' });
  } catch (error) {
    console.error('Error creating lead:', error);
    const msg = error.name === 'ValidationError' ? error.message : 'Error creating lead';
    res.status(error.name === 'ValidationError' ? 400 : 500).json({ success: false, message: msg });
  }
};

// @route POST /api/leads/batch  (CSV import of real leads)
exports.batchImportLeads = async (req, res) => {
  try {
    const { leads: rawLeads } = req.body;
    if (!Array.isArray(rawLeads) || rawLeads.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide an array of leads to import' });
    }

    const pick = (item, ...keys) => {
      for (const k of keys) if (item[k] !== undefined && String(item[k]).trim()) return String(item[k]).trim();
      return '';
    };

    const docs = [];
    const skipped = [];
    rawLeads.forEach((item, idx) => {
      const name = pick(item, 'Name', 'name');
      const phone = pick(item, 'Phone', 'phone');
      const email = pick(item, 'Email', 'email');
      if (!name || (!phone && !email)) {
        skipped.push(idx + 1);
        return;
      }
      const status = pick(item, 'Status', 'status');
      const source = pick(item, 'Source', 'source');
      docs.push({
        name, phone, email,
        course: pick(item, 'Course', 'course'),
        location: pick(item, 'Location', 'location'),
        source: LEAD_SOURCES.includes(source) ? source : 'CSV Import',
        campaignName: pick(item, 'Campaign', 'campaignName'),
        status: LEAD_STATUSES.includes(status) ? status : 'New',
        notes: [{ text: 'Lead imported from CSV file', author: actor(req) }],
      });
    });

    const inserted = docs.length ? await Lead.insertMany(docs, { ordered: false }) : [];
    if (inserted.length) broadcast(req, 'leads_imported', { count: inserted.length });

    res.status(201).json({
      success: true,
      count: inserted.length,
      skippedRows: skipped,
      message: `Imported ${inserted.length} lead(s)` + (skipped.length ? `, skipped ${skipped.length} row(s) missing name or contact` : ''),
    });
  } catch (error) {
    console.error('Batch import error:', error);
    res.status(500).json({ success: false, message: 'Error during batch lead import' });
  }
};

// @route GET /api/leads/export  (respects the same filters as the list)
exports.exportLeads = async (req, res) => {
  try {
    const leads = await Lead.find(buildLeadQuery(req.query)).populate('assignedTo', 'name email').sort('-createdAt');
    const fmt = (d) => (d ? new Date(d).toISOString() : '');
    const data = leads.map((lead) => ({
      ID: String(lead._id),
      MetaLeadID: lead.metaLeadId || '',
      Name: lead.name,
      Phone: lead.phone || '',
      Email: lead.email || '',
      Course: lead.course || '',
      Location: lead.location || '',
      Source: lead.source || '',
      Campaign: lead.campaignName || '',
      AdSet: lead.adSetName || '',
      AdName: lead.adName || '',
      Status: lead.status,
      AssignedStaff: lead.assignedTo ? lead.assignedTo.name : 'Unassigned',
      CreatedDate: fmt(lead.createdAt),
      FollowUpDate: fmt(lead.followUpDate),
    }));
    res.json({ success: true, data });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ success: false, message: 'Error exporting leads' });
  }
};
