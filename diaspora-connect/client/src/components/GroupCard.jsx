import React from 'react';
import { Link } from 'react-router-dom';

export default function GroupCard({ group, onJoin, isMember }) {
  return (
    <div className="card mb-2">
      <div className="flex items-center gap-2 mb-1">
        {group.avatarUrl
          ? <img src={group.avatarUrl} alt={group.name} className="avatar" />
          : <div className="avatar" style={{ background: 'var(--color-accent)' }}>{group.name[0]}</div>}
        <div>
          <Link to={`/groups/${group._id}`} className="font-bold" style={{ color: 'var(--color-text)' }}>
            {group.name}
          </Link>
          <div className="text-muted text-sm">
            {[group.homeCountry, group.hostCountry].filter(Boolean).join(' → ')}
            {group.region && ` · ${group.region}`}
          </div>
        </div>
      </div>

      <p className="text-sm" style={{ color: 'var(--color-muted)', marginBottom: '.75rem' }}>
        {group.description?.slice(0, 120)}{group.description?.length > 120 ? '…' : ''}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          <span className="badge">{group.category}</span>
          {group.industry && <span className="badge" style={{ background: '#6c757d' }}>{group.industry}</span>}
          {group.educationLevel && <span className="badge" style={{ background: 'var(--color-secondary)' }}>{group.educationLevel}</span>}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted text-sm">👥 {group.members?.length || 0}</span>
          <button
            onClick={() => onJoin?.(group._id)}
            className={isMember ? 'btn-outline' : 'btn-primary'}
            style={{ padding: '.3rem .9rem', fontSize: '.85rem' }}
          >
            {isMember ? 'Leave' : 'Join'}
          </button>
        </div>
      </div>
    </div>
  );
}
