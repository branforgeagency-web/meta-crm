import React, { useState, useEffect } from 'react';
import { metaService, BACKEND_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Settings, Facebook, Key, Shield, Copy, Check, Terminal, ExternalLink } from 'lucide-react';

const SettingsPage = () => {
  const [copiedField, setCopiedField] = useState(null);

  const { isAdmin } = useAuth();
  const [config, setConfig] = useState(null);
  const [configError, setConfigError] = useState('');

  useEffect(() => {
    if (!isAdmin) return;
    metaService
      .getConfig()
      .then((res) => setConfig(res.config))
      .catch((err) => setConfigError(err.response?.data?.message || 'Could not load integration settings'));
  }, [isAdmin]);

  const webhookUrl = `${BACKEND_URL || window.location.origin}${config?.webhookPath || '/api/meta/webhook'}`;
  const verifyToken = config?.verifyToken || '';

  const StatusRow = ({ ok, label, hint }) => (
    <div className="flex items-start justify-between gap-3 text-xs py-2">
      <div>
        <span className="font-semibold text-slate-700 dark:text-slate-200">{label}</span>
        {!ok && hint && <p className="text-slate-400 mt-0.5">{hint}</p>}
      </div>
      <span className={`px-2 py-0.5 rounded-lg font-bold shrink-0 ${ok ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
        {ok ? 'Configured' : 'Not configured'}
      </span>
    </div>
  );

  if (!isAdmin) {
    return (
      <div className="max-w-4xl p-6 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl text-xs text-slate-500">
        Integration settings are available to administrators only.
      </div>
    );
  }

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <Settings className="w-6 h-6 text-crm-500" />
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">System & Meta Integration Settings</h1>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Configure Meta Developer App Webhooks, API Access Tokens, and Security Credentials
        </p>
      </div>

      {/* Meta Webhook Configuration Box */}
      <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border p-6 rounded-2xl shadow-crm-card space-y-4">
        <div className="flex items-center space-x-2 text-crm-500 border-b border-slate-100 dark:border-slate-800 pb-3">
          <Facebook className="w-5 h-5 text-blue-500" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Meta Webhook Credentials</h2>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Provide these credentials inside your <strong>Meta for Developers</strong> console under <strong>Webhooks &gt; Page &gt; Leadgen</strong>:
        </p>

        {configError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">{configError}</div>
        )}

        {config && (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl px-3">
            <StatusRow ok={!!config.verifyToken} label="Verify token (META_VERIFY_TOKEN)" />
            <StatusRow
              ok={config.accessTokenConfigured}
              label="Page access token (META_ACCESS_TOKEN)"
              hint="Needed to load the lead's name, phone, answers and campaign from Meta. Use a long-lived Page token with leads_retrieval permission."
            />
            <StatusRow
              ok={config.appSecretConfigured}
              label="App secret (META_APP_SECRET)"
              hint="Used to verify that webhook calls really come from Meta."
            />
            <div className="flex items-center justify-between text-xs py-2">
              <span className="font-semibold text-slate-700 dark:text-slate-200">Graph API version</span>
              <span className="font-mono text-slate-500">{config.graphVersion}</span>
            </div>
          </div>
        )}

        <p className="text-[11px] text-slate-400">
          Meta can only reach a public HTTPS address. Use your deployed domain (or a tunnel during testing), not localhost.
        </p>

        {/* Callback URL */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Callback URL (Webhook Endpoint)
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              readOnly
              value={webhookUrl}
              className="flex-1 text-xs font-mono p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100"
            />
            <button
              onClick={() => handleCopy(webhookUrl, 'url')}
              className="px-3.5 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-colors shrink-0"
            >
              {copiedField === 'url' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              <span>{copiedField === 'url' ? 'Copied' : 'Copy URL'}</span>
            </button>
          </div>
        </div>

        {/* Verify Token */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Verify Token
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              readOnly
              value={verifyToken}
              className="flex-1 text-xs font-mono p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100"
            />
            <button
              onClick={() => handleCopy(verifyToken, 'token')}
              className="px-3.5 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-colors shrink-0"
            >
              {copiedField === 'token' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              <span>{copiedField === 'token' ? 'Copied' : 'Copy Token'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Meta Developer Integration Guide */}
      <div className="bg-slate-900 text-slate-200 p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-crm-500" />
          <span>Meta Lead Ads Webhook Setup Instructions</span>
        </h3>

        <ol className="list-decimal list-inside text-xs text-slate-300 space-y-2.5 leading-relaxed">
          <li>
            Go to <a href="https://developers.facebook.com" target="_blank" rel="noreferrer" className="text-crm-400 underline font-semibold">developers.facebook.com</a> and create or select your App.
          </li>
          <li>
            Add the <strong>Webhooks</strong> product and set object type to <strong>Page</strong>.
          </li>
          <li>
            Paste the <strong>Callback URL</strong> and <strong>Verify Token</strong> listed above.
          </li>
          <li>
            Subscribe to the <code className="bg-slate-800 px-1.5 py-0.5 rounded text-crm-300">leadgen</code> event.
          </li>
          <li>
            When a Meta Instant Form is completed on Facebook/Instagram Ads, Meta sends a payload to your endpoint.
          </li>
          <li>
            Our backend automatically retrieves full field names via Meta Graph API, validates the input, checks for duplicates, and saves it into MongoDB.
          </li>
        </ol>
      </div>
    </div>
  );
};

export default SettingsPage;
