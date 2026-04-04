import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    countryOfOrigin: '', countryOfResidence: '',
    profession: '', industry: 'Other', educationLevel: 'Other',
    institution: '', fieldOfStudy: '', bio: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const field = (label, name, type = 'text', required = false) => (
    <div>
      <label>{label}{required && ' *'}</label>
      <input name={name} type={type} value={form[name]} onChange={set} required={required} />
    </div>
  );

  return (
    <div style={styles.page}>
      <div className="card" style={styles.card}>
        <h1 style={styles.logo}>🌐 DiasporaConnect</h1>
        <p style={{ color: 'var(--color-muted)', marginBottom: '1.25rem', textAlign: 'center' }}>
          Join your global diaspora community
        </p>
        {error && <p style={styles.error}>{error}</p>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          {field('Full Name', 'name', 'text', true)}
          {field('Email', 'email', 'email', true)}
          {field('Password', 'password', 'password', true)}
          {field('Confirm Password', 'confirmPassword', 'password', true)}
          {field('Country of Origin *', 'countryOfOrigin', 'text', true)}
          {field('Country of Residence *', 'countryOfResidence', 'text', true)}

          <div>
            <label>Industry</label>
            <select name="industry" value={form.industry} onChange={set}>
              {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
            </select>
          </div>

          {field('Profession / Job Title', 'profession')}

          <div>
            <label>Education Level</label>
            <select name="educationLevel" value={form.educationLevel} onChange={set}>
              {EDUCATION.map((e) => <option key={e}>{e}</option>)}
            </select>
          </div>

          {field('Institution (University / College)', 'institution')}
          {field('Field of Study', 'fieldOfStudy')}

          <div>
            <label>Short Bio</label>
            <textarea name="bio" value={form.bio} onChange={set} rows={3} maxLength={600} />
          </div>

          <button type="submit" className="btn-primary w-full mt-1" disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>
        <p className="text-muted mt-2" style={{ textAlign: 'center' }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-primary)', padding: '2rem 1rem' },
  card: { width: '100%', maxWidth: 520 },
  logo: { textAlign: 'center', color: 'var(--color-primary)', marginBottom: '.25rem', fontSize: '1.6rem' },
  error: { background: '#fee', color: '#c0392b', padding: '.5rem .75rem', borderRadius: 6, marginBottom: '.5rem', fontSize: '.9rem' },
};
