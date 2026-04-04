import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const INDUSTRIES = [
  'Software Engineering','DevOps & Cloud (Docker/Kubernetes)','Data Science & AI','Cybersecurity',
  'IT Support & Systems','Web Development','Mobile Development','UI/UX Design','Product Management',
  'Blockchain & Web3','Medicine (Doctor/GP)','Nursing','Pharmacy','Dentistry','Physiotherapy',
  'Mental Health & Counselling','Public Health','Biomedical Science','Food Business & Catering',
  'Retail & E-commerce','Import & Export','Real Estate','Marketing & Advertising',
  'Supply Chain & Logistics','Consulting','Finance & Accounting','Banking & Investment','Insurance',
  'Construction & Civil Engineering','Electrical & Plumbing','Automotive','Manufacturing',
  'Agriculture & Farming','Cleaning & Facilities','Law & Legal Services','Architecture',
  'Mechanical Engineering','Chemical Engineering','Civil Engineering','Surveying',
  'Teaching (Primary/Secondary)','Higher Education & Academia','Research & Development',
  'Journalism & Media','Film & Photography','Music & Entertainment','Fashion & Beauty',
  'Arts & Design','Government & Civil Service','NGO & Non-profit','Social Work','Military & Security','Other',
];

const EDUCATION = [
  'High School / Secondary','Diploma / HND',"Bachelor's Degree (BSc/BA/BEng)",
  "Master's Degree (MSc/MBA/MA/MEng)",'PhD / Doctorate','Professional Certification','Other',
];

export default function Profile() {
  const { id } = useParams();
  const { user: me, updateUser } = useAuth();
  const isOwn = !id || id === me._id;

  const [profile, setProfile] = useState(isOwn ? me : null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(!isOwn);
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);

  useEffect(() => {
    if (!isOwn) {
      api.get(`/users/${id}`).then(({ data }) => { setProfile(data); setLoading(false); });
    }
  }, [id]);

  const startEdit = () => {
    setForm({
      name: profile.name,
      bio: profile.bio || '',
      profession: profile.profession || '',
      industry: profile.industry || 'Other',
      educationLevel: profile.educationLevel || 'Other',
      institution: profile.institution || '',
      fieldOfStudy: profile.fieldOfStudy || '',
      countryOfResidence: profile.countryOfResidence || '',
      isMentor: profile.isMentor || false,
      mentorBio: profile.mentorBio || '',
    });
    setEditing(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const { data } = await api.patch('/users/me', form);
    setProfile(data);
    updateUser(data);
    setEditing(false);
    setSaving(false);
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    const fd = new FormData();
    fd.append('avatar', avatarFile);
    const { data } = await api.post('/users/me/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    setProfile((p) => ({ ...p, avatarUrl: data.avatarUrl }));
    updateUser({ avatarUrl: data.avatarUrl });
    setAvatarFile(null);
  };

  if (loading) return <div className="page"><p className="text-muted">Loading…</p></div>;
  if (!profile) return <div className="page"><p>User not found.</p></div>;

  return (
    <div className="page">
      <div className="card" style={{ maxWidth: 680 }}>
        {/* Avatar */}
        <div className="flex items-center gap-3 mb-3">
          {profile.avatarUrl
            ? <img src={profile.avatarUrl} alt={profile.name} className="avatar" style={{ width: 72, height: 72, fontSize: '1.5rem' }} />
            : <div className="avatar" style={{ width: 72, height: 72, fontSize: '1.8rem' }}>{profile.name[0]}</div>}
          <div>
            <h2>{profile.name}</h2>
            <p className="text-muted">{profile.countryOfOrigin} → {profile.countryOfResidence}</p>
            {profile.isMentor && <span className="badge" style={{ background: 'var(--color-secondary)' }}>🎓 Mentor</span>}
          </div>
        </div>

        {isOwn && (
          <div className="flex gap-2 mb-3">
            <input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files[0])} style={{ width: 'auto', flex: 1 }} />
            {avatarFile && <button className="btn-primary" onClick={handleAvatarUpload}>Upload</button>}
          </div>
        )}

        {!editing ? (
          <div>
            {/* View mode */}
            <div style={styles.infoGrid}>
              <InfoRow label="Profession" value={profile.profession} />
              <InfoRow label="Industry" value={profile.industry} />
              <InfoRow label="Education" value={profile.educationLevel} />
              <InfoRow label="Institution" value={profile.institution} />
              <InfoRow label="Field of Study" value={profile.fieldOfStudy} />
            </div>
            {profile.bio && <p className="mt-2">{profile.bio}</p>}
            {profile.isMentor && profile.mentorBio && (
              <div style={styles.mentorBox}>
                <strong>🎓 Mentor:</strong> {profile.mentorBio}
              </div>
            )}
            {isOwn && (
              <button className="btn-primary mt-3" onClick={startEdit}>Edit Profile</button>
            )}
          </div>
        ) : (
          <form onSubmit={handleSave} className="flex flex-col gap-2">
            <div><label>Name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div><label>Country of Residence</label><input value={form.countryOfResidence} onChange={(e) => setForm({ ...form, countryOfResidence: e.target.value })} /></div>
            <div><label>Profession / Job Title</label><input value={form.profession} onChange={(e) => setForm({ ...form, profession: e.target.value })} placeholder="e.g. Docker Engineer, Jollof Rice Caterer" /></div>
            <div>
              <label>Industry</label>
              <select value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })}>
                {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label>Education Level</label>
              <select value={form.educationLevel} onChange={(e) => setForm({ ...form, educationLevel: e.target.value })}>
                {EDUCATION.map((e) => <option key={e}>{e}</option>)}
              </select>
            </div>
            <div><label>Institution</label><input value={form.institution} onChange={(e) => setForm({ ...form, institution: e.target.value })} /></div>
            <div><label>Field of Study</label><input value={form.fieldOfStudy} onChange={(e) => setForm({ ...form, fieldOfStudy: e.target.value })} /></div>
            <div><label>Bio</label><textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} maxLength={600} /></div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontSize: '.92rem' }}>
              <input type="checkbox" checked={form.isMentor} onChange={(e) => setForm({ ...form, isMentor: e.target.checked })} style={{ width: 'auto' }} />
              I am available to mentor others
            </label>
            {form.isMentor && (
              <div><label>Mentor Bio</label><textarea value={form.mentorBio} onChange={(e) => setForm({ ...form, mentorBio: e.target.value })} rows={3} maxLength={600} /></div>
            )}
            <div className="flex gap-2">
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
              <button type="button" className="btn-outline" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

const InfoRow = ({ label, value }) =>
  value ? (
    <div>
      <span className="text-muted text-sm">{label}: </span>
      <span>{value}</span>
    </div>
  ) : null;

const styles = {
  infoGrid: { display: 'flex', flexDirection: 'column', gap: '.4rem', fontSize: '.95rem' },
  mentorBox: { background: '#fffde7', border: '1px solid #fff176', borderRadius: 6, padding: '.75rem', marginTop: '1rem', fontSize: '.92rem' },
};
