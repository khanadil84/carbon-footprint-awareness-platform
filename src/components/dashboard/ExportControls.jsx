import React, { useEffect, useState } from 'react';
import { activityService } from '../../utils/activityService';
import { ExportService } from '../../utils/exportService';

export const ExportControls = () => {
  const [count, setCount] = useState(0);

  const refresh = () => setCount(activityService.loadActivities().length);

  useEffect(() => {
    refresh();
    const onStorage = (e) => { if (e.key === 'eco_activities_v1') refresh(); };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const handleExportActivities = () => {
    const activities = activityService.loadActivities();
    ExportService.exportActivitiesCSV(activities);
  };

  const handleExportSummary = () => {
    const activities = activityService.loadActivities();
    ExportService.exportDashboardCSV(activities);
  };

  const handlePrint = () => {
    // PrintableReport listens to storage and updates automatically; just trigger print
    window.print();
  };

  return (
    <div className="dfp-export-controls" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
      <button onClick={handleExportActivities} disabled={count === 0} className="btn">Export Activities CSV</button>
      <button onClick={handleExportSummary} disabled={count === 0} className="btn">Export Dashboard CSV</button>
      <button onClick={handlePrint} disabled={count === 0} className="btn btn-secondary">Print Report</button>
    </div>
  );
};

export default ExportControls;
