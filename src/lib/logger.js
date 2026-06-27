// Structured Logger for Security & Privacy
// Scrubs sensitive fields (PII, tokens, passwords) before writing to stdout/stderr.

const SENSITIVE_KEYS = ['token', 'password', 'authorization', 'cookie', 'secret', 'key', 'refresh_token', 'access_token'];

function scrubValue(key, value) {
  if (typeof key === 'string' && SENSITIVE_KEYS.some(sk => key.toLowerCase().includes(sk))) {
    return '[REDACTED]';
  }
  
  if (value && typeof value === 'object') {
    if (Array.isArray(value)) {
      return value.map(v => scrubValue('', v));
    }
    const scrubbedObj = {};
    for (const [k, v] of Object.entries(value)) {
      scrubbedObj[k] = scrubValue(k, v);
    }
    return scrubbedObj;
  }
  
  return value;
}

function formatLog(level, message, meta = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message: scrubValue('', message),
    ...scrubValue('', meta)
  };
  return JSON.stringify(logEntry);
}

export const logger = {
  info: (message, meta) => {
    console.log(formatLog('INFO', message, meta));
  },
  warn: (message, meta) => {
    console.warn(formatLog('WARN', message, meta));
  },
  error: (message, errorOrMeta) => {
    let meta = {};
    if (errorOrMeta instanceof Error) {
      meta = { error: errorOrMeta.message, stack: process.env.NODE_ENV === 'production' ? '[REDACTED_IN_PROD]' : errorOrMeta.stack };
    } else {
      meta = errorOrMeta;
    }
    console.error(formatLog('ERROR', message, meta));
  }
};
