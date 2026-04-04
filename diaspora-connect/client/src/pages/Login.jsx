import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div className="card" style={styles.card}>
        <h1 style={styles.logo}>🌐 DiasporaConnect</h1>
        <p style={{ color: 'var(--color-muted)', marginBottom: '1.5rem', textAlign: 'center' }}>
          Your global community — connect, support, grow.
        </p>
        {error && <p style={styles.error}>{error}</p>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <div>
            <label>Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} required />
          </div>
          <div>
            <label>Password</label>
            <input name="password" type="password" value={form.password} onChange={handleChange} required />
          </div>
          <button type="submit" className="btn-primary w-full mt-1" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
        <p className="text-muted mt-2" style={{ textAlign: 'center' }}>
          New here? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-primary)' },
  card: { width: '100%', maxWidth: 420 },
  logo: { textAlign: 'center', color: 'var(--color-primary)', marginBottom: '.25rem', fontSize: '1.8rem' },
  error: { background: '#fee', color: '#c0392b', padding: '.5rem .75rem', borderRadius: 6, marginBottom: '.5rem', fontSize: '.9rem' },
};
