import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Eye, EyeOff } from 'lucide-react';
import { auth } from '../firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

export default function LoginPage() {
  const { login } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.email || !form.password) { setError('All fields are required.'); return; }
    setLoading(true);
    const result = await login(form.email.trim(), form.password);
    setLoading(false);
    if (result.error) { setError(result.error); return; }
    navigate('/');
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    setError('');
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      // onAuthStateChanged in AppContext handles the rest
    } catch (err) {
      setError(err.message || 'Google sign-in failed.');
      setGoogleLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card-wrapper" style={{ width: '100%', maxWidth: '380px' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px', justifyContent: 'center' }}>
          <div className="logo-mark">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="2" width="5" height="5" rx="1" fill="white" />
              <rect x="9" y="2" width="5" height="5" rx="1" fill="white" opacity="0.6" />
              <rect x="2" y="9" width="5" height="5" rx="1" fill="white" opacity="0.6" />
              <rect x="9" y="9" width="5" height="5" rx="1" fill="white" opacity="0.3" />
            </svg>
          </div>
          <span style={{ fontSize: '16px', fontWeight: '600', color: 'var(--gray-900)', letterSpacing: '-0.2px' }}>Ethara</span>
        </div>

        <div className="card" style={{ padding: '32px' }}>
          <h1 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '4px' }}>Sign in</h1>
          <p style={{ fontSize: '13px', color: 'var(--gray-400)', marginBottom: '24px' }}>Continue to your workspace</p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {error && (
              <div style={{ background: '#fff8f8', border: '1px solid #ffd0cc', color: 'var(--red)', padding: '10px 12px', borderRadius: '3px', fontSize: '13px' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--gray-600)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Email</label>
              <div className="search-container" style={{ width: '100%', height: '38px' }}>
                <input name="email" type="email" value={form.email} onChange={handleChange}
                  placeholder="name@company.com" className="search-input" autoComplete="off" />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--gray-600)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Password</label>
              <div className="search-container" style={{ width: '100%', height: '38px', position: 'relative' }}>
                <input name="password" type={showPw ? 'text' : 'password'} value={form.password} onChange={handleChange}
                  placeholder="••••••••" className="search-input" autoComplete="new-password" />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  style={{ border: 'none', background: 'none', color: 'var(--gray-400)', cursor: 'pointer', display: 'flex', padding: '0 2px', flexShrink: 0 }}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary"
              style={{ width: '100%', height: '38px', justifyContent: 'center', marginTop: '4px', fontSize: '14px' }}>
              {loading ? 'Signing in…' : 'Sign in to Workspace'}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--gray-200)' }} />
            <span style={{ fontSize: '12px', color: 'var(--gray-400)', fontWeight: '500' }}>or</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--gray-200)' }} />
          </div>

          {/* Google Sign In */}
          <button type="button" onClick={handleGoogleSignIn} disabled={googleLoading}
            style={{ width: '100%', height: '38px', background: 'white', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)', fontSize: '14px', fontWeight: '500', color: 'var(--gray-900)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontFamily: 'var(--font)' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
              <path d="M15.68 8.18c0-.57-.05-1.11-.14-1.64H8v3.1h4.3a3.67 3.67 0 0 1-1.6 2.41v2h2.58c1.51-1.39 2.4-3.44 2.4-5.87z" fill="#4285F4" />
              <path d="M8 16c2.16 0 3.97-.71 5.3-1.94l-2.58-2a4.8 4.8 0 0 1-2.72.76 4.77 4.77 0 0 1-4.48-3.3H.86v2.07A8 8 0 0 0 8 16z" fill="#34A853" />
              <path d="M3.52 9.52A4.83 4.83 0 0 1 3.27 8c0-.53.09-1.04.25-1.52V4.41H.86A8 8 0 0 0 0 8c0 1.29.31 2.51.86 3.59l2.66-2.07z" fill="#FBBC05" />
              <path d="M8 3.18c1.22 0 2.31.42 3.17 1.24l2.37-2.37A7.94 7.94 0 0 0 8 0 8 8 0 0 0 .86 4.41L3.52 6.48A4.77 4.77 0 0 1 8 3.18z" fill="#EA4335" />
            </svg>
            {googleLoading ? 'Signing in…' : 'Continue with Google'}
          </button>

          <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--gray-400)', marginTop: '20px' }}>
            No account?{' '}
            <Link to="/signup" style={{ color: 'var(--blue)', textDecoration: 'none', fontWeight: '500' }}>Create one</Link>
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 480px) {
          .auth-card-wrapper .card {
            padding: 24px 20px !important;
          }
        }
        @media (max-width: 360px) {
          .auth-card-wrapper .card {
            padding: 20px 16px !important;
          }
        }
      `}</style>
    </div>
  );
}
