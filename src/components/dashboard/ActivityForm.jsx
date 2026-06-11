import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { activityService } from '../../utils/activityService';

const activityOptions = [
  { value: 'Car', label: 'Car Travel (km)', unit: 'km' },
  { value: 'Bus', label: 'Bus Travel (km)', unit: 'km' },
  { value: 'Train', label: 'Train Travel (km)', unit: 'km' },
  { value: 'Flight', label: 'Flight Travel (km)', unit: 'km' },
  { value: 'Electricity', label: 'Electricity Usage (kWh)', unit: 'kWh' },
  { value: 'Food', label: 'Food Consumption (kg)', unit: 'kg' },
  { value: 'Waste', label: 'Waste Generation (kg)', unit: 'kg' }
];

export const ActivityForm = ({ onAdd }) => {
  const [type, setType] = useState('Car');
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const num = Number(value);
    if (!value || isNaN(num) || num <= 0) {
      setError('Please enter a valid number greater than 0');
      return;
    }
    const activity = activityService.addActivity({ type, value: num });
    setValue('');
    setError('');
    if (onAdd) onAdd(activity);
  };

  const unit = activityOptions.find(o => o.value === type)?.unit || '';

  return (
    <form onSubmit={handleSubmit} className="activity-form" aria-label="Add activity">
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <label htmlFor="activity-type" style={{ display: 'none' }}>Activity type</label>
        <select id="activity-type" value={type} onChange={(e) => setType(e.target.value)} aria-label="Activity type">
          {activityOptions.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <label htmlFor="activity-value" style={{ display: 'none' }}>Value</label>
        <input
          id="activity-value"
          name="activity-value"
          type="number"
          step="any"
          min="0"
          placeholder={`Enter amount (${unit})`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-label={`Value in ${unit}`}
        />

        <Button type="submit" variant="primary">Add</Button>
      </div>
      {error && <div role="alert" style={{ color: '#b91c1c', marginTop: '0.5rem' }}>{error}</div>}
    </form>
  );
};

export default ActivityForm;
