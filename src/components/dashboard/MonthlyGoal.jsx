import { useEffect, useState, useCallback } from 'react';
import { GoalService } from '../../utils/goalService';
import { STORAGE_KEYS } from '../../config/securityConfig.js';
import { sanitizeNumber } from '../../domain/validation.js';
import { ActivityService } from '../../utils/activityService';
import { Button } from '../ui/Button';

export const MonthlyGoal = () => {
  const [goal, setGoal] = useState(GoalService.loadGoal());
  const [progress, setProgress] = useState(null);
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(goal ? goal.targetKg : '');

  const refresh = useCallback(() => {
    const activities = ActivityService.loadActivities();
    const p = GoalService.computeProgress(activities, goal);
    setProgress(p);
  }, [goal]);

  useEffect(() => {
    refresh();
    const onStorage = (e) => {
      if ([STORAGE_KEYS.ACTIVITIES, STORAGE_KEYS.GOAL].includes(e.key)) {
        setGoal(GoalService.loadGoal());
        refresh();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [refresh]);

  const handleSave = () => {
    const val = sanitizeNumber(input, null);
    if (val === null || val <= 0) return;
    const newGoal = { targetKg: val, updatedAt: new Date().toISOString() };
    GoalService.saveGoal(newGoal);
    setGoal(newGoal);
    setEditing(false);
    refresh();
  };

  const handleClear = () => {
    GoalService.clearGoal();
    setGoal(null);
    setInput('');
    refresh();
  };

  return (
    <section className="dfp-goal" aria-labelledby="dfp-goal-heading">
      <div className="dfp-section__header">
        <h2 id="dfp-goal-heading">Monthly Goal</h2>
      </div>
      <div className="dfp-section__content">
        {!goal ? (
          <div>
            <p className="dfp-placeholder">No monthly goal set.</p>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <input type="number" placeholder="Target kg CO₂" value={input} onChange={e => setInput(e.target.value)} aria-label="Monthly target in kg" />
              <Button variant="primary" onClick={handleSave}>Set Goal</Button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{goal.targetKg} kg</div>
                <div style={{ color: 'var(--text-secondary)' }}>Monthly target</div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button variant="ghost" onClick={() => { setEditing(!editing); setInput(goal.targetKg); }}>{editing ? 'Cancel' : 'Edit'}</Button>
                <Button variant="outline" onClick={handleClear}>Clear</Button>
              </div>
            </div>

            {editing && (
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <input type="number" value={input} onChange={e => setInput(e.target.value)} aria-label="Edit monthly target" />
                <Button variant="primary" onClick={handleSave}>Save</Button>
              </div>
            )}

            {progress && (
              <div style={{ marginTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{progress.current} kg</div>
                    <div style={{ color: 'var(--text-secondary)' }}>Current CO₂ this month</div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700 }}>{progress.remaining > 0 ? `${progress.remaining} kg` : '0 kg'}</div>
                    <div style={{ color: 'var(--text-secondary)' }}>Remaining</div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700 }}>{progress.percent}%</div>
                    <div style={{ color: 'var(--text-secondary)' }}>Completed</div>
                  </div>
                </div>

                <div style={{ marginTop: '0.75rem' }}>
                  <div className="goal-progress-track" aria-hidden>
                    <div className="goal-progress-fill" style={{ width: `${progress.percent}%` }} />
                  </div>
                  <div style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>{progress.daysRemaining} days remaining</div>
                </div>

                <div style={{ marginTop: '0.75rem', color: 'var(--text-secondary)' }}><strong>Status:</strong> {progress.status}</div>
                <div style={{ marginTop: '0.5rem' }}>{progress.insight}</div>

                <div style={{ marginTop: '0.75rem' }}>
                  <div style={{ color: 'var(--text-secondary)' }}>Projected month-end: <strong>{progress.projection} kg</strong></div>
                  <div style={{ color: 'var(--text-secondary)' }}>Improvement needed: <strong>{progress.improvementNeeded} kg</strong></div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default MonthlyGoal;
