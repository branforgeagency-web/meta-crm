// Central place for required configuration. Fails fast instead of falling back to hardcoded secrets.
const REQUIRED = ['MONGODB_URI', 'JWT_SECRET', 'META_VERIFY_TOKEN'];

const validateEnv = () => {
  const missing = REQUIRED.filter((k) => !process.env[k] || !process.env[k].trim());
  if (missing.length) {
    console.error(`[Config Error]: Missing required settings in server/.env: ${missing.join(', ')}`);
    process.exit(1);
  }
  if (!process.env.META_ACCESS_TOKEN || /placeholder/i.test(process.env.META_ACCESS_TOKEN)) {
    console.warn('[Config Warning]: META_ACCESS_TOKEN is not set to a real Page access token. ' +
      'Incoming Meta leads will be saved with their Lead ID only until it is configured.');
  }
  if (!process.env.META_APP_SECRET || /placeholder/i.test(process.env.META_APP_SECRET)) {
    console.warn('[Config Warning]: META_APP_SECRET is not set. Webhook signatures will not be verified.');
  }
};

const isRealValue = (v) => !!v && !/placeholder/i.test(v);

module.exports = {
  validateEnv,
  isRealValue,
  graphVersion: () => process.env.META_GRAPH_VERSION || 'v23.0',
  timezone: () => process.env.APP_TIMEZONE || 'Asia/Kolkata',
};
