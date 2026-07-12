import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900 via-slate-900 to-black text-white">
      <div className="w-full max-w-md glass-panel p-8 rounded-3xl border border-white/10 text-center animate-slide-up shadow-2xl">
        <span className="text-5xl block mb-4">🔍</span>
        <h1 className="text-xl font-extrabold tracking-tight">Page Not Found</h1>
        <p className="text-xs text-slate-400 mt-2 font-medium leading-relaxed">
          The page you are looking for does not exist or has been relocated.
        </p>
        <div className="mt-6">
          <Button size="sm" onClick={() => navigate('/dashboard')}>
            Dashboard Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
