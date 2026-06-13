export const computeStatus = (current, target, projected) => {
  if (current <= target && projected <= target) return 'Goal Achieved';
  if (projected <= target) return 'On Track';
  if (projected <= target * 1.05) return 'Slightly Behind';
  return 'Behind';
};

export const generateInsight = (status, improvementNeeded, estIfReduceCar10) => {
  if (status === 'On Track') return "You're on track to beat your goal.";
  if (improvementNeeded > 0 && estIfReduceCar10 >= improvementNeeded) return `Reducing car travel by 10% (~${estIfReduceCar10} kg) would keep you on target.`;
  if (status === 'Slightly Behind') return 'You are slightly behind — small adjustments would help.';
  if (status === 'Behind') return 'You are behind your monthly goal — consider larger changes.';
  return '';
};
