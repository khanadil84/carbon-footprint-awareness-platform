import React from 'react';

export const MonthlyGoal = () => {
  return (
    <section className="dfp-goal" aria-labelledby="dfp-goal-heading">
      <div className="dfp-section__header">
        <h2 id="dfp-goal-heading">Monthly Goal</h2>
      </div>
      <div className="dfp-section__content">
        <p className="dfp-placeholder">Set a monthly CO₂ reduction goal to track progress here.</p>
      </div>
    </section>
  );
};

export default MonthlyGoal;
