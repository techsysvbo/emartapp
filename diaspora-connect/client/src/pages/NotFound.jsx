import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
      <h1 style={{ fontSize: '4rem', color: 'var(--color-primary)' }}>404</h1>
      <p style={{ color: 'var(--color-muted)', marginBottom: '1.5rem' }}>Page not found.</p>
      <Link to="/"><button className="btn-primary">Go Home</button></Link>
    </div>
  );
}
