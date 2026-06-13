const subscribers = new Map();

const ensureEvent = (type) => {
  if (!subscribers.has(type)) {
    subscribers.set(type, new Set());
  }
};

export const emitSecurityEvent = (type, detail = {}) => {
  if (typeof type !== 'string' || !type) return;
  const handlers = subscribers.get(type);
  if (!handlers || handlers.size === 0) return;
  const event = { type, timestamp: Date.now(), detail };
  handlers.forEach(fn => {
    try { fn(event); } catch (e) { console.error('Security event handler error:', e); }
  });
};

export const onSecurityEvent = (type, handler) => {
  if (typeof type !== 'string' || !type || typeof handler !== 'function') return () => {};
  ensureEvent(type);
  subscribers.get(type).add(handler);
  return () => { subscribers.get(type)?.delete(handler); };
};

export const offSecurityEvent = (type, handler) => {
  subscribers.get(type)?.delete(handler);
};

export const clearSecurityEvents = () => {
  subscribers.clear();
};
