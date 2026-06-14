import { memo, useEffect, useState } from 'react';
import { ActivityCache } from '../../utils/activityCache';
import { ExportService } from '../../utils/exportService';
import { STORAGE_KEYS } from '../../config/securityConfig.js';

export const ExportControls = memo(() => {
  const [count, setCount] = useState(0);

  const refresh = () => setCount(ActivityCache.getActivities().length);

  useEffect(() => {
    refresh();
    const onStorage = (e) => { if (e.key === STORAGE_KEYS.ACTIVITIES) { ActivityCache.invalidate(); refresh(); } };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const handleExportActivities = () => {
    const activities = ActivityCache.getActivities();
    ExportService.exportActivitiesCSV(activities);
  };

  const handleExportSummary = () => {
    const activities = ActivityCache.getActivities();
    ExportService.exportDashboardCSV(activities);
  };

  const handlePrint = () => {
    // PrintableReport listens to storage and updates automatically; just trigger print
    window.print();
  };

  return (
    <div className="dfp-export-controls" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }} role="group" aria-label="Export options">
      <button onClick={handleExportActivities} disabled={count === 0} className="btn" aria-disabled={count === 0}>Export Activities CSV</button>
      <button onClick={handleExportSummary} disabled={count === 0} className="btn" aria-disabled={count === 0}>Export Dashboard CSV</button>
      <button onClick={handlePrint} disabled={count === 0} className="btn btn-secondary" aria-disabled={count === 0}>Print Report</button>
    </div>
  );
});

export default ExportControls;
