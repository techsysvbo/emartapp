import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import GroupCard from '../components/GroupCard';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  '','Professional Networking','Food & Business','IT & Tech','Healthcare',
  'Education & Research','Mentorship','Cultural & Social','Support & Wellness',
  'Events & Meetups','Masters & PhD Holders','Entrepreneurs','Skilled Trades','Other',
];

export default function Groups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ category: '', homeCountry: '', q: '' });
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', category: 'Other', homeCountry: '', hostCountry: '', region: '', industry: '' });

  const load = async () => {
    setLoading(true);
    const params = {};
    if (filter.category) params.category = filter.category;
    if (filter.homeCountry) params.homeCountry = filter.homeCountry;
    if (filter.q) params.q = filter.q;
    const { data } = await api.get('/groups', { params });
    setGroups(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const handleJoin = async (id) => {
    const { data } = await api.post(`/groups/${id}/join`);
    setGroups(groups.map((g) => g._id === id ? {
      ...g,
      members: data.joined
        ? [...(g.members || []), user._id]
        : (g.members || []).filter((m) => m !== user._id),
    } : g));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const { data } = await api.post('/groups', form);
    setGroups([data, ...groups]);
    setShowCreate(false);
    setForm({ name: '', description: '', category: 'Other', homeCountry: '', hostCountry: '', region: '', industry: '' });
  };

  return (
    <div className="page">
      <div className="flex justify-between items-center mb-2">
        <h2>👥 Communities</h2>
        <button className="btn-primary" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? 'Cancel' : '+ Create Group'}
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="card mb-3">
          <h3 className="mb-2">Create a New Community</h3>
          <form onSubmit={handleCreate} className="flex flex-col gap-2">
            <input placeholder="Group name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.filter(Boolean).map((c) => <option key={c}>{c}</option>)}
            </select>
            <input placeholder="Country of Origin (e.g. Nigeria)" value={form.homeCountry} onChange={(e) => setForm({ ...form, homeCountry: e.target.value })} />
            <input placeholder="Country of Residence (optional)" value={form.hostCountry} onChange={(e) => setForm({ ...form, hostCountry: e.target.value })} />
            <input placeholder="Region (e.g. West Africa)" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} />
            <input placeholder="Industry (optional)" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
            <button type="submit" className="btn-primary">Create</button>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="card mb-2" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          placeholder="Search communities…"
          value={filter.q}
          onChange={(e) => setFilter({ ...filter, q: e.target.value })}
          style={{ flex: 1, minWidth: 160 }}
        />
        <select value={filter.category} onChange={(e) => setFilter({ ...filter, category: e.target.value })} style={{ flex: 1, minWidth: 160 }}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c || 'All Categories'}</option>)}
        </select>
        <input
          placeholder="Country of Origin"
          value={filter.homeCountry}
          onChange={(e) => setFilter({ ...filter, homeCountry: e.target.value })}
          style={{ flex: 1, minWidth: 140 }}
        />
      </div>

      {loading ? (
        <p className="text-muted">Loading communities…</p>
      ) : groups.length === 0 ? (
        <p className="text-muted">No communities found. Try a different filter.</p>
      ) : (
        groups.map((g) => (
          <GroupCard
            key={g._id}
            group={g}
            onJoin={handleJoin}
            isMember={g.members?.includes(user._id)}
          />
        ))
      )}
    </div>
  );
}
