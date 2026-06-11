import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { StatCard } from '../components/dashboard/StatCard';
import { WelcomeSection } from '../components/dashboard/WelcomeSection';
import { RecentActivity } from '../components/dashboard/RecentActivity';
import { MostRecentActivity } from '../components/dashboard/MostRecentActivity';
import { AIRecommendations } from '../components/dashboard/AIRecommendations';
import { MonthlyGoal } from '../components/dashboard/MonthlyGoal';
import './../components/dashboard/dashboard.css';
import { activityService } from '../utils/activityService';

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

  useEffect(() => {
    const list = activityService.loadActivities();
    setActivities(list);
    const agg = activityService.aggregate(list);
    setTotals(agg.totals);
    setScore(agg.score);
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
          <StatCard title="Carbon Score" value={score} description={score >= 75 ? 'Good — keep it up' : 'Keep improving'} ariaLabel="Carbon score" />
          <MostRecentActivity />
          <StatCard title="Today's CO₂" value={totals.today} unit="kg" ariaLabel="Today's carbon dioxide" />
          <StatCard title="Weekly CO₂" value={totals.weekly} unit="kg" ariaLabel="Weekly carbon dioxide" />
          <StatCard title="Monthly CO₂" value={totals.monthly} unit="kg" ariaLabel="Monthly carbon dioxide" />
        </div>

        <div style={{ height: 'var(--spacing-6)' }} />

        <div className="dfp-grid dfp-grid--two">
          <section aria-labelledby="total-co2-heading">
            <h2 id="total-co2-heading">Total CO₂</h2>
            <div className="dfp-section__content" role="region" aria-label="Total CO2">
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--brand-secondary)' }}>{totals.total} kg</div>
              <p className="dfp-placeholder">Cumulative CO₂ since tracking began.</p>
            </div>
            <div style={{ height: 'var(--spacing-6)' }} />
            <RecentActivity />
          </section>

          <aside aria-labelledby="right-column-heading">
            <h2 id="right-column-heading" className="sr-only">Secondary</h2>
            <AIRecommendations />
            <div style={{ height: 'var(--spacing-4)' }} />
            <MonthlyGoal />
          </aside>
        </div>
      </main>
    </div>
  );
};
