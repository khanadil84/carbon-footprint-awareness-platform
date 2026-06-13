import { useState } from 'react';
import { Button } from '../ui/Button';
import { ActivityService } from '../../utils/activityService';
import { sanitizeNumber, activity } from '../../domain/validation.js';
import { ACTIVITY_OPTIONS } from '../../config/constants.js';

export const ActivityForm = ({ onAdd }) => {
  const [type, setType] = useState('Car');
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const num = sanitizeNumber(value, null);
    if (!activity.isValidValue(num)) {
      setError('Please enter a valid number greater than 0');
      return;
    }
    if (!activity.isValidType(type)) {
      setError('Please select a valid activity type');
      return;
    }
    try {
      const activity = ActivityService.addActivity({ type, value: num });
      setValue('');
      setError('');
      if (onAdd) onAdd(activity);
    } catch (err) {
      setError(err.message || 'Failed to add activity');
    }
  };

  const unit = ACTIVITY_OPTIONS.find(o => o.value === type)?.unit || '';

  return (
    <form onSubmit={handleSubmit} className="activity-form" aria-label="Add activity">
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <label htmlFor="activity-type" style={{ display: 'none' }}>Activity type</label>
        <select id="activity-type" value={type} onChange={(e) => setType(e.target.value)} aria-label="Activity type">
          {ACTIVITY_OPTIONS.map(o => (
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
