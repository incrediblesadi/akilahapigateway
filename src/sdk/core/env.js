function readEnv(name, defaultValue = '') {
  const raw = process.env[name];
  if (typeof raw !== 'string') return defaultValue;
  const value = raw.trim();
  return value.length > 0 ? value : defaultValue;
}

module.exports = { readEnv };
