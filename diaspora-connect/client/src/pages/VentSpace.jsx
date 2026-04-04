import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import api from '../api/axios';

export default function VentSpace() {
  const [vents, setVents] = useState([]);
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/vents').then(({ data }) => { setVents(data); setLoading(false); });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!content.trim()) return;
    setPosting(true);
    try {
      const { data } = await api.post('/vents', { content, isAnonymous });
      setVents([data, ...vents]);
      setContent('');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not post. You may have reached the 5/day limit.');
    } finally {
      setPosting(false);
    }
  };

  const handleFlag = async (id) => {
    try {
      await api.post(`/vents/${id}/flag`);
      setVents(vents.map((v) => v._id === id ? { ...v, _flagged: true } : v));
    } catch (err) {
      alert(err.response?.data?.error || 'Could not flag');
    }
  };

  return (
    <div className="page">
      <h2>💬 Vent Space</h2>
      <p className="text-muted mb-2">
        A private, safe space to share your struggles. Posts are only visible to community members.
        Anonymous posts hide your identity. Max 5 posts per day.
      </p>

      {/* Safety banner */}
      <div style={styles.safeBanner}>
        🔒 <strong>This space is private.</strong> Your posts are never publicly indexed or searchable.
        Speak freely — you are among friends.
      </div>

      {/* New vent form */}
      <div className="card mb-3">
        {error && <p style={styles.error}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind? You are safe here…"
            rows={4}
            maxLength={3000}
            style={{ marginBottom: '.75rem' }}
          />
          <div className="flex justify-between items-center">
            <label style={styles.anonToggle}>
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                style={{ width: 'auto', marginRight: '.4rem' }}
              />
              Post anonymously
            </label>
            <div className="flex gap-2 items-center">
              <span className="text-muted text-sm">{content.length}/3000</span>
              <button type="submit" className="btn-primary" disabled={posting || !content.trim()}>
                {posting ? 'Posting…' : 'Share'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Vent posts */}
      {loading ? (
        <p className="text-muted">Loading…</p>
      ) : vents.length === 0 ? (
        <p className="text-muted">No vents yet. Be the first to share.</p>
      ) : (
        vents.map((v) => (
          <div key={v._id} className="card mb-2" style={styles.ventCard}>
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center gap-1">
                <div className="avatar" style={{ background: '#6c757d' }}>
                  {v.author ? v.author.name[0] : '?'}
                </div>
                <div>
                  <span className="font-bold">{v.isAnonymous ? 'Anonymous' : v.author?.name}</span>
                  <span className="text-muted"> · {formatDistanceToNow(new Date(v.createdAt), { addSuffix: true })}</span>
                </div>
              </div>
              {!v._flagged && (
                <button
                  onClick={() => handleFlag(v._id)}
                  style={{ background: 'none', border: 'none', color: 'var(--color-muted)', fontSize: '.85rem', padding: '.2rem .5rem' }}
                  title="Report this post"
                >
                  🚩 Report
                </button>
              )}
              {v._flagged && <span className="text-muted text-sm">Reported</span>}
            </div>
            <p style={{ whiteSpace: 'pre-wrap' }}>{v.content}</p>
          </div>
        ))
      )}
    </div>
  );
}

const styles = {
  safeBanner: {
    background: '#e8f5e9',
    border: '1px solid #a5d6a7',
    borderRadius: 8,
    padding: '.75rem 1rem',
    marginBottom: '1.25rem',
    fontSize: '.92rem',
    color: '#1b5e20',
  },
  error: { background: '#fee', color: '#c0392b', padding: '.5rem .75rem', borderRadius: 6, marginBottom: '.5rem', fontSize: '.9rem' },
  anonToggle: { display: 'flex', alignItems: 'center', fontSize: '.92rem', cursor: 'pointer' },
  ventCard: { borderLeft: '3px solid var(--color-primary)' },
};
