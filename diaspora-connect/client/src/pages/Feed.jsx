import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import PostCard from '../components/PostCard';
import { useAuth } from '../context/AuthContext';

const REGIONS = ['','West Africa','East Africa','Southern Africa','Central Africa','North Africa',
  'South Asia','Southeast Asia','East Asia','MENA','Europe','North America','Latin America','Oceania'];

export default function Feed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ region: '', industry: '' });
  const [newPost, setNewPost] = useState('');
  const [posting, setPosting] = useState(false);

  const load = async () => {
    setLoading(true);
    const params = {};
    if (filter.region) params.region = filter.region;
    if (filter.industry) params.industry = filter.industry;
    const { data } = await api.get('/posts', { params });
    setPosts(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const handlePost = async (e) => {
    e.preventDefault();
    if (!newPost.trim()) return;
    setPosting(true);
    const { data } = await api.post('/posts', {
      content: newPost,
      region: user.countryOfOrigin,
      industry: user.industry,
    });
    setPosts([data, ...posts]);
    setNewPost('');
    setPosting(false);
  };

  return (
    <div className="page">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1.5rem' }}>
        {/* ── Feed Column ── */}
        <div>
          {/* New Post */}
          <div className="card mb-2">
            <form onSubmit={handlePost}>
              <textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder={`Share something with the diaspora, ${user?.name?.split(' ')[0]}…`}
                rows={3}
                maxLength={3000}
                style={{ marginBottom: '.75rem' }}
              />
              <div className="flex justify-between items-center">
                <span className="text-muted text-sm">{newPost.length}/3000</span>
                <button type="submit" className="btn-primary" disabled={posting || !newPost.trim()}>
                  {posting ? 'Posting…' : 'Post'}
                </button>
              </div>
            </form>
          </div>

          {/* Posts */}
          {loading ? (
            <p className="text-muted">Loading feed…</p>
          ) : posts.length === 0 ? (
            <p className="text-muted">No posts yet. Be the first to share!</p>
          ) : (
            posts.map((p) => (
              <PostCard
                key={p._id}
                post={p}
                onUpdate={(updated) => setPosts(posts.map((x) => x._id === updated._id ? updated : x))}
              />
            ))
          )}
        </div>

        {/* ── Filter Sidebar ── */}
        <aside>
          <div className="card">
            <h3 style={{ marginBottom: '.75rem' }}>Filter Feed</h3>
            <label className="text-sm">Region</label>
            <select value={filter.region} onChange={(e) => setFilter({ ...filter, region: e.target.value })} style={{ marginBottom: '.75rem' }}>
              {REGIONS.map((r) => <option key={r} value={r}>{r || 'All Regions'}</option>)}
            </select>
            <label className="text-sm">Industry</label>
            <input
              value={filter.industry}
              onChange={(e) => setFilter({ ...filter, industry: e.target.value })}
              placeholder="e.g. Nursing"
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
