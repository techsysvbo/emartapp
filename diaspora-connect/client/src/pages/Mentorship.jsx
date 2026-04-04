import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const INDUSTRIES = [
  '','Software Engineering','DevOps & Cloud (Docker/Kubernetes)','Data Science & AI','Medicine (Doctor/GP)',
  'Nursing','Pharmacy','Food Business & Catering','Retail & E-commerce','Finance & Accounting',
  'Law & Legal Services','Higher Education & Academia','Research & Development','Other',
];

const EDUCATION = [
  '','High School / Secondary','Diploma / HND',"Bachelor's Degree (BSc/BA/BEng)",
  "Master's Degree (MSc/MBA/MA/MEng)",'PhD / Doctorate','Professional Certification',
];

export default function Mentorship() {
  const { user, updateUser } = useAuth();
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ industry: '', educationLevel: '', countryOfOrigin: '' });
  const [showEnroll, setShowEnroll] = useState(false);
  const [enrollForm, setEnrollForm] = useState({ isMentor: user?.isMentor || false, mentorBio: user?.mentorBio || '' });

  const load = async () => {
    setLoading(true);
    const params = {};
    if (filter.industry) params.industry = filter.industry;
    if (filter.educationLevel) params.educationLevel = filter.educationLevel;
    if (filter.countryOfOrigin) params.countryOfOrigin = filter.countryOfOrigin;
    const { data } = await api.get('/mentors', { params });
    setMentors(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const handleEnroll = async (e) => {
    e.preventDefault();
    const { data } = await api.patch('/mentors/enroll', enrollForm);
    updateUser(data);
    setShowEnroll(false);
  };

  return (
    <div className="page">
      <div className="flex justify-between items-center mb-2">
        <h2>🎓 Mentorship</h2>
        <button className="btn-primary" onClick={() => setShowEnroll(!showEnroll)}>
          {user?.isMentor ? '✏️ Update Mentor Profile' : '🙋 Become a Mentor'}
        </button>
      </div>

      {showEnroll && (
        <div className="card mb-3">
          <h3 className="mb-2">{user?.isMentor ? 'Update Your Mentor Profile' : 'Enrol as a Mentor'}</h3>
          <form onSubmit={handleEnroll} className="flex flex-col gap-2">
            <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
              <input type="checkbox" checked={enrollForm.isMentor} onChange={(e) => setEnrollForm({ ...enrollForm, isMentor: e.target.checked })} style={{ width: 'auto' }} />
              I want to mentor others in my profession
            </label>
            <textarea
              placeholder="Tell mentees about your experience, what you can help with, and your availability…"
              value={enrollForm.mentorBio}
              onChange={(e) => setEnrollForm({ ...enrollForm, mentorBio: e.target.value })}
              rows={4}
              maxLength={600}
            />
            <button type="submit" className="btn-primary">Save</button>
          </form>
        </div>
      )}

      <p className="text-muted mb-2">
        Connect with experienced diaspora professionals willing to mentor newcomers in the same field.
        Filter by industry, education level, or country of origin.
      </p>

      {/* Filters */}
      <div className="card mb-2" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <select value={filter.industry} onChange={(e) => setFilter({ ...filter, industry: e.target.value })} style={{ flex: 1, minWidth: 160 }}>
          {INDUSTRIES.map((i) => <option key={i} value={i}>{i || 'All Industries'}</option>)}
        </select>
        <select value={filter.educationLevel} onChange={(e) => setFilter({ ...filter, educationLevel: e.target.value })} style={{ flex: 1, minWidth: 160 }}>
          {EDUCATION.map((e) => <option key={e} value={e}>{e || 'All Education Levels'}</option>)}
        </select>
        <input
          placeholder="Country of Origin"
          value={filter.countryOfOrigin}
          onChange={(e) => setFilter({ ...filter, countryOfOrigin: e.target.value })}
          style={{ flex: 1, minWidth: 140 }}
        />
      </div>

      {loading ? (
        <p className="text-muted">Loading mentors…</p>
      ) : mentors.length === 0 ? (
        <p className="text-muted">No mentors found with those filters.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {mentors.map((m) => (
            <div key={m._id} className="card">
              <div className="flex items-center gap-2 mb-2">
                {m.avatarUrl
                  ? <img src={m.avatarUrl} alt={m.name} className="avatar" />
                  : <div className="avatar">{m.name[0]}</div>}
                <div>
                  <Link to={`/profile/${m._id}`} className="font-bold" style={{ color: 'var(--color-text)' }}>{m.name}</Link>
                  <div className="text-muted text-sm">{m.profession || m.industry}</div>
                  <div className="text-muted text-sm">{m.countryOfOrigin} → {m.countryOfResidence}</div>
                </div>
              </div>
              {m.educationLevel && (
                <span className="badge" style={{ background: 'var(--color-secondary)', marginBottom: '.5rem', display: 'inline-block' }}>
                  {m.educationLevel}
                </span>
              )}
              {m.fieldOfStudy && <p className="text-muted text-sm">📚 {m.fieldOfStudy}</p>}
              {m.mentorBio && <p className="text-sm mt-1">{m.mentorBio}</p>}
              <Link to={`/messages/${m._id}`}>
                <button className="btn-primary w-full mt-2">💬 Message</button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
