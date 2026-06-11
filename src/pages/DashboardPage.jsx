import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { StatCard } from '../components/dashboard/StatCard';
import { WelcomeSection } from '../components/dashboard/WelcomeSection';
import { RecentActivity } from '../components/dashboard/RecentActivity';
import ActivityHistory from '../components/dashboard/ActivityHistory';
import { MostRecentActivity } from '../components/dashboard/MostRecentActivity';
import { AnalyticsSection } from '../components/dashboard/AnalyticsSection';
import { AIRecommendations } from '../components/dashboard/AIRecommendations';
import { Badges } from '../components/dashboard/Badges';
import { ExportControls } from '../components/dashboard/ExportControls';
import PrintableReport from '../components/dashboard/PrintableReport';
import { MonthlyGoal } from '../components/dashboard/MonthlyGoal';
import SettingsPanel from '../components/layout/SettingsPanel';
import './../components/dashboard/dashboard.css';
import { activityService } from '../utils/activityService';
import { calculateCarbonScore } from '../utils/carbonScoreService';
import { SettingsService } from '../utils/settingsService';

export const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) return null;

  const [activities, setActivities] = useState([]);
  const [totals, setTotals] = useState({ today: 0, weekly: 0, monthly: 0, total: 0 });
  const [score, setScore] = useState(0);
  const [carbonMeta, setCarbonMeta] = useState({});

  const refreshAll = (list) => {
    const l = list || activityService.loadActivities();
    setActivities(l);
    const agg = activityService.aggregate(l);
    setTotals(agg.totals);
    const cs = calculateCarbonScore(l);
    setScore(cs.score);
    setCarbonMeta(cs);
  };

  const settings = useMemo(() => SettingsService.loadSettings(), []);

  useEffect(() => {
    // Load settings and apply default view + refresh data
    refreshAll();

    // Apply defaultView: focus the relevant section heading for accessibility
    try {
      const map = {
        overview: 'dfp-welcome-heading',
        analytics: 'dfp-analytics-heading',
        history: 'activity-history-heading'
      };
      const id = map[settings && settings.defaultView] || map.overview;
      const el = document.getElementById(id);
      if (el) {
        // make focusable and focus for keyboard users
        el.tabIndex = -1;
        el.focus();
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } catch (e) {
      // fail silently — settings are optional
      console.warn('Failed to apply default view', e);
    }
  }, []);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'eco_activities_v1') refreshAll(activityService.loadActivities());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return (
    <div>
      <header className="container dfp-topbar" role="banner">
        <div className="dfp-brand" aria-hidden="true">
          <LayoutDashboard />
          <span>EcoTrack</span>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div aria-live="polite" style={{ color: 'var(--text-secondary)' }}>Welcome, {user.name || user.email}</div>
          <Button variant="outline" size="sm" onClick={handleLogout} aria-label="Sign out">
            <LogOut size={16} aria-hidden="true" />
            <span style={{ marginLeft: '0.5rem' }}>Sign out</span>
          </Button>
        </div>
      </header>

      <WelcomeSection user={user} />

      <main className="container dfp-dashboard" role="main">
        <div className="dfp-grid dfp-grid--stats" aria-hidden>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <StatCard title="Carbon Score" value={score} description={score >= 75 ? 'Good — keep it up' : 'Keep improving'} ariaLabel="Carbon score" />
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span className="carbon-badge" aria-hidden style={{ padding: '0.25rem 0.5rem', borderRadius: '999px', background: 'linear-gradient(90deg,var(--color-emerald-50),var(--color-teal-100))', color: 'var(--brand-primary)', fontWeight: 700 }}>{carbonMeta.rating || '—'}</span>
              <span className="carbon-trend" aria-live="polite" style={{ color: 'var(--text-secondary)' }}>{carbonMeta.trend ? `Trend: ${carbonMeta.trend}` : ''}</span>
            </div>
          </div>
            <MostRecentActivity />
          <StatCard title="Today's CO₂" value={totals.today} unit="kg" ariaLabel="Today's carbon dioxide" />
          <StatCard title="Weekly CO₂" value={totals.weekly} unit="kg" ariaLabel="Weekly carbon dioxide" />
          <StatCard title="Monthly CO₂" value={totals.monthly} unit="kg" ariaLabel="Monthly carbon dioxide" />
        </div>

        <div style={{ height: 'var(--spacing-6)' }} />

        <AnalyticsSection activitiesProp={activities} preferredRange={settings.analyticsRange} />

        <div style={{ height: 'var(--spacing-6)' }} />

        <div className="dfp-grid dfp-grid--two">
          <section aria-labelledby="total-co2-heading">
            <h2 id="total-co2-heading">Total CO₂</h2>
            <div className="dfp-section__content" role="region" aria-label="Total CO2">
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--brand-secondary)' }}>{totals.total} kg</div>
              <p className="dfp-placeholder">Cumulative CO₂ since tracking began.</p>
            </div>
            <div style={{ height: 'var(--spacing-6)' }} />
            <ActivityHistory />
          </section>

          <aside aria-labelledby="right-column-heading">
            <h2 id="right-column-heading" className="sr-only">Secondary</h2>
            <ExportControls />
            <Badges />
            <div style={{ height: 'var(--spacing-2)' }} />
            <AIRecommendations />
            <PrintableReport />
            <div style={{ height: 'var(--spacing-4)' }} />
            <SettingsPanel />
            <div style={{ height: 'var(--spacing-4)' }} />
            <MonthlyGoal />
          </aside>
        </div>
      </main>
    </div>
  );
};
