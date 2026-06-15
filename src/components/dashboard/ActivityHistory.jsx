import { Fragment, memo, useEffect, useState, useCallback } from 'react';
import { ActivityForm } from './ActivityForm';
import { ActivityCache } from '../../utils/activityCache';
import { HistoryService } from '../../utils/historyService';
import ActivityFilters from './ActivityFilters';
import { Button } from '../ui/Button';
import { STORAGE_KEYS } from '../../config/securityConfig';
import { ACTIVITY_TYPES } from '../../config/constants';
import { useStorageSync } from '../../utils/useStorageSync';

const PAGE_SIZE = 10;

const EmptyState = () => (
  <p className="dfp-placeholder" style={{ marginTop: '1rem' }}>
    No activities found &mdash; try adjusting filters or add a new activity.
  </p>
);

const ActivityRow = ({ activity, isExpanded, onToggleExpand, onDelete }) => (
  <Fragment>
    <tr style={{ borderTop: '1px solid #e5e7eb' }}>
      <td style={{ padding: '8px' }}>{new Date(activity.date).toLocaleString()}</td>
      <td style={{ padding: '8px' }}>{activity.type}</td>
      <td style={{ padding: '8px', textAlign: 'right' }}>{activity.value}</td>
      <td style={{ padding: '8px', textAlign: 'right' }}>{Number(activity.co2).toFixed(3)}</td>
      <td style={{ padding: '8px', textAlign: 'center' }}>
        <Button variant="ghost" onClick={onToggleExpand} aria-expanded={isExpanded} aria-controls={`details-${activity.id}`}>View</Button>
        <Button variant="ghost" onClick={() => onDelete(activity.id)} aria-label={`Delete activity ${activity.type}`}>Delete</Button>
      </td>
    </tr>
    {isExpanded && (
      <tr id={`details-${activity.id}`}>
        <td colSpan={5} style={{ padding: '8px', background: 'var(--bg-primary)' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div><strong>Date:</strong> {new Date(activity.date).toLocaleString()}</div>
            <div><strong>Type:</strong> {activity.type}</div>
            <div><strong>Input value:</strong> {activity.value}</div>
            <div><strong>Estimated CO\u2082:</strong> {activity.co2} kg</div>
            <div><strong>Category:</strong> {activity.type}</div>
          </div>
        </td>
      </tr>
    )}
  </Fragment>
);

export const ActivityHistory = () => {
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ data: [], page: 1, pages: 1, total: 0, stats: {} });
  const [expanded, setExpanded] = useState(null);

  const runQuery = useCallback((currentFilters, currentPage) => {
    const queryResult = HistoryService.queryActivities({ ...currentFilters, page: currentPage, pageSize: PAGE_SIZE });
    setResult(queryResult);
  }, []);

  const refresh = useCallback(() => {
    runQuery(filters, page);
  }, [runQuery, filters, page]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useStorageSync([STORAGE_KEYS.ACTIVITIES], refresh);

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
    setPage(1);
    runQuery(newFilters, 1);
  }, [runQuery]);

  const handleAdd = useCallback(() => {
    runQuery(filters, 1);
    setPage(1);
  }, [runQuery, filters]);

  const handleDelete = useCallback((id) => {
    if (!confirm('Delete this activity?')) return;
    ActivityCache.removeActivity(id);
    runQuery(filters, 1);
    setPage(1);
  }, [runQuery, filters]);

  const handleClearAll = useCallback(() => {
    if (!confirm('Clear all activities? This cannot be undone.')) return;
    ActivityCache.clearActivities();
    setFilters({});
    setPage(1);
    runQuery({}, 1);
  }, [runQuery]);

  const goToPreviousPage = useCallback(() => {
    const previousPage = page - 1;
    setPage(previousPage);
    runQuery(filters, previousPage);
  }, [page, filters, runQuery]);

  const goToNextPage = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);
    runQuery(filters, nextPage);
  }, [page, filters, runQuery]);

  const { stats } = result;

  return (
    <section className="dfp-recent" aria-labelledby="activity-history-heading">
      <div className="dfp-section__header">
        <h2 id="activity-history-heading">Activity History</h2>
      </div>
      <div className="dfp-section__content">
        <ActivityForm onAdd={handleAdd} />
        <div style={{ height: '0.5rem' }} />
        <ActivityFilters filters={filters} onChange={handleFilterChange} types={ACTIVITY_TYPES} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
          <div aria-live="polite" style={{ color: 'var(--text-secondary)' }}>
            {`Showing ${result.data.length} of ${result.total} activities`}
          </div>
          <Button onClick={handleClearAll} variant="ghost">Clear all</Button>
        </div>

        {result.total === 0 ? <EmptyState /> : (
          <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
            <table className="dfp-activity-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <caption className="sr-only">Activity history list</caption>
              <thead>
                <tr>
                  <th scope="col" style={{ textAlign: 'left', padding: '8px' }}>Date</th>
                  <th scope="col" style={{ textAlign: 'left', padding: '8px' }}>Activity</th>
                  <th scope="col" style={{ textAlign: 'right', padding: '8px' }}>Input</th>
                  <th scope="col" style={{ textAlign: 'right', padding: '8px' }}>CO\u2082 (kg)</th>
                  <th scope="col" style={{ padding: '8px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {result.data.map(activity => (
                  <ActivityRow
                    key={activity.id}
                    activity={activity}
                    isExpanded={expanded === activity.id}
                    onToggleExpand={() => setExpanded(expanded === activity.id ? null : activity.id)}
                    onDelete={handleDelete}
                  />
                ))}
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
              <div>
                <strong>Stats:</strong>
                {` ${stats.totalActivities || 0} activities \u2022 ${stats.totalCo2 || 0} kg total \u2022 avg ${stats.avgCo2 || 0} kg`}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button className="btn" onClick={goToPreviousPage} disabled={page <= 1} aria-label="Previous page">Prev</button>
                <span aria-live="polite">Page {page} / {result.pages}</span>
                <button className="btn" onClick={goToNextPage} disabled={page >= result.pages} aria-label="Next page">Next</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default memo(ActivityHistory);
