
import React, { useEffect, useState } from 'react';
import api, { getError } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Save, Link2, Code2, RefreshCw } from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();

  const [profile, setProfile] = useState({ bio: '', avatar_url: '' });
  const [social, setSocial] = useState([]);
  const [coding, setCoding] = useState([]);
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [socialPlatform, setSocialPlatform] = useState('INSTAGRAM');
  const [socialUrl, setSocialUrl] = useState('');
  const [codePlatform, setCodePlatform] = useState('LEETCODE');
  const [username, setUsername] = useState('');
  const [url, setUrl] = useState('');
  const [stats, setStats] = useState({});
  const [syncing, setSyncing] = useState({});
  const [notice, setNotice] = useState('');
  const [err, setErr] = useState('');

  // Load saved coding statistics
  const loadStats = async (profiles) => {
    const results = await Promise.all(
      profiles.map(async (c) => {
        try {
          const r = await api.get(`/api/coding-stats/${c.profile_id}`);

          let data = r.data;

          // Handle different possible API response formats
          if (data?.stats) data = data.stats;
          if (data?.data) data = data.data;
          if (Array.isArray(data)) {
            data = data.length ? data[data.length - 1] : null;
          }

          return [c.profile_id, data];
        } catch {
          return [c.profile_id, null];
        }
      })
    );

    const newStats = {};
    results.forEach(([id, data]) => {
      if (data) newStats[id] = data;
    });

    setStats(newStats);
  };

  const load = async () => {
    setErr('');

    try {
      const [p, s, c] = await Promise.all([
        api.get('/api/profile'),
        api.get('/api/social'),
        api.get('/api/coding'),
      ]);

      setProfile(p.data);
      setBio(p.data.bio || '');
      setAvatar(p.data.avatar_url || '');
      setSocial(s.data || []);

      const codingProfiles = c.data || [];
      setCoding(codingProfiles);

      // Automatically load previously saved coding statistics
      await loadStats(codingProfiles);
    } catch (e) {
      setErr(getError(e));
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    try {
      await api.put('/api/profile', {
        bio,
        avatar_url: avatar,
      });
      setNotice('Profile saved successfully');
      setErr('');
    } catch (e) {
      setErr(getError(e));
    }
  };

  const addSocial = async () => {
    try {
      await api.post('/api/social', {
        platform: socialPlatform,
        profile_url: socialUrl,
      });

      setSocialUrl('');
      await load();
      setNotice('Social profile added');
      setErr('');
    } catch (e) {
      setErr(getError(e));
    }
  };

  const addCoding = async () => {
    try {
      await api.post('/api/coding', {
        platform: codePlatform,
        username,
        profile_url: url,
      });

      setUsername('');
      setUrl('');
      await load();
      setNotice('Coding profile added');
      setErr('');
    } catch (e) {
      setErr(getError(e));
    }
  };

  const sync = async (id) => {
    setSyncing((s) => ({ ...s, [id]: true }));
    setErr('');
    setNotice('');

    try {
      await api.post(`/api/coding-stats/${id}/sync`);

      // Fetch the newly saved stats from the database
      const r = await api.get(`/api/coding-stats/${id}`);

      let data = r.data;
      if (data?.stats) data = data.stats;
      if (data?.data) data = data.data;
      if (Array.isArray(data)) {
        data = data.length ? data[data.length - 1] : null;
      }

      if (data) {
        setStats((s) => ({ ...s, [id]: data }));
      }

      setNotice('Coding stats synced successfully!');
    } catch (e) {
      setErr(getError(e));
    } finally {
      setSyncing((s) => ({ ...s, [id]: false }));
    }
  };

  const getStat = (data, keys) => {
    for (const key of keys) {
      if (data?.[key] !== undefined && data?.[key] !== null) {
        return data[key];
      }
    }
    return '—';
  };

  return (
    <div className="page-narrow">
      <div className="page-heading">
        <div>
          <div className="eyebrow">YOUR SPACE</div>
          <h1>My profile</h1>
          <p>Manage your campus identity and developer profiles.</p>
        </div>
      </div>

      {/* Profile */}
      <div className="card profile-card">
        <div className="profile-cover">
          <div className="profile-avatar">
            {avatar ? (
              <img src={avatar} alt="Profile avatar" />
            ) : (
              user?.full_name?.[0] || 'S'
            )}
          </div>
        </div>

        {/* Do not use email as the name fallback */}
        <h2>{user?.full_name || 'Student'}</h2>
        <p className="muted">CampusConnect member</p>

        <label>Bio</label>
        <textarea
          className="field-textarea"
          rows={3}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell the campus about yourself"
        />

        <label>Avatar URL</label>
        <input
          value={avatar}
          onChange={(e) => setAvatar(e.target.value)}
          placeholder="https://..."
        />

        <button className="primary" onClick={save}>
          <Save size={16} /> Save profile
        </button>
      </div>

      {notice && <p className="success-text">{notice}</p>}
      {err && <p className="error-text">{err}</p>}

      {/* Social links */}
      <div className="card section-card">
        <h3><Link2 size={18} /> Social links</h3>

        <div className="form-row">
          <select
            value={socialPlatform}
            onChange={(e) => setSocialPlatform(e.target.value)}
          >
            {['INSTAGRAM', 'LINKEDIN', 'GITHUB', 'X'].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>

          <input
            value={socialUrl}
            onChange={(e) => setSocialUrl(e.target.value)}
            placeholder="Profile URL"
          />

          <button className="primary" onClick={addSocial}>Add</button>
        </div>

        {social.map((s) => (
          <div className="data-row" key={s.account_id}>
            <span>{s.platform}</span>
            <a href={s.profile_url} target="_blank" rel="noreferrer">
              Open profile ↗
            </a>
          </div>
        ))}
      </div>

      {/* Coding profiles */}
      <div className="card section-card">
        <h3><Code2 size={18} /> Coding profiles</h3>

        <div className="form-row">
          <select
            value={codePlatform}
            onChange={(e) => setCodePlatform(e.target.value)}
          >
            <option>LEETCODE</option>
            <option>CODEFORCES</option>
          </select>

          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
          />

          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Profile URL"
          />

          <button className="primary" onClick={addCoding}>Add</button>
        </div>

        {coding.map((c) => {
          const st = stats[c.profile_id];

          return (
            <div className="coding-entry" key={c.profile_id}>
              <div className="coding-profile-info">
                <b>{c.platform}</b>

                {/* Show coding username, never institute email */}
                <p>{c.username || 'Username not set'}</p>

                <a href={c.profile_url} target="_blank" rel="noreferrer">
                  Visit profile ↗
                </a>
              </div>

              <button
                className="secondary"
                onClick={() => sync(c.profile_id)}
                disabled={syncing[c.profile_id]}
              >
                <RefreshCw size={15} />
                {syncing[c.profile_id] ? 'Syncing...' : 'Sync stats'}
              </button>

              {st && (
                <div className="stat-chips">
                  <span>
                    Solved {getStat(st, ['problems_solved', 'total_solved'])}
                  </span>

                  <span>
                    Rating {getStat(st, ['rating', 'contest_rating'])}
                  </span>

                  <span>
                    Contests {getStat(st, ['contests_participated', 'contests'])}
                  </span>

                  <span>
                    Easy {getStat(st, ['easy_solved', 'easy'])}
                  </span>

                  <span>
                    Medium {getStat(st, ['medium_solved', 'medium'])}
                  </span>

                  <span>
                    Hard {getStat(st, ['hard_solved', 'hard'])}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
