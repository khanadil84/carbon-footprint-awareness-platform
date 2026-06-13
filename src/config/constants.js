export const ACTIVITY_TYPES = [
  'Car',
  'Bus',
  'Train',
  'Flight',
  'Electricity',
  'Food',
  'Waste'
];

export const ACTIVITY_OPTIONS = [
  { value: 'Car', label: 'Car Travel (km)', unit: 'km' },
  { value: 'Bus', label: 'Bus Travel (km)', unit: 'km' },
  { value: 'Train', label: 'Train Travel (km)', unit: 'km' },
  { value: 'Flight', label: 'Flight Travel (km)', unit: 'km' },
  { value: 'Electricity', label: 'Electricity Usage (kWh)', unit: 'kWh' },
  { value: 'Food', label: 'Food Consumption (kg)', unit: 'kg' },
  { value: 'Waste', label: 'Waste Generation (kg)', unit: 'kg' }
];

export const CATEGORY_TYPES = {
  Travel: ['Car', 'Bus', 'Train', 'Flight'],
  Home: ['Electricity', 'Waste'],
  Food: ['Food']
};

export const getCategoryForType = (type) => {
  for (const [category, types] of Object.entries(CATEGORY_TYPES)) {
    if (types.includes(type)) return category;
  }
  return 'Other';
};

export const EMISSION_FACTORS = {
  car_km: 0.192,
  bus_km: 0.105,
  train_km: 0.041,
  flight_km: 0.255,
  electricity_kwh: 0.475,
  food_kg: 2.5,
  waste_kg: 0.5
};

export const EMISSION_FACTOR_MAP = {
  Car: 'car_km',
  Bus: 'bus_km',
  Train: 'train_km',
  Flight: 'flight_km',
  Electricity: 'electricity_kwh',
  Food: 'food_kg',
  Waste: 'waste_kg'
};


