
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getError } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, Users, LockKeyhole } from 'lucide-react';

export default function Auth({ register = false }) {
  const [mode, setMode] = useState(register ? 'register' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [year, setYear] = useState('1');
  const [department, setDepartment] = useState('CSE');
  const [otp, setOtp] = useState('');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const { login } = useAuth();
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      setPending(true);

      if (mode === 'login') {
        await login(email, password);
        nav('/');
      } else if (mode === 'register') {
        await api.post('/api/auth/register', {
          full_name: name,
          institute_email: email,
          password,
          academic_year: Number(year),
          department,
        });

        setMessage('Registration initiated. Check your institute email for the OTP.');
        setMode('verify');
      } else {
        await api.post('/api/auth/verify-email', {
          institute_email: email,
          otp: otp,
        });

        setMessage('Email verified! You can now sign in.');
        setOtp('');
        setMode('login');
      }
    } catch (err) {
      setError(getError(err));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <div className="brand-mark big">C</div>
        <h1>
          Campus<span>Connect</span>
        </h1>
        <p>One campus. Many stories.</p>
      </div>

      <div className="auth-card">
        <div className="auth-eyebrow">
          <Users size={16} /> CAMPUS COMMUNITY
        </div>

        <h2>
          {mode === 'login'
            ? 'Welcome back'
            : mode === 'register'
            ? 'Create your account'
            : 'Verify your email'}
        </h2>

        <p className="muted">
          {mode === 'login'
            ? 'Sign in to reconnect with your campus.'
            : mode === 'register'
            ? 'Join your campus community.'
            : 'Enter the OTP sent to your institute email.'}
        </p>

        <form onSubmit={submit}>
          {mode === 'register' && (
            <>
              <label>Full name</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
              />

              <label>Academic year</label>
              <select value={year} onChange={(e) => setYear(e.target.value)}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}
                    {n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'} year
                  </option>
                ))}
              </select>

              <label>Department</label>
              <input
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="CSE"
              />
            </>
          )}

          <label>Institute email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@iiitk.ac.in"
            disabled={mode === 'verify'}
          />

          {mode !== 'verify' && (
            <>
              <label>Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
            </>
          )}

          {mode === 'verify' && (
            <>
              <label>Verification OTP</label>
              <input
                type="text"
                required
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit code"
              />
            </>
          )}

          <button className="primary full" disabled={pending}>
            {pending
              ? 'Please wait...'
              : mode === 'login'
              ? 'Sign in'
              : mode === 'register'
              ? 'Create account'
              : 'Verify email'}
            <ArrowRight size={17} />
          </button>
        </form>

        {error && <div className="alert error">{error}</div>}
        {message && <div className="alert success">{message}</div>}

        <div className="auth-switch">
          {mode === 'login' ? (
            <>
              New here?{' '}
              <button onClick={() => { setError(''); setMessage(''); setMode('register'); }}>
                Create an account
              </button>
            </>
          ) : mode === 'register' ? (
            <>
              Already registered?{' '}
              <button onClick={() => { setError(''); setMessage(''); setMode('login'); }}>
                Sign in
              </button>
            </>
          ) : (
            <>
              OTP entered?{' '}
              <button onClick={() => { setError(''); setMessage(''); setMode('login'); }}>
                Back to sign in
              </button>
            </>
          )}
        </div>
      </div>

      <div className="auth-foot">
        <LockKeyhole size={14} /> Institute community · Built for students
      </div>
    </div>
  );
}