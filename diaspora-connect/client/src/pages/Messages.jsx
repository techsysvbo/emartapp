import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Messages() {
  const { userId } = useParams();
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef();

  // Load conversation list
  useEffect(() => {
    api.get('/messages').then(({ data }) => setConversations(data));
  }, []);

  // Load thread when userId changes
  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    api.get(`/messages/${userId}`).then(({ data }) => {
      setMessages(data);
      setLoading(false);
    });
  }, [userId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    const { data } = await api.post(`/messages/${userId}`, { content });
    setMessages([...messages, data]);
    setContent('');
  };

  return (
    <div className="page">
      <h2 className="mb-2">✉️ Messages</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '1rem', height: '70vh' }}>

        {/* ── Inbox ── */}
        <div className="card" style={{ overflowY: 'auto', padding: '.75rem' }}>
          <h4 className="mb-2 text-sm">Recent Conversations</h4>
          {conversations.length === 0 && <p className="text-muted text-sm">No conversations yet.</p>}
          {conversations.map((c) => (
            <Link key={c._id} to={`/messages/${c._id}`} style={{ textDecoration: 'none' }}>
              <div style={{
                padding: '.6rem',
                borderRadius: 6,
                background: c._id === userId ? 'var(--color-bg)' : 'transparent',
                marginBottom: '.25rem',
                cursor: 'pointer',
              }}>
                <div style={{ fontWeight: 600, fontSize: '.88rem', color: 'var(--color-text)' }}>
                  {c.lastMessage?.sender?.name || c.lastMessage?.recipient?.name || 'User'}
                </div>
                <div className="text-muted" style={{ fontSize: '.78rem', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                  {c.lastMessage?.content}
                </div>
                {c.unread > 0 && (
                  <span className="badge" style={{ fontSize: '.72rem', marginTop: '.25rem' }}>{c.unread} new</span>
                )}
              </div>
            </Link>
          ))}
        </div>

        {/* ── Thread ── */}
        {userId ? (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: 0 }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
              {loading ? (
                <p className="text-muted text-sm">Loading…</p>
              ) : messages.length === 0 ? (
                <p className="text-muted text-sm">No messages yet. Say hello!</p>
              ) : (
                messages.map((m) => {
                  const isMine = m.sender?._id === user._id || m.sender === user._id;
                  return (
                    <div key={m._id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', marginBottom: '.5rem' }}>
                      <div style={{
                        background: isMine ? 'var(--color-primary)' : 'var(--color-bg)',
                        color: isMine ? '#fff' : 'var(--color-text)',
                        padding: '.5rem .9rem',
                        borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        maxWidth: '70%',
                        fontSize: '.92rem',
                      }}>
                        {m.content}
                        <div style={{ fontSize: '.72rem', opacity: .7, marginTop: '.2rem', textAlign: isMine ? 'right' : 'left' }}>
                          {format(new Date(m.createdAt), 'HH:mm')}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>
            <form onSubmit={handleSend} style={{ display: 'flex', gap: '.5rem', padding: '.75rem', borderTop: '1px solid var(--color-border)' }}>
              <input
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Type a message…"
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn-primary" disabled={!content.trim()}>Send</button>
            </form>
          </div>
        ) : (
          <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted)' }}>
            Select a conversation or go to a profile to start messaging.
          </div>
        )}
      </div>
    </div>
  );
}
