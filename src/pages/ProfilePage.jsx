import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { StatCard } from '../components/dashboard/StatCard';
import { Button } from '../components/ui/Button';
import { ActivityCache } from '../utils/activityCache';
import { GoalService } from '../utils/goalService';
import { STORAGE_KEYS } from '../config/securityConfig';
import { useStorageSync } from '../utils/useStorageSync';
import '../components/dashboard/dashboard.css';
import './profile.css';

const formatDate = (dateString) =>
  dateString ? new Date(dateString).toLocaleDateString() : '\u2014';

const UserAvatar = ({ name }) => {
  const initials = (name || '')
    .split(' ')
    .map(part => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';
  return <div className="profile-avatar" aria-hidden>{initials}</div>;
};

export const ProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [totals, setTotals] = useState({ total: 0, weekly: 0, monthly: 0 });
  const [scoreMeta, setScoreMeta] = useState({});
  const [achievements, setAchievements] = useState([]);
  const [goalSummary, setGoalSummary] = useState(null);

  const loadData = () => {
    const loadedActivities = ActivityCache.getActivities();
    setActivities(loadedActivities);
    const aggregation = ActivityCache.getAggregation();
    setTotals({ total: aggregation.totalSum, weekly: aggregation.weeklySum, monthly: aggregation.monthlySum });
    setScoreMeta(ActivityCache.getScoreAndMeta());
    const goal = GoalService.loadGoal();
    setGoalSummary(ActivityCache.getGoalProgress(goal));
    const achievementResult = ActivityCache.getAchievements(goal);
    setAchievements(achievementResult.achievements || []);
  };

  useEffect(() => {
    loadData();
  }, []);

  useStorageSync([STORAGE_KEYS.ACTIVITIES, STORAGE_KEYS.GOAL, STORAGE_KEYS.ACHIEVEMENTS], loadData);

  const navigateToSettings = () => {
    const settingsElement = document.getElementById('settings-heading');
    if (settingsElement) {
      settingsElement.tabIndex = -1;
      settingsElement.focus();
      settingsElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      navigate('/');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="container" style={{ padding: '1rem 0' }}>
      <header style={{ display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <UserAvatar name={user?.name || user?.email} />
          <div>
            <h1 style={{ margin: 0 }}>{user?.name || user?.email}</h1>
            <div style={{ color: 'var(--text-secondary)' }}>{user?.email}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Joined: {formatDate(user?.createdAt)}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button onClick={navigateToSettings} variant="outline">Settings</Button>
          <Button onClick={handleLogout} variant="ghost" aria-label="Log out">Log out</Button>
        </div>
      </header>

      <main id="main-content" style={{ marginTop: '1rem' }}>
        <div className="dfp-grid dfp-grid--stats" style={{ gap: '1rem' }}>
          <StatCard title="Carbon Score" value={scoreMeta.score || 0} description={scoreMeta.rating || '\u2014'} />
          <StatCard title="Total CO\u2082" value={totals.total} unit="kg" />
          <StatCard title="Weekly CO\u2082" value={totals.weekly} unit="kg" />
          <StatCard title="Monthly CO\u2082" value={totals.monthly} unit="kg" />
        </div>

        <div style={{ height: 'var(--spacing-6)' }} />

        <section className="dfp-section__content">
          <h2>Achievements</h2>
          {achievements.length === 0 ? (
            <p className="dfp-placeholder">No achievements yet.</p>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {achievements.filter(a => a.unlocked).map(achievement => (
                <div key={achievement.id} className="badge earned" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem' }}>
                  <div className="badge-icon">{achievement.icon}</div>
                  <div>
                    <div style={{ fontWeight: 700 }}>{achievement.title}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {formatDate(achievement.unlockedDate)}
                    </div>
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
              <div>Target: {goalSummary.target ? `${goalSummary.target} kg` : '\u2014'}</div>
              <div>Projection: {goalSummary.projection} kg</div>
              <div>Days remaining: {goalSummary.daysRemaining}</div>
              <div style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>{goalSummary.insight}</div>
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
              <div>Total CO\u2082: {totals.total} kg</div>
              <div>Average per activity: {activities.length ? (totals.total / activities.length).toFixed(3) : 0} kg</div>
              <div style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>Personal insight: {scoreMeta.shortExplanation}</div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default ProfilePage;
