import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function GroupDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [postContent, setPostContent] = useState('');

  useEffect(() => {
    api.get(`/groups/${id}`).then(({ data }) => { setGroup(data); setLoading(false); });
  }, [id]);

  const isMember = group?.members?.some((m) => m._id === user._id);

  const handleJoin = async () => {
    const { data } = await api.post(`/groups/${id}/join`);
    setGroup((g) => ({ ...g, members: data.joined
      ? [...g.members, { _id: user._id, name: user.name, avatarUrl: user.avatarUrl }]
      : g.members.filter((m) => m._id !== user._id) }));
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!postContent.trim()) return;
    const { data } = await api.post(`/groups/${id}/posts`, { content: postContent });
    setGroup((g) => ({ ...g, posts: [...g.posts, data] }));
    setPostContent('');
  };

  if (loading) return <div className="page"><p className="text-muted">Loading…</p></div>;
  if (!group) return <div className="page"><p>Group not found.</p></div>;

  return (
    <div className="page">
      {/* Header */}
      <div className="card mb-2" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {group.avatarUrl
          ? <img src={group.avatarUrl} alt={group.name} style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'cover' }} />
          : <div className="avatar" style={{ width: 64, height: 64, fontSize: '1.5rem', background: 'var(--color-accent)', borderRadius: 8 }}>{group.name[0]}</div>}
        <div style={{ flex: 1 }}>
          <h2>{group.name}</h2>
          <p className="text-muted">{group.description}</p>
          <div className="flex gap-1 mt-1">
            <span className="badge">{group.category}</span>
            {group.homeCountry && <span className="badge" style={{ background: '#6c757d' }}>{group.homeCountry}</span>}
            {group.hostCountry && <span className="badge" style={{ background: '#6c757d' }}>→ {group.hostCountry}</span>}
            {group.educationLevel && <span className="badge" style={{ background: 'var(--color-secondary)' }}>{group.educationLevel}</span>}
          </div>
        </div>
        <div>
          <p className="text-muted text-sm mb-1">👥 {group.members?.length || 0} members</p>
          <button onClick={handleJoin} className={isMember ? 'btn-outline' : 'btn-primary'}>
            {isMember ? 'Leave Group' : 'Join Group'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: '1.5rem' }}>
        {/* Posts */}
        <div>
          {isMember && (
            <div className="card mb-2">
              <form onSubmit={handlePost}>
                <textarea
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="Post in this community…"
                  rows={3}
                  style={{ marginBottom: '.75rem' }}
                />
                <div className="flex justify-between items-center">
                  <span className="text-muted text-sm">{postContent.length}/3000</span>
                  <button type="submit" className="btn-primary" disabled={!postContent.trim()}>Post</button>
                </div>
              </form>
            </div>
          )}

          {group.posts?.length === 0 ? (
            <p className="text-muted">No posts yet in this group.</p>
          ) : (
            [...group.posts].reverse().map((p) => (
              <div key={p._id} className="card mb-2">
                <div className="flex items-center gap-1 mb-1">
                  <div className="avatar">{p.author?.name?.[0] || '?'}</div>
                  <div>
                    <span className="font-bold">{p.author?.name || 'Unknown'}</span>
                    <span className="text-muted"> · {formatDistanceToNow(new Date(p.createdAt), { addSuffix: true })}</span>
                  </div>
                </div>
                <p style={{ whiteSpace: 'pre-wrap' }}>{p.content}</p>
                {p.imageUrl && <img src={p.imageUrl} alt="post" style={{ maxWidth: '100%', borderRadius: 6, marginTop: '.5rem' }} />}
              </div>
            ))
          )}
        </div>

        {/* Members sidebar */}
        <aside>
          <div className="card">
            <h4 className="mb-2">Members ({group.members?.length || 0})</h4>
            {group.members?.slice(0, 15).map((m) => (
              <div key={m._id} className="flex items-center gap-1 mb-1">
                <div className="avatar" style={{ width: 32, height: 32, fontSize: '.8rem' }}>{m.name?.[0] || '?'}</div>
                <div>
                  <div style={{ fontSize: '.88rem', fontWeight: 600 }}>{m.name}</div>
                  <div className="text-muted" style={{ fontSize: '.78rem' }}>{m.profession || m.industry}</div>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
