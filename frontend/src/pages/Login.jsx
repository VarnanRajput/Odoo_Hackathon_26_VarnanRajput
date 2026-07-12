import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import Input from '../components/forms/Input';
import Button from '../components/ui/Button';
import Checkbox from '../components/forms/Checkbox';
import Alert from '../components/ui/Alert';

const Login = () => {
  const { login } = useAuth();
  const { showNotification } = useNotifications();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(email, password, rememberMe);
      if (res.success) {
        showNotification('Welcome to AssetFlow!', 'success');
        navigate('/dashboard');
      } else {
        setError(res.message || 'Login failed. Please check credentials.');
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
        {/* Glow element */}
        <div className="absolute -top-10 -left-10 h-40 w-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center mb-8 relative">
          <span className="text-3xl font-extrabold bg-gradient-to-r from-indigo-400 to-indigo-600 bg-clip-text text-transparent">
            AssetFlow
          </span>
          <p className="text-xs text-slate-400 mt-2 font-medium">
            Enterprise Asset & Resource Management
          </p>
        </div>

        {error && <Alert type="error" className="mb-6" onClose={() => setError('')}>{error}</Alert>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 relative">
          <Input
            label="Email Address"
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="text-white"
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
            <Checkbox
              label="Remember me"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <a href="#forgot" className="text-indigo-400 hover:underline">
              Forgot Password?
            </a>
          </div>

          <Button type="submit" variant="primary" loading={loading} className="w-full mt-2">
            Sign In
          </Button>
        </form>

        <div className="text-center text-xs text-slate-400 mt-8 font-medium">
          Don't have an account?{' '}
          <Link to="/signup" className="text-indigo-400 hover:underline font-bold">
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
