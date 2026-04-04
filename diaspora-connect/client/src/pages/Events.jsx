import React, { useState, useEffect } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Events() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', eventType: 'Webinar',
    location: '', isOnline: true, meetingLink: '',
    country: '', region: '', industry: '',
    startDate: '', endDate: '', maxAttendees: '',
  });

  const load = async () => {
    setLoading(true);
    const { data } = await api.get('/events');
    setEvents(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleRsvp = async (id) => {
    const { data } = await api.post(`/events/${id}/rsvp`);
    setEvents(events.map((e) => e._id === id ? {
      ...e,
      attendees: data.attending
        ? [...(e.attendees || []), user._id]
        : (e.attendees || []).filter((a) => a !== user._id),
    } : e));
  };

  const handleCreate = async (ev) => {
    ev.preventDefault();
    const payload = { ...form, isOnline: String(form.isOnline) };
    await api.post('/events', payload);
    setShowCreate(false);
    load();
  };

  return (
    <div className="page">
      <div className="flex justify-between items-center mb-2">
        <h2>📅 Events</h2>
        <button className="btn-primary" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? 'Cancel' : '+ Create Event'}
        </button>
      </div>

      {showCreate && (
        <div className="card mb-3">
          <h3 className="mb-2">New Event</h3>
          <form onSubmit={handleCreate} className="flex flex-col gap-2">
            <input placeholder="Title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            <select value={form.eventType} onChange={(e) => setForm({ ...form, eventType: e.target.value })}>
              {['Meetup','Webinar','Workshop','Networking','Job Fair','Cultural','Other'].map((t) => <option key={t}>{t}</option>)}
            </select>
            <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontSize: '.92rem' }}>
              <input type="checkbox" checked={form.isOnline} onChange={(e) => setForm({ ...form, isOnline: e.target.checked })} style={{ width: 'auto' }} />
              Online event
            </label>
            {form.isOnline
              ? <input placeholder="Meeting link" value={form.meetingLink} onChange={(e) => setForm({ ...form, meetingLink: e.target.value })} />
              : <input placeholder="Location / address" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />}
            <input placeholder="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
            <input placeholder="Region (e.g. West Africa)" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} />
            <input placeholder="Industry (optional)" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="text-sm">Start Date *</label>
                <input type="datetime-local" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
              </div>
              <div>
                <label className="text-sm">End Date</label>
                <input type="datetime-local" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>
            <input type="number" placeholder="Max attendees (0 = unlimited)" value={form.maxAttendees} onChange={(e) => setForm({ ...form, maxAttendees: e.target.value })} />
            <button type="submit" className="btn-primary">Create Event</button>
          </form>
        </div>
      )}

      {loading ? (
        <p className="text-muted">Loading events…</p>
      ) : events.length === 0 ? (
        <p className="text-muted">No upcoming events. Create one!</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {events.map((ev) => {
            const attending = ev.attendees?.includes(user._id);
            return (
              <div key={ev._id} className="card">
                {ev.imageUrl && <img src={ev.imageUrl} alt={ev.title} style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 6, marginBottom: '.75rem' }} />}
                <span className="badge" style={{ marginBottom: '.5rem', display: 'inline-block' }}>{ev.eventType}</span>
                <h3 style={{ marginBottom: '.25rem' }}>{ev.title}</h3>
                <p className="text-muted text-sm mb-1">
                  📅 {format(new Date(ev.startDate), 'PPp')}
                </p>
                <p className="text-muted text-sm mb-1">
                  {ev.isOnline ? '🌐 Online' : `📍 ${ev.location}`}
                  {ev.country && ` · ${ev.country}`}
                </p>
                <p className="text-sm" style={{ marginBottom: '.75rem' }}>
                  {ev.description?.slice(0, 100)}{ev.description?.length > 100 ? '…' : ''}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-muted text-sm">👥 {ev.attendees?.length || 0} going</span>
                  <button
                    onClick={() => handleRsvp(ev._id)}
                    className={attending ? 'btn-outline' : 'btn-primary'}
                    style={{ padding: '.3rem .9rem', fontSize: '.85rem' }}
                  >
                    {attending ? 'Cancel RSVP' : 'RSVP'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
