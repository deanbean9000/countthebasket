import { useState } from 'react';
import './LeagueGate.css';

function LeagueGate({ onEnterLeague }) {
  const [tab, setTab] = useState('join');
  const [leagueName, setLeagueName] = useState('');
  const [key, setKey] = useState('');
  const [confirmKey, setConfirmKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || window.location.origin.replace('-5173', '-3001');

  const switchTab = (t) => {
    setTab(t);
    setError('');
    setKey('');
    setConfirmKey('');
    setLeagueName('');
    setShowKey(false);
  };

  const createLeague = async () => {
    if (!leagueName.trim()) return setError('Please enter a league name.');
    if (key.length < 4) return setError('Key must be at least 4 characters.');
    if (key !== confirmKey) return setError('Keys do not match. Please re-enter.');
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/leagues/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: leagueName.trim(), key }),
      });
      const data = await res.json();
      if (res.ok) {
        onEnterLeague(data);
      } else {
        setError(data.message || 'Failed to create league.');
      }
    } catch {
      setError('Connection failed. Make sure the backend is running on port 3001.');
    } finally {
      setLoading(false);
    }
  };

  const joinLeague = async () => {
    if (!key.trim()) return setError('Please enter a league key.');
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/leagues/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });
      const data = await res.json();
      if (res.ok) {
        onEnterLeague(data);
      } else {
        setError(data.message || 'Could not join league.');
      }
    } catch {
      setError('Connection failed. Make sure the backend is running on port 3001.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (tab === 'join') joinLeague();
      else if (tab === 'create') createLeague();
    }
  };

  return (
    <div className="league-gate">
      <div className="league-gate-card">
        <span className="league-gate-logo">🏀</span>
        <h1 className="league-gate-title">Count The Basket</h1>
        <p className="league-gate-subtitle">Enter your league to get started</p>

        <div className="league-tabs">
          <button
            className={`league-tab ${tab === 'join' ? 'active' : ''}`}
            onClick={() => switchTab('join')}
          >
            🔑 Join League
          </button>
          <button
            className={`league-tab ${tab === 'create' ? 'active' : ''}`}
            onClick={() => switchTab('create')}
          >
            ➕ Create League
          </button>
        </div>

        <div className="league-form">
          {tab === 'create' && (
            <input
              type="text"
              className="league-input"
              placeholder="League Name (e.g. Tuesday Night Hoops)"
              value={leagueName}
              onChange={e => setLeagueName(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={60}
            />
          )}

          <div className="key-row">
            <input
              type={showKey ? 'text' : 'password'}
              className="league-input"
              placeholder={tab === 'create' ? 'Create a secret key (min. 4 chars)' : 'Enter league key'}
              value={key}
              onChange={e => setKey(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={100}
            />
            <button
              className="btn-eye"
              onClick={() => setShowKey(v => !v)}
              type="button"
              aria-label={showKey ? 'Hide key' : 'Show key'}
            >
              {showKey ? '🙈' : '👁️'}
            </button>
          </div>

          {tab === 'create' && (
            <input
              type={showKey ? 'text' : 'password'}
              className="league-input"
              placeholder="Confirm key"
              value={confirmKey}
              onChange={e => setConfirmKey(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={100}
            />
          )}

          {error && <p className="league-error">{error}</p>}

          <button
            className="btn-league-action"
            onClick={tab === 'create' ? createLeague : joinLeague}
            disabled={loading}
          >
            {loading
              ? 'Please wait...'
              : tab === 'create'
              ? '➕ Create & Enter League'
              : '🔑 Enter League'}
          </button>
        </div>

        {tab === 'join' && (
          <p className="league-hint">
            Don't have a league? Switch to <strong>Create League</strong> above.
          </p>
        )}
        {tab === 'create' && (
          <p className="league-hint">
            Share your key with teammates so they can join with <strong>Join League</strong>.
          </p>
        )}
      </div>
    </div>
  );
}

export default LeagueGate;
