const now = new Date();

export const shiftDate = (days) => new Date(now.getFullYear(), now.getMonth(), now.getDate() + days);

export const iso = (d) => d.toISOString();

export const TYPES = ['Car', 'Bus', 'Train', 'Flight', 'Electricity', 'Food', 'Waste'];

export const INVALID_TYPES = ['', 'car', 'Plane', 'Bike', 'Walking', null, undefined, 123, '🚗'];

export const makeActivity = (overrides = {}) => ({
  id: overrides.id || `test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  date: overrides.date || iso(new Date()),
  type: overrides.type || TYPES[Math.floor(Math.random() * TYPES.length)],
  value: overrides.value ?? Math.floor(Math.random() * 100) + 1,
  co2: overrides.co2 ?? parseFloat((Math.random() * 10).toFixed(3)),
  ...overrides
});

export const makeActivities = (count, overrides = {}) =>
  Array.from({ length: count }, (_, i) => makeActivity({
    id: `act_${i}`,
    date: iso(shiftDate(-Math.floor(Math.random() * 90))),
    ...overrides
  }));

export const makeGoal = (overrides = {}) => ({
  targetKg: overrides.targetKg ?? 50,
  ...overrides
});

export const invalidRecords = [
  null,
  undefined,
  'not an object',
  42,
  {},
  { id: 'no-date' },
  { id: 'x', date: 'invalid', type: 'Car', value: 10, co2: 1 },
  { id: 'x', date: iso(new Date()), type: 'Car' },
  { id: 'x', date: iso(new Date()), type: 'Car', value: 'not-a-number', co2: 1 },
  { id: 'x', date: iso(new Date()), type: 'Car', value: 10, co2: 'not-a-number' },
  { id: 'x', date: iso(new Date()), type: 'INVALID', value: 10, co2: 1 },
  { id: 123, date: iso(new Date()), type: 'Car', value: 10, co2: 1 },
  { id: 'x', date: iso(new Date()), type: 'Car', value: -5, co2: 1 }
];
