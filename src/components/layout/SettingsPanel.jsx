import { memo, useEffect, useState } from 'react';
import { SettingsService } from '../../utils/settingsService';
import { STORAGE_KEYS } from '../../config/securityConfig.js';
import '../dashboard/dashboard.css';
import '../dashboard/print.css';
import './settings.css';

export const SettingsPanel = () => {
  const [settings, setSettings] = useState(() => SettingsService.loadSettings());
  const [status, setStatus] = useState('');

  useEffect(() => {
    // listen for external changes
    const onStorage = (e) => { if (e.key === STORAGE_KEYS.SETTINGS) setSettings(SettingsService.loadSettings()); };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const update = (patch) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    if (next.saveMode === 'auto') {
      SettingsService.saveSettings(next);
      setStatus('Settings saved');
      setTimeout(()=>setStatus(''), 1500);
    }
  };

  const handleSave = () => {
    SettingsService.saveSettings(settings);
    setStatus('Settings saved');
    setTimeout(()=>setStatus(''), 1500);
  };

  const handleReset = () => {
    const confirmed = confirm('Reset settings to defaults?');
    if (!confirmed) return;
    const d = SettingsService.resetSettings();
    setSettings(d);
    setStatus('Settings reset');
    setTimeout(()=>setStatus(''), 1500);
  };

  return (
    <section className="dfp-section" aria-labelledby="settings-heading">
      <div className="dfp-section__header">
        <h2 id="settings-heading">Preferences</h2>
      </div>
      <div className="dfp-section__content">
        <form onSubmit={e=>{e.preventDefault(); if (settings.saveMode==='manual') handleSave();}}>
          <div style={{ display:'grid', gap:'0.5rem' }}>
            <label htmlFor="settings-units">Preferred units</label>
            <select id="settings-units" value={settings.units} onChange={e=>update({ units: e.target.value })}>
              <option value="metric">Metric (kg, km)</option>
              <option value="imperial">Imperial (lbs, miles)</option>
            </select>

            <label htmlFor="settings-default-view">Default dashboard view</label>
            <select id="settings-default-view" value={settings.defaultView} onChange={e=>update({ defaultView: e.target.value })}>
              <option value="overview">Overview</option>
              <option value="analytics">Analytics</option>
              <option value="history">History</option>
            </select>

            <label htmlFor="settings-analytics-range">Preferred analytics range</label>
            <select id="settings-analytics-range" value={settings.analyticsRange} onChange={e=>update({ analyticsRange: e.target.value })}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>

            <label htmlFor="settings-notifications" style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
              <input id="settings-notifications" type="checkbox" checked={settings.notificationsEnabled} onChange={e=>update({ notificationsEnabled: e.target.checked })} />
              <span>Enable notifications</span>
            </label>

            <label htmlFor="settings-theme">Theme preference</label>
            <select id="settings-theme" value={settings.theme} onChange={e=>update({ theme: e.target.value })}>
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>

            <label htmlFor="settings-save-mode">Save mode</label>
            <select id="settings-save-mode" value={settings.saveMode} onChange={e=>update({ saveMode: e.target.value })}>
              <option value="auto">Save automatically</option>
              <option value="manual">Save manually</option>
            </select>

            <div style={{ display:'flex', gap:'0.5rem', alignItems:'center' }}>
              <button type="submit" className="btn" disabled={settings.saveMode==='auto'}>Save</button>
              <button type="button" className="btn" onClick={handleReset}>Reset defaults</button>
              <div role="status" aria-live="polite" style={{ color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>{status}</div>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
};

export default memo(SettingsPanel);
