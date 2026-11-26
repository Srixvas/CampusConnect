import React, { useEffect, useState } from 'react';
import api, { getError } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Heart, MessageCircle, Send, RefreshCw, Hash, PackageSearch, Code2, Sparkles } from 'lucide-react';

function initials(name = '') { return name.trim().split(/\s+/).slice(0, 2).map(s => s[0]).join('').toUpperCase() || 'S'; }
function timeLabel(value) { if (!value) return 'Campus post'; const date = new Date(value); return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); }

export default function Home() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [text, setText] = useState('');
  const [audienceYear, setAudienceYear] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [comments, setComments] = useState({});
  const [commentText, setCommentText] = useState({});
  const [open, setOpen] = useState(null);

  const load = () => { setLoading(true); setErr(''); api.get('/api/posts').then(r => setPosts(Array.isArray(r.data) ? r.data : r.data.posts || [])).catch(e => setErr(getError(e))).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);
  const create = async () => { if (!text.trim()) return; try { await api.post('/api/posts', { student_id: user?.student_id, content: text.trim(), post_type: 'TEXT', visibility: 'CAMPUS', target_year: audienceYear === 'ALL' ? null : Number(audienceYear) }); setText(''); load(); } catch (e) { setErr(getError(e)); } };
  const like = async p => { try { await api.post(`/api/posts/${p.post_id}/like`); load(); } catch (e) { setErr(getError(e)); } };
  const showComments = async id => { setOpen(open === id ? null : id); if (open !== id) { try { const r = await api.get(`/api/posts/${id}/comments`); setComments(c => ({ ...c, [id]: r.data })); } catch (e) { setErr(getError(e)); } } };
  const comment = async id => { const value = commentText[id]?.trim(); if (!value) return; try { await api.post(`/api/posts/${id}/comments`, { content: value }); setCommentText(c => ({ ...c, [id]: '' })); const r = await api.get(`/api/posts/${id}/comments`); setComments(c => ({ ...c, [id]: r.data })); } catch (e) { setErr(getError(e)); } };

  return <div className="feed-grid">
    <section className="feed-column">
      <div className="feed-title-row"><div><div className="eyebrow">YOUR CAMPUS, LIVE</div><h1>Campus feed</h1><p className="page-subtitle">The latest from your community.</p></div><button className="icon-btn refresh-btn" onClick={load} title="Refresh feed"><RefreshCw size={17}/></button></div>
      <div className="composer card">
        <div className="avatar">{initials(user?.full_name)}</div><div className="composer-body"><textarea value={text} onChange={e => setText(e.target.value)} placeholder={`What's on your mind, ${user?.full_name?.split(' ')[0] || 'there'}?`} rows={3}/><div className="composer-footer"><span className="composer-note"><Sparkles size={14}/> Share updates, ideas or questions</span><div className="composer-controls"><label className="audience-label" htmlFor="post-audience">Audience</label><select id="post-audience" className="audience-select" value={audienceYear} onChange={e => setAudienceYear(e.target.value)}><option value="ALL">All years</option><option value="1">1st year</option><option value="2">2nd year</option><option value="3">3rd year</option><option value="4">4th year</option><option value="5">5th year</option></select><button className="post-submit" onClick={create} disabled={!text.trim()}><span>Publish</span><Send size={15}/></button></div></div></div>
      </div>
      {err && <div className="alert error">{err}</div>}
      {loading && <div className="feed-status">Loading campus feed…</div>}
      {!loading && posts.length === 0 && <div className="empty-state card"><div className="empty-icon"><MessageCircle size={21}/></div><h3>It’s quiet around here.</h3><p>Start the first conversation in your campus community.</p></div>}
      {posts.map(p => <article className="post card" key={p.post_id}>
        <div className="post-head"><div className="avatar">{initials(p.full_name)}</div><div className="post-author"><b>{p.full_name || 'Campus student'}</b><small>{timeLabel(p.created_at)}</small></div><span className="post-tag"><Hash size={12}/> campus</span></div>
        <div className="post-content">{p.content || p.caption || p.text}</div>
        <div className="post-stats"><span>{p.like_count ?? p.likes_count ?? 0} likes</span><span>{p.comment_count ?? p.comments_count ?? 0} comments</span></div>
        <div className="post-actions"><button onClick={() => like(p)}><Heart size={17}/> Like</button><button onClick={() => showComments(p.post_id)}><MessageCircle size={17}/> Comment</button></div>
        {open === p.post_id && <div className="comments-area"><div className="comments-list">{(comments[p.post_id] || []).map(c => <div className="comment-row" key={c.comment_id}><div className="avatar small">{initials(c.full_name || c.student_id?.toString())}</div><div className="comment-body"><b>{c.full_name || 'Student'}</b><p>{c.content}</p></div></div>)}</div><div className="comment-input"><input placeholder="Add to the conversation…" value={commentText[p.post_id] || ''} onChange={e => setCommentText(c => ({ ...c, [p.post_id]: e.target.value }))}/><button className="icon-btn comment-send" onClick={() => comment(p.post_id)} title="Send comment"><Send size={15}/></button></div></div>}
      </article>)}
    </section>
    <aside className="right-column">
      <section className="sidebar-intro card"><div className="intro-topline"><span className="intro-dot"/> COMMUNITY SPACE</div><h2>Good things<br/>happen <em>on campus.</em></h2><p>A place to share what's happening, find your people and stay in the loop.</p><div className="intro-footer">IIITDM KURNOOL <span>·</span> STUDENT NETWORK</div></section>
      <section className="quick-card card"><div className="side-section-heading">Explore campus</div><a href="/lost-found"><span className="quick-icon"><PackageSearch size={17}/></span><span><b>Lost & Found</b><small>Find or return an item</small></span></a><a href="/leaderboard"><span className="quick-icon"><Code2 size={17}/></span><span><b>Coding leaderboard</b><small>See who's climbing</small></span></a><a href="/explore"><span className="quick-icon"><Hash size={17}/></span><span><b>Explore</b><small>Discover campus posts</small></span></a></section>
      <div className="community-note"><div className="note-label">A SMALL REMINDER</div><p>Keep it kind. Keep it useful. This community belongs to all of us.</p></div>
    </aside>
  </div>;
}
