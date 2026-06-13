import { useEffect, useState } from 'react';
import { ActivityService } from '../../utils/activityService';
import { ExportService } from '../../utils/exportService';
import { STORAGE_KEYS } from '../../config/securityConfig.js';

export const ExportControls = () => {
  const [count, setCount] = useState(0);

  const refresh = () => setCount(ActivityService.loadActivities().length);

  useEffect(() => {
    refresh();
    const onStorage = (e) => { if (e.key === STORAGE_KEYS.ACTIVITIES) refresh(); };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const handleExportActivities = () => {
    const activities = ActivityService.loadActivities();
    ExportService.exportActivitiesCSV(activities);
  };

  const handleExportSummary = () => {
    const activities = ActivityService.loadActivities();
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
