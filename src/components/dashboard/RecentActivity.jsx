import React from 'react';

export const RecentActivity = () => {
  return (
    <section className="dfp-recent" aria-labelledby="dfp-recent-heading">
      <div className="dfp-section__header">
        <h2 id="dfp-recent-heading">Recent Activity</h2>
      </div>
      <div className="dfp-section__content">
        <p className="dfp-placeholder">No recent activity to display. This area will surface recent CO₂-related actions.</p>
      </div>
    </section>
  );
};

export default RecentActivity;
