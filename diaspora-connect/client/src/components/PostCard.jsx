import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function PostCard({ post, onUpdate }) {
  const { user } = useAuth();
  const isLiked = post.likes?.includes(user?._id);

  const handleLike = async () => {
    const { data } = await api.post(`/posts/${post._id}/like`);
    onUpdate?.({ ...post, likes: data.liked
      ? [...(post.likes || []), user._id]
      : (post.likes || []).filter((l) => l !== user._id) });
  };

  const authorName = post.author?.name || 'Unknown';
  const initials = authorName[0] || '?';

  return (
    <div className="card mb-2">
      <div className="flex items-center gap-1 mb-1">
        {post.author?.avatarUrl
          ? <img src={post.author.avatarUrl} alt={authorName} className="avatar" />
          : <div className="avatar">{initials}</div>}
        <div>
          <span className="font-bold">{authorName}</span>
          {post.author?.profession && (
            <span className="text-muted"> · {post.author.profession}</span>
          )}
          <div className="text-muted">
            {post.author?.countryOfOrigin} → {post.author?.countryOfResidence}
            {' · '}
            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
          </div>
        </div>
      </div>

      <p style={{ whiteSpace: 'pre-wrap', margin: '.5rem 0' }}>{post.content}</p>

      {post.imageUrl && (
        <img src={post.imageUrl} alt="post" style={{ maxWidth: '100%', borderRadius: 6, marginBottom: '.5rem' }} />
      )}

      <div className="flex gap-2 mt-1 text-sm">
        {post.region && <span className="badge">{post.region}</span>}
        {post.industry && <span className="badge" style={{ background: 'var(--color-accent)' }}>{post.industry}</span>}
        {post.tags?.map((t) => (
          <span key={t} style={{ color: 'var(--color-muted)', fontSize: '.82rem' }}>#{t}</span>
        ))}
      </div>

      <div className="flex gap-2 mt-2 text-sm" style={{ borderTop: '1px solid var(--color-border)', paddingTop: '.75rem' }}>
        <button className="btn-outline" onClick={handleLike} style={{ padding: '.3rem .8rem', fontSize: '.85rem' }}>
          {isLiked ? '❤️' : '🤍'} {post.likes?.length || 0}
        </button>
        <button className="btn-outline" style={{ padding: '.3rem .8rem', fontSize: '.85rem' }}>
          💬 {post.comments?.length || 0}
        </button>
      </div>
    </div>
  );
}
