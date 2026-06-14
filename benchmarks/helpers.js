const TYPES = ['Car', 'Bus', 'Train', 'Flight', 'Electricity', 'Waste', 'Food'];
const now = new Date();

export const generateActivities = (count) => {
  const activities = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - Math.floor(Math.random() * 90));
    activities.push({
      id: `bench-${i}`,
      date: d.toISOString(),
      type: TYPES[Math.floor(Math.random() * TYPES.length)],
      value: String(Math.floor(Math.random() * 100) + 1),
      co2: parseFloat((Math.random() * 15).toFixed(3))
    });
  }
  return activities;
};

export const run = (label, fn, iterations = 100) => {
  const times = [];
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    fn();
    const end = performance.now();
    times.push(end - start);
  }
  let sum = 0;
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < times.length; i++) {
    const t = times[i];
    sum += t;
    if (t < min) min = t;
    if (t > max) max = t;
  }
  const avg = sum / times.length;
  console.log(`  ${label}: avg=${avg.toFixed(4)}ms min=${min.toFixed(4)}ms max=${max.toFixed(4)}ms (${iterations} runs)`);
  return { avg, min, max };
};
