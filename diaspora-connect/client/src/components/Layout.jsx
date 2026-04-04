import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/',           label: '🌍 Feed' },
  { to: '/vent',       label: '💬 Vent Space' },
  { to: '/groups',     label: '👥 Communities' },
  { to: '/events',     label: '📅 Events' },
  { to: '/mentorship', label: '🎓 Mentorship' },
  { to: '/messages',   label: '✉️ Messages' },
  { to: '/profile',    label: '👤 My Profile' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="layout">
      {/* ── Sidebar / Nav ── */}
      <nav style={styles.sidebar}>
        <div style={styles.brand}>DiasporaConnect 🌐</div>
        <div style={styles.userInfo}>
          <div className="avatar">{user?.name?.[0] || '?'}</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '.9rem' }}>{user?.name}</div>
            <div className="text-muted">{user?.countryOfOrigin} → {user?.countryOfResidence}</div>
          </div>
        </div>
        <ul style={styles.navList}>
          {NAV.map(({ to, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === '/'}
                style={({ isActive }) => ({
                  ...styles.navLink,
                  background: isActive ? 'rgba(255,255,255,.15)' : 'transparent',
                  fontWeight: isActive ? 700 : 400,
                })}
              >
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
        <button className="btn-outline" onClick={logout} style={styles.logoutBtn}>
          Sign Out
        </button>
      </nav>

      {/* ── Main Content ── */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

const styles = {
  sidebar: {
    background: 'var(--color-primary)',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    padding: '1.5rem 1rem',
    minHeight: '100vh',
    position: 'sticky',
    top: 0,
  },
  brand: {
    fontSize: '1.15rem',
    fontWeight: 700,
    marginBottom: '1.5rem',
    letterSpacing: '.02em',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '.75rem',
    marginBottom: '1.5rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid rgba(255,255,255,.2)',
    color: '#fff',
  },
  navList: {
    listStyle: 'none',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '.25rem',
  },
  navLink: {
    display: 'block',
    padding: '.6rem .75rem',
    borderRadius: 'var(--radius)',
    color: '#fff',
    textDecoration: 'none',
    fontSize: '.95rem',
    transition: 'background .15s',
  },
  logoutBtn: {
    marginTop: '1rem',
    color: '#fff',
    borderColor: 'rgba(255,255,255,.5)',
    width: '100%',
  },
};
