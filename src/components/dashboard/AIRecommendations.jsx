import { memo, useCallback, useEffect, useState } from 'react';
import { ActivityCache } from '../../utils/activityCache';
import { useStorageSync } from '../../utils/useStorageSync';
import { STORAGE_KEYS } from '../../config/securityConfig.js';

const RecommendationCard = ({ rec }) => (
  <li style={{ marginBottom: '0.75rem', padding: '0.5rem', border: '1px solid var(--color-gray-200)', borderRadius: '8px', background: 'var(--bg-primary)' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <strong>{rec.title}</strong>
      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{rec.priority}</span>
    </div>
    <div style={{ marginTop: '0.25rem', color: 'var(--text-secondary)' }}>{rec.description}</div>
    <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
      <div style={{ fontWeight: 600 }}>{rec.estimatedSavingsKg} kg</div>
      <div style={{ color: 'var(--text-secondary)' }}>{rec.suggestion}</div>
    </div>
    {rec.encouragement && <div style={{ marginTop: '0.5rem', color: 'var(--brand-secondary)' }}>{rec.encouragement}</div>}
  </li>
);

export const AIRecommendations = () => {
  const [recs, setRecs] = useState([]);

  const refresh = useCallback(() => {
    setRecs(ActivityCache.getRecommendations());
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  useStorageSync([STORAGE_KEYS.ACTIVITIES], refresh);

  return (
    <section className="dfp-ai" aria-labelledby="dfp-ai-heading">
      <div className="dfp-section__header">
        <h2 id="dfp-ai-heading">Recommendations</h2>
      </div>
      <div className="dfp-section__content">
        {recs.length === 0 ? (
          <p className="dfp-placeholder">No recommendations at the moment.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {recs.map(rec => (
              <RecommendationCard key={rec.title} rec={rec} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

export default memo(AIRecommendations);
