import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { ActivityForm } from './ActivityForm';
import { activityService } from '../../utils/activityService';
import { HistoryService } from '../../utils/historyService';
import ActivityFilters from './ActivityFilters';
import { Button } from '../ui/Button';

export const ActivityHistory = () => {
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [result, setResult] = useState({ data: [], page:1, pages:1, total:0, stats: {} });
  const [expanded, setExpanded] = useState(null);

  const types = useMemo(() => ['Car','Bus','Train','Flight','Electricity','Food','Waste'], []);

  const runQuery = useCallback((f = filters, p = page) => {
    const q = HistoryService.queryActivities({ ...f, page: p, pageSize });
    setResult(q);
  }, [filters, page, pageSize]);

  useEffect(() => {
    runQuery();
  }, []);

  useEffect(() => {
    runQuery(filters, 1);
    setPage(1);
  }, [filters]);

  useEffect(() => {
    runQuery(filters, page);
  }, [page]);

  useEffect(() => {
    const onStorage = (e) => { if (['eco_activities_v1'].includes(e.key)) runQuery(); };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [runQuery]);

  const handleAdd = (activity) => {
    runQuery({ ...filters }, 1);
    setPage(1);
  };

  const handleDelete = (id) => {
    if (!confirm('Delete this activity?')) return;
    activityService.removeActivity(id);
    runQuery(filters, 1);
    setPage(1);
  };

  const handleClearAll = () => {
    if (!confirm('Clear all activities? This cannot be undone.')) return;
    activityService.clearActivities();
    setFilters({});
    setPage(1);
    runQuery({},1);
  };

  const { stats } = result;

  return (
    <section className="dfp-recent" aria-labelledby="activity-history-heading">
      <div className="dfp-section__header">
        <h2 id="activity-history-heading">Activity History</h2>
      </div>
      <div className="dfp-section__content">
        <ActivityForm onAdd={handleAdd} />
        <div style={{ height: '0.5rem' }} />
        <ActivityFilters filters={filters} onChange={setFilters} types={types} />

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop: '0.75rem' }}>
          <div aria-live="polite" style={{ color: 'var(--text-secondary)' }}>
            {`Showing ${result.data.length} of ${result.total} activities`}
          </div>
          <div style={{ display:'flex', gap:'0.5rem' }}>
            <Button onClick={handleClearAll} variant="ghost">Clear all</Button>
          </div>
        </div>

        {result.total === 0 ? (
          <p className="dfp-placeholder" style={{ marginTop: '1rem' }}>No activities found — try adjusting filters or add a new activity.</p>
        ) : (
          <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
            <table className="dfp-activity-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '8px' }}>Date</th>
                  <th style={{ textAlign: 'left', padding: '8px' }}>Activity</th>
                  <th style={{ textAlign: 'right', padding: '8px' }}>Input</th>
                  <th style={{ textAlign: 'right', padding: '8px' }}>CO₂ (kg)</th>
                  <th style={{ padding: '8px' }} aria-hidden>Actions</th>
                </tr>
              </thead>
              <tbody>
                {result.data.map(a => (
                  <React.Fragment key={a.id}>
                    <tr style={{ borderTop: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '8px' }}>{new Date(a.date).toLocaleString()}</td>
                      <td style={{ padding: '8px' }}>{a.type}</td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>{a.value}</td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>{Number(a.co2).toFixed(3)}</td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <Button variant="ghost" onClick={() => setExpanded(expanded === a.id ? null : a.id)} aria-expanded={expanded === a.id} aria-controls={`details-${a.id}`}>View</Button>
                        <Button variant="ghost" onClick={() => handleDelete(a.id)} aria-label={`Delete activity ${a.type}`}>Delete</Button>
                      </td>
                    </tr>
                    {expanded === a.id && (
                      <tr id={`details-${a.id}`}>
                        <td colSpan={5} style={{ padding: '8px', background: 'var(--bg-primary)' }}>
                          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            <div><strong>Date:</strong> {new Date(a.date).toLocaleString()}</div>
                            <div><strong>Type:</strong> {a.type}</div>
                            <div><strong>Input value:</strong> {a.value}</div>
                            <div><strong>Estimated CO₂:</strong> {a.co2} kg</div>
                            <div><strong>Category:</strong> {a.type}</div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>

            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop: '0.75rem' }}>
              <div>
                <strong>Stats:</strong> {` ${stats.totalActivities || 0} activities • ${stats.totalCo2 || 0} kg total • avg ${stats.avgCo2 || 0} kg`}
              </div>
              <div style={{ display:'flex', gap:'0.5rem', alignItems:'center' }}>
                <button className="btn" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page <= 1} aria-label="Previous page">Prev</button>
                <span aria-live="polite">Page {page} / {result.pages}</span>
                <button className="btn" onClick={() => setPage(p => Math.min(result.pages, p+1))} disabled={page >= result.pages} aria-label="Next page">Next</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default React.memo(ActivityHistory);
