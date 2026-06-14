import { useEffect, useMemo, useState, useCallback, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { Button } from '../components/ui/Button';
import { StatCard } from '../components/dashboard/StatCard';
import { WelcomeSection } from '../components/dashboard/WelcomeSection';
// RecentActivity import removed (not used in this view)
import { MostRecentActivity } from '../components/dashboard/MostRecentActivity';

// Lazy-load heavier dashboard widgets to improve initial rendering performance
const ActivityHistory = lazy(() => import('../components/dashboard/ActivityHistory'));
const AnalyticsSection = lazy(() => import('../components/dashboard/AnalyticsSection'));
const AIRecommendations = lazy(() => import('../components/dashboard/AIRecommendations'));
const Badges = lazy(() => import('../components/dashboard/Badges'));
const ExportControls = lazy(() => import('../components/dashboard/ExportControls'));
const PrintableReport = lazy(() => import('../components/dashboard/PrintableReport'));
const MonthlyGoal = lazy(() => import('../components/dashboard/MonthlyGoal'));
const SettingsPanel = lazy(() => import('../components/layout/SettingsPanel'));
import '../components/dashboard/dashboard.css';
import { ActivityCache } from '../utils/activityCache';
import { SettingsService } from '../utils/settingsService';
import { STORAGE_KEYS } from '../config/securityConfig.js';

export const DashboardPage = () => {

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activities, setActivities] = useState([]);
  const [totals, setTotals] = useState({ today: 0, weekly: 0, monthly: 0, total: 0 });
  const [score, setScore] = useState(0);
  const [carbonMeta, setCarbonMeta] = useState({});

  const handleLogout = useCallback(() => {
    logout();
    navigate('/');
  }, [logout, navigate]);

  const refreshAll = useCallback(() => {
    const l = ActivityCache.getActivities();
    setActivities(l);
    const agg = ActivityCache.getAggregation();
    setTotals({ today: agg.todaySum, weekly: agg.weeklySum, monthly: agg.monthlySum, total: agg.totalSum });
    const cs = ActivityCache.getScoreAndMeta();
    setScore(cs.score);
    setCarbonMeta(cs);
  }, []);
  const settings = useMemo(() => SettingsService.loadSettings(), []);

  useEffect(() => {
    refreshAll();

    try {
      const map = {
        overview: 'dfp-welcome-heading',
        analytics: 'dfp-analytics-heading',
        history: 'activity-history-heading'
      };
      const id = map[settings && settings.defaultView] || map.overview;
      const el = document.getElementById(id);
      if (el) {
        el.tabIndex = -1;
        el.focus();
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } catch (e) {
      console.warn('Failed to apply default view', e);
    }
  }, [refreshAll, settings]);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEYS.ACTIVITIES) {
        ActivityCache.invalidate();
        refreshAll();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [refreshAll]);

  if (!user) return null;

  return (
    <div>
      <header className="container dfp-topbar">
        <div className="dfp-brand">
          <LayoutDashboard aria-hidden="true" />
          <span>EcoTrack</span>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span>Welcome, {user.name || user.email}</span>
          <Button variant="outline" size="sm" onClick={handleLogout} aria-label="Sign out">
            <LogOut size={16} aria-hidden="true" />
            <span style={{ marginLeft: '0.5rem' }}>Sign out</span>
          </Button>
        </div>
      </header>

      <WelcomeSection user={user} />

      <main className="container dfp-dashboard">
        <div className="dfp-grid dfp-grid--stats">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <StatCard title="Carbon Score" value={score} description={score >= 75 ? 'Good — keep it up' : 'Keep improving'} ariaLabel="Carbon score" />
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span className="carbon-badge" style={{ padding: '0.25rem 0.5rem', borderRadius: '999px', background: 'linear-gradient(90deg,var(--color-emerald-50),var(--color-teal-100))', color: 'var(--brand-primary)', fontWeight: 700 }}>{carbonMeta.rating || '\u2014'}</span>
              <span className="carbon-trend" style={{ color: 'var(--text-secondary)' }}>{carbonMeta.trend ? `Trend: ${carbonMeta.trend}` : ''}</span>
            </div>
          </div>
          <MostRecentActivity />
          <StatCard title="Today's CO\u2082" value={totals.today} unit="kg" ariaLabel="Today's carbon dioxide" />
          <StatCard title="Weekly CO\u2082" value={totals.weekly} unit="kg" ariaLabel="Weekly carbon dioxide" />
          <StatCard title="Monthly CO\u2082" value={totals.monthly} unit="kg" ariaLabel="Monthly carbon dioxide" />
        </div>

        <div style={{ height: 'var(--spacing-6)' }} />

        <Suspense fallback={<span role="status">Loading analytics\u2026</span>}>
          <AnalyticsSection activitiesProp={activities} preferredRange={settings.analyticsRange} />
        </Suspense>

        <div style={{ height: 'var(--spacing-6)' }} />

        <div className="dfp-grid dfp-grid--two">
          <section aria-labelledby="total-co2-heading">
            <h2 id="total-co2-heading">Total CO\u2082</h2>
            <div className="dfp-section__content">
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--brand-secondary)' }}>{totals.total} kg</div>
              <p className="dfp-placeholder">Cumulative CO\u2082 since tracking began.</p>
            </div>
            <div style={{ height: 'var(--spacing-6)' }} />
            <ActivityHistory />
          </section>

          <aside aria-labelledby="right-column-heading">
            <h2 id="right-column-heading" className="sr-only">Secondary</h2>
            <Suspense fallback={<span role="status">Loading tools\u2026</span>}>
              <ExportControls />
              <Badges />
            </Suspense>
            <div style={{ height: 'var(--spacing-2)' }} />
            <Suspense fallback={<span role="status">Loading recommendations\u2026</span>}>
              <AIRecommendations />
              <PrintableReport />
            </Suspense>
            <div style={{ height: 'var(--spacing-4)' }} />
            <Suspense fallback={<span role="status">Loading settings\u2026</span>}>
              <SettingsPanel />
            </Suspense>
            <div style={{ height: 'var(--spacing-4)' }} />
            <Suspense fallback={<span role="status">Loading goals\u2026</span>}>
              <MonthlyGoal />
            </Suspense>
          </aside>
        </div>
      </main>
    </div>
  );
};
