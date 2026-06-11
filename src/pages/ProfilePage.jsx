import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { StatCard } from '../components/dashboard/StatCard';
import { Button } from '../components/ui/Button';
import { activityService } from '../utils/activityService';
import { calculateCarbonScore } from '../utils/carbonScoreService';
import { AchievementService } from '../utils/achievementService';
import { GoalService } from '../utils/goalService';
import './../components/dashboard/dashboard.css';
import './profile.css';

const Avatar = ({ name }) => {
  const initials = (name || '').split(' ').map(s => s[0]).filter(Boolean).slice(0,2).join('').toUpperCase() || '?';
  return (
    <div className="profile-avatar" aria-hidden>
      {initials}
    </div>
  );
};

export const ProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [scoreMeta, setScoreMeta] = useState({});
  const [achievements, setAchievements] = useState([]);
  const [goalSummary, setGoalSummary] = useState(null);

  useEffect(() => {
    const load = () => {
      const acts = activityService.loadActivities();
      setActivities(acts);
      setScoreMeta(calculateCarbonScore(acts));
      const goal = GoalService.loadGoal();
      setGoalSummary(GoalService.computeProgress(acts, goal));
      const ach = AchievementService.evaluateAchievements(acts, goal);
      setAchievements(ach.achievements || []);
    };
    load();
    const onStorage = (e) => { if (['eco_activities_v1','eco_goal_v1','eco_achievements_v1'].includes(e.key)) load(); };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const agg = activityService.aggregate(activities || []);

  const handleSettings = () => {
    // If settings panel is present on the page, focus it; otherwise navigate to dashboard root
    const el = document.getElementById('settings-heading');
    if (el) { el.tabIndex = -1; el.focus(); el.scrollIntoView({behavior:'smooth', block:'center'}); }
    else navigate('/');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="container" style={{ padding: '1rem 0' }}>
      <header style={{ display:'flex', gap:'1rem', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', gap:'1rem', alignItems:'center' }}>
          <Avatar name={user?.name || user?.email} />
          <div>
            <h1 style={{ margin:0 }}>{user?.name || user?.email}</h1>
            <div style={{ color:'var(--text-secondary)' }}>{user?.email}</div>
            <div style={{ color:'var(--text-secondary)', fontSize:'0.9rem' }}>Joined: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</div>
          </div>
        </div>

        <div style={{ display:'flex', gap:'0.5rem' }}>
          <Button onClick={handleSettings} variant="outline">Settings</Button>
          <Button onClick={handleLogout} variant="ghost">Log out</Button>
        </div>
      </header>

      <main style={{ marginTop: '1rem' }}>
        <div className="dfp-grid dfp-grid--stats" style={{ gap: '1rem' }}>
          <StatCard title="Carbon Score" value={scoreMeta.score || 0} description={scoreMeta.rating || '—'} />
          <StatCard title="Total CO₂" value={agg.totals.total} unit="kg" />
          <StatCard title="Weekly CO₂" value={agg.totals.weekly} unit="kg" />
          <StatCard title="Monthly CO₂" value={agg.totals.monthly} unit="kg" />
        </div>

        <div style={{ height: 'var(--spacing-6)' }} />

        <section className="dfp-section__content">
          <h2>Achievements</h2>
          {achievements.length === 0 ? (
            <p className="dfp-placeholder">No achievements yet.</p>
          ) : (
            <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
              {achievements.filter(a=>a.unlocked).map(a => (
                <div key={a.id} className="badge earned" style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.5rem' }}>
                  <div className="badge-icon">{a.icon}</div>
                  <div>
                    <div style={{ fontWeight:700 }}>{a.title}</div>
                    <div style={{ fontSize:'0.85rem', color:'var(--text-secondary)' }}>{a.unlockedDate ? new Date(a.unlockedDate).toLocaleDateString() : ''}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div style={{ height: 'var(--spacing-4)' }} />

        <section className="dfp-section__content">
          <h2>Goal Summary</h2>
          {goalSummary ? (
            <div>
              <div>Status: {goalSummary.status}</div>
              <div>Current month: {goalSummary.current} kg</div>
              <div>Target: {goalSummary.target ? `${goalSummary.target} kg` : '—'}</div>
              <div>Projection: {goalSummary.projection} kg</div>
              <div>Days remaining: {goalSummary.daysRemaining}</div>
              <div style={{ marginTop: '0.5rem', color:'var(--text-secondary)' }}>{goalSummary.insight}</div>
            </div>
          ) : (
            <p className="dfp-placeholder">No goal set yet.</p>
          )}
        </section>

        <div style={{ height: 'var(--spacing-4)' }} />

        <section className="dfp-section__content">
          <h2>Activity Summary</h2>
          {activities.length === 0 ? (
            <p className="dfp-placeholder">No activities logged yet.</p>
          ) : (
            <div>
              <div>Total activities: {activities.length}</div>
              <div>Total CO₂: {agg.totals.total} kg</div>
              <div>Average per activity: {activities.length ? (agg.totals.total / activities.length).toFixed(3) : 0} kg</div>
              <div style={{ marginTop: '0.5rem', color:'var(--text-secondary)' }}>Personal insight: {scoreMeta.shortExplanation}</div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default ProfilePage;
