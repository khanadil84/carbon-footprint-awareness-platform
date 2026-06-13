export const pad = (n) => n.toString().padStart(2, '0');

export const toDateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;

export const daysKey = (d) => `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;

export const nowIso = () => new Date().toISOString();

export const daysInMonth = (d = new Date()) => new Date(d.getFullYear(), d.getMonth()+1, 0).getDate();

export const lastNDatesSet = (n) => {
  const now = new Date();
  const set = new Set();
  for (let i = 0; i < n; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    set.add(daysKey(d));
  }
  return set;
};
