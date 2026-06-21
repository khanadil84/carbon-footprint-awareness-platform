/** Update type-based activity counters (Bus, Train, CarShort) by a delta. */
export const updateTypeCounts = (counts, entry, delta = 1) => {
  if (entry.type === 'Bus') counts.bus += delta;
  else if (entry.type === 'Train') counts.train += delta;
  else if (entry.type === 'Car' && Number(entry.value) <= 2) counts.carShort += delta;
};
