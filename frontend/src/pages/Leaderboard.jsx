
import React, { useEffect, useMemo, useState } from 'react';
import api, { getError } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Trophy, RefreshCw, ExternalLink, Code2 } from 'lucide-react';

const styles = {
  page: { width: '100%', maxWidth: 1250, margin: '0 auto', paddingBottom: 40 },
  heading: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 26 },
  eyebrow: { color: '#a18cff', fontSize: 11, fontWeight: 800, letterSpacing: 2, marginBottom: 9 },
  title: { fontSize: 34, fontWeight: 800, margin: '0 0 8px', color: '#f4f1ff' },
  subtitle: { margin: 0, color: '#9692a8', fontSize: 14 },
  refresh: { background: '#1b1a25', border: '1px solid #302e3d', color: '#d8d1ff', borderRadius: 12, padding: 12, cursor: 'pointer' },
  tabs: { display: 'flex', gap: 10, marginBottom: 22 },
  tab: { padding: '12px 18px', borderRadius: 12, border: '1px solid #302e3d', background: '#17161d', color: '#a6a1b5', display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', fontWeight: 700 },
  activeTab: { background: '#29233d', color: '#e8e0ff', borderColor: '#7661d8' },
  count: { padding: '3px 8px', background: '#ffffff0d', borderRadius: 7, fontSize: 11 },
  summary: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 25, borderRadius: 18, border: '1px solid #2e2b3a', background: 'linear-gradient(115deg,#191722,#17151d 65%,#211c32)', marginBottom: 24 },
  summaryTitle: { color: '#a18cff', fontSize: 11, letterSpacing: 1.6, fontWeight: 800 },
  summaryNumber: { fontSize: 28, fontWeight: 800, color: '#f0ecff', margin: '10px 0 4px' },
  summaryText: { fontSize: 13, color: '#9691a7', margin: 0 },
  trophy: { width: 56, height: 56, borderRadius: 16, display: 'grid', placeItems: 'center', background: '#8c72ff18', border: '1px solid #8c72ff35', color: '#b7a4ff' },
  podium: { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', alignItems: 'end', gap: 14, marginBottom: 25 },
  podiumCard: { border: '1px solid #302d3a', background: '#17161d', borderRadius: 17, padding: '22px 12px', textAlign: 'center', minWidth: 0 },
  podiumAvatar: { width: 54, height: 54, borderRadius: 18, margin: '0 auto 12px', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 20, background: '#302a42', color: '#d2c4ff' },
  podiumName: { fontSize: 13, fontWeight: 750, color: '#f0edfa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  podiumHandle: { fontSize: 11, color: '#8f899f', marginTop: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  podiumScore: { fontSize: 20, fontWeight: 800, color: '#e5dcff', marginTop: 13 },
  podiumLabel: { fontSize: 10, color: '#898498', textTransform: 'uppercase', letterSpacing: 1 },
  table: { border: '1px solid #2c2937', borderRadius: 17, overflow: 'hidden', background: '#15141b' },
  tableHeader: { display: 'grid', gridTemplateColumns: '72px minmax(200px,1fr) repeat(3,minmax(100px,130px))', alignItems: 'center', gap: 12, padding: '15px 20px', background: '#1b1a22', color: '#777386', fontSize: 10, letterSpacing: 1.2, fontWeight: 800, borderBottom: '1px solid #302d39' },
  row: { display: 'grid', gridTemplateColumns: '72px minmax(200px,1fr) repeat(3,minmax(100px,130px))', alignItems: 'center', gap: 12, padding: '15px 20px', minHeight: 96, borderBottom: '1px solid #292731' },
  rank: { width: 40, height: 40, margin: '0 auto', borderRadius: 12, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 14, background: '#24232d', border: '1px solid #34313d', color: '#b4afc1' },
  user: { display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 },
  avatar: { width: 42, height: 42, borderRadius: 13, flexShrink: 0, display: 'grid', placeItems: 'center', background: 'linear-gradient(140deg,#393149,#24212f)', color: '#d0c3ff', fontWeight: 800 },
  userName: { color: '#e9e5f2', fontSize: 13, fontWeight: 750 },
  handle: { color: '#8d879c', fontSize: 11, marginTop: 5 },
  profileLink: { color: '#a38cff', fontSize: 11, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 6 },
  stat: { textAlign: 'center' },
  statValue: { color: '#eeebf7', fontSize: 17, fontWeight: 800, whiteSpace: 'nowrap' },
  statLabel: { color: '#898498', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.7, marginTop: 5 },
  footer: { color: '#777386', fontSize: 12, lineHeight: 1.6, marginTop: 17 },
};

export default function Leaderboard() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [platform, setPlatform] = useState('LEETCODE');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setError('');
    try {
      const r = await api.get('/api/coding-stats/leaderboard');
      setProfiles(Array.isArray(r.data) ? r.data : []);
    } catch (e) {
      setError(getError(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const ranked = useMemo(() => {
    const list = profiles.filter(p => p.platform === platform);
    if (platform === 'LEETCODE') {
      return list.sort((a, b) =>
        Number(b.problems_solved || 0) - Number(a.problems_solved || 0) ||
        Number(b.rating || 0) - Number(a.rating || 0)
      );
    }
    return list.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
  }, [profiles, platform]);

  const me = Number(user?.student_id);
  const fmt = n => n == null || n === '' ? '—' : Number(n).toLocaleString();
  const isMe = p => Number(p.student_id) === me;

  const medalColors = ['#f4c96b', '#c6cedb', '#d59b77'];
  const podiumOrder = ranked.slice(0, 3);
  const podiumLayout = podiumOrder.length === 3
    ? [podiumOrder[1], podiumOrder[0], podiumOrder[2]]
    : podiumOrder;

  const renderPodium = (p, displayIndex) => {
    if (!p) return null;
    const actualRank = ranked.indexOf(p) + 1;
    const color = medalColors[actualRank - 1] || '#aaa';
    const score = platform === 'LEETCODE' ? p.problems_solved : p.rating;
    const scoreLabel = platform === 'LEETCODE' ? 'PROBLEMS SOLVED' : 'RATING';

    return (
      <div key={p.profile_id} style={{
        ...styles.podiumCard,
        borderColor: `${color}55`,
        background: actualRank === 1 ? 'linear-gradient(160deg,#2b2418,#1a1820)' : '#17161d',
        paddingTop: actualRank === 1 ? 28 : 22,
      }}>
        <div style={{ color, fontSize: 18, fontWeight: 900, marginBottom: 12 }}>
          {actualRank === 1 ? '♛ 1ST' : actualRank === 2 ? '2ND' : '3RD'}
        </div>
        <div style={{ ...styles.podiumAvatar, border: `1px solid ${color}65` }}>
          {(p.full_name || p.username || '?').charAt(0).toUpperCase()}
        </div>
        <div style={styles.podiumName}>{p.full_name || 'Student'} {isMe(p) ? '(YOU)' : ''}</div>
        <div style={styles.podiumHandle}>{p.username}</div>
        <div style={{ ...styles.podiumScore, color }}>{fmt(score)}</div>
        <div style={styles.podiumLabel}>{scoreLabel}</div>
      </div>
    );
  };

  return (
    <div style={styles.page}>
      <div style={styles.heading}>
        <div>
          <div style={styles.eyebrow}>CAMPUS COMPETITION</div>
          <h1 style={styles.title}>Leaderboard</h1>
          <p style={styles.subtitle}>Compete, improve, and climb the coding rankings.</p>
        </div>
        <button style={styles.refresh} onClick={refresh} disabled={refreshing} title="Refresh">
          <RefreshCw size={17} style={{ animation: refreshing ? 'spin 1s linear infinite' : undefined }} />
        </button>
      </div>

      {error && <div style={{ padding: 13, background: '#421f2a', color: '#ffb7c2', borderRadius: 10, marginBottom: 15 }}>{error}</div>}

      <div style={styles.tabs}>
        {['LEETCODE', 'CODEFORCES'].map(tab => (
          <button
            key={tab}
            onClick={() => setPlatform(tab)}
            style={{ ...styles.tab, ...(platform === tab ? styles.activeTab : {}) }}
          >
            <Code2 size={17} />
            {tab === 'LEETCODE' ? 'LeetCode' : 'Codeforces'}
            <span style={styles.count}>{profiles.filter(p => p.platform === tab).length}</span>
          </button>
        ))}
      </div>

      <div style={styles.summary}>
        <div>
          <div style={styles.summaryTitle}>{platform === 'LEETCODE' ? 'LEETCODE RANKINGS' : 'CODEFORCES RANKINGS'}</div>
          <div style={styles.summaryNumber}>{ranked.length} <span style={{ fontSize: 15, fontWeight: 500, color: '#9b96a9' }}>participants</span></div>
          <p style={styles.summaryText}>
            {platform === 'LEETCODE' ? 'Ranked by problems solved, then rating.' : 'Ranked by contest rating.'}
          </p>
        </div>
        <div style={styles.trophy}><Trophy size={26} /></div>
      </div>

      {!loading && ranked.length >= 2 && (
        <div style={styles.podium}>
          {podiumLayout.map((p, i) => renderPodium(p, i))}
        </div>
      )}

      <div style={styles.table}>
        <div style={styles.tableHeader}>
          <div>RANK</div>
          <div>STUDENT</div>
          {platform === 'LEETCODE' ? <><div style={{ textAlign: 'center' }}>SOLVED</div><div style={{ textAlign: 'center' }}>RATING</div><div style={{ textAlign: 'center' }}>CONTESTS</div></> :
            <><div style={{ textAlign: 'center' }}>RATING</div><div style={{ textAlign: 'center' }}>SOLVED</div><div style={{ textAlign: 'center' }}>CONTESTS</div></>}
          }
        </div>

        {loading ? (
          <div style={{ padding: 45, textAlign: 'center', color: '#999' }}>Loading leaderboard...</div>
        ) : ranked.length === 0 ? (
          <div style={{ padding: 50, textAlign: 'center', color: '#999' }}>
            <Code2 size={30} />
            <h3 style={{ color: '#e7e3ef' }}>No profiles yet</h3>
            Connect your coding profile to join the leaderboard.
          </div>
        ) : ranked.map((p, index) => {
          const rank = index + 1;
          const myRow = isMe(p);
          const medal = rank <= 3 ? medalColors[rank - 1] : null;
          return (
            <div key={p.profile_id} style={{
              ...styles.row,
              background: myRow ? 'linear-gradient(90deg,#29233b,#18171e)' : '#15141b',
              borderLeft: myRow ? '3px solid #8c74f5' : '3px solid transparent',
            }}>
              <div>
                <div style={{ ...styles.rank, ...(medal ? { color: medal, borderColor: `${medal}70`, background: `${medal}17` } : {}) }}>
                  {rank}
                </div>
              </div>

              <div style={styles.user}>
                <div style={styles.avatar}>{(p.full_name || p.username || '?').charAt(0).toUpperCase()}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ ...styles.userName, display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                    {p.full_name || 'Student'}
                    {myRow && <span style={{ fontSize: 9, color: '#c0adff', background: '#7960db30', padding: '3px 6px', borderRadius: 5 }}>YOU</span>}
                  </div>
                  <div style={styles.handle}>{p.username}</div>
                  <a style={styles.profileLink} href={p.profile_url} target="_blank" rel="noreferrer">
                    View profile <ExternalLink size={12} />
                  </a>
                </div>
              </div>

              {platform === 'LEETCODE' ? (
                <>
                  <div style={styles.stat}><div style={styles.statValue}>{fmt(p.problems_solved)}</div><div style={styles.statLabel}>Solved</div></div>
                  <div style={styles.stat}><div style={styles.statValue}>{fmt(p.rating)}</div><div style={styles.statLabel}>Rating</div></div>
                  <div style={styles.stat}><div style={styles.statValue}>{fmt(p.contests_participated)}</div><div style={styles.statLabel}>Contests</div></div>
                </>
              ) : (
                <>
                  <div style={styles.stat}><div style={styles.statValue}>{fmt(p.rating)}</div><div style={styles.statLabel}>Rating</div></div>
                  <div style={styles.stat}><div style={styles.statValue}>{fmt(p.problems_solved)}</div><div style={styles.statLabel}>Solved</div></div>
                  <div style={styles.stat}><div style={styles.statValue}>{fmt(p.contests_participated)}</div><div style={styles.statLabel}>Contests</div></div>
                </>
              )}
            </div>
          );
        })}
      </div>

      <div style={styles.footer}>
        Rankings are calculated using the latest synchronized statistics. Refresh to load the latest campus data.
      </div>
    </div>
  );
}
