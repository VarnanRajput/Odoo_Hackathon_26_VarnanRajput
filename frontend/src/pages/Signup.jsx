import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import Input from '../components/forms/Input';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';

const Signup = () => {
  const { signup } = useAuth();
  const { showNotification } = useNotifications();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await signup(name, email, password);
      if (res.success) {
        showNotification('Account created successfully!', 'success');
        navigate('/dashboard');
      } else {
        setError(res.message || 'Signup failed. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900 via-slate-900 to-black">
      <div className="w-full max-w-md glass-panel p-8 rounded-3xl border border-white/10 relative overflow-hidden animate-slide-up shadow-2xl">
        {/* Glow */}
        <div className="absolute -top-10 -left-10 h-40 w-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center mb-8 relative">
          <span className="text-3xl font-extrabold bg-gradient-to-r from-indigo-400 to-indigo-600 bg-clip-text text-transparent">
            AssetFlow
          </span>
          <p className="text-xs text-slate-400 mt-2 font-medium">
            Register new Employee directory account
          </p>
        </div>

        {error && <Alert type="error" className="mb-6" onClose={() => setError('')}>{error}</Alert>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 relative">
          <Input
            label="Full Name"
            type="text"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            label="Work Email"
            type="email"
            placeholder="john@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Create Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div className="text-[10px] text-slate-400 leading-normal mb-1">
            ⚠️ Note: New accounts are registered with the standard <b>Employee</b> role.
            Managers and Department Head status can only be granted by an administrator.
          </div>

          <Button type="submit" variant="primary" loading={loading} className="w-full">
            Sign Up
          </Button>
        </form>

        <div className="text-center text-xs text-slate-400 mt-8 font-medium">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-400 hover:underline font-bold">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
