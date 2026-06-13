import { EMISSION_FACTORS, EMISSION_FACTOR_MAP } from '../config/constants.js';

export const calculateEmission = (type, value) => {
  const v = Number(value) || 0;
  const key = EMISSION_FACTOR_MAP[type];
  if (!key) return 0;
  return parseFloat((v * EMISSION_FACTORS[key]).toFixed(3));
};
