import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Card from '../components/cards/Card';

const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-905 via-slate-950 to-black text-slate-100 flex flex-col font-sans select-none">
      
      {/* 1. PUBLIC HEADER NAVBAR */}
      <header className="h-20 px-6 md:px-12 border-b border-white/5 bg-slate-950/40 backdrop-blur-md flex justify-between items-center fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-extrabold bg-gradient-to-r from-indigo-400 to-indigo-600 bg-clip-text text-transparent tracking-tight">
            AssetFlow
          </span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 uppercase">
            ERP
          </span>
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <Link to="/dashboard">
              <Button size="sm">Go to Dashboard ➜</Button>
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-sm font-semibold hover:text-indigo-400 transition-colors">
                Sign In
              </Link>
              <Link to="/signup">
                <Button size="sm">Get Started</Button>
              </Link>
            </>
          )}
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <main className="flex-1 pt-32 px-6 md:px-12 max-w-7xl mx-auto w-full flex flex-col items-center justify-center text-center gap-12">
        <div className="max-w-3xl flex flex-col gap-6 animate-slide-up">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
            Enterprise Asset Management,{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
              Simplified.
            </span>
          </h1>
          <p className="text-sm md:text-base text-slate-400 leading-relaxed font-medium">
            Register and allocate inventory, resolve double-booking resource conflicts, schedule maintenance work logs, and run structured auditor cycles inside a centralized premium ERP.
          </p>
          
          <div className="flex justify-center gap-4 mt-4">
            <Link to={isAuthenticated ? '/dashboard' : '/login'}>
              <Button variant="primary" size="lg" className="shadow-lg shadow-indigo-600/30">
                {isAuthenticated ? 'Enter Dashboard' : 'Start Free Trial'}
              </Button>
            </Link>
            <a href="#features">
              <Button variant="outline" size="lg">
                Explore Features
              </Button>
            </a>
          </div>
        </div>

        {/* Visual Showcase Card Mockup */}
        <div className="w-full max-w-4xl glass-panel p-2 rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden group select-none">
          <div className="absolute inset-0 bg-indigo-500/5 group-hover:bg-indigo-500/10 transition-colors duration-500" />
          <div className="bg-slate-900/90 rounded-xl overflow-hidden border border-white/5 p-6 flex flex-col gap-4 text-left">
            {/* Header bar Mock */}
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <div className="flex gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </div>
              <span className="text-[10px] text-slate-500 font-bold">ASSETFLOW CONTROL PANEL</span>
            </div>
            
            {/* Body mock */}
            <div className="grid grid-cols-3 gap-4">
              <div className="h-20 rounded-xl border border-white/5 bg-white/5 p-3 flex flex-col justify-between">
                <span className="text-[9px] text-slate-500 font-bold uppercase">AVAILABLE</span>
                <span className="text-2xl font-extrabold text-indigo-400">85%</span>
              </div>
              <div className="h-20 rounded-xl border border-white/5 bg-white/5 p-3 flex flex-col justify-between">
                <span className="text-[9px] text-slate-500 font-bold uppercase">ON REPAIR</span>
                <span className="text-2xl font-extrabold text-purple-400">4 items</span>
              </div>
              <div className="h-20 rounded-xl border border-white/5 bg-white/5 p-3 flex flex-col justify-between">
                <span className="text-[9px] text-slate-500 font-bold uppercase">OVERDUE</span>
                <span className="text-2xl font-extrabold text-rose-500">0 critical</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. FEATURES LIST SECTION */}
        <section id="features" className="w-full py-16 flex flex-col gap-8 scroll-mt-20">
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-extrabold">ERP System Capabilities</h2>
            <p className="text-xs text-slate-500 mt-2 font-semibold">Core built-in controls supporting full assets lifecycles</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <Card hoverEffect={false} className="border-white/5 bg-white/5 p-6">
              <span className="text-3xl">🔄</span>
              <h4 className="font-bold text-base mt-4">Double-Allocation Prevention</h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Conflict algorithms block checking out assets that are checked out, providing a wizard to trigger transfer requests instantly.
              </p>
            </Card>

            <Card hoverEffect={false} className="border-white/5 bg-white/5 p-6">
              <span className="text-3xl">📅</span>
              <h4 className="font-bold text-base mt-4">Overlap Calendar Scheduler</h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Shared resources booking engine checks and rejects clashing hour allocations on reservation check-outs.
              </p>
            </Card>

            <Card hoverEffect={false} className="border-white/5 bg-white/5 p-6">
              <span className="text-3xl">🔍</span>
              <h4 className="font-bold text-base mt-4">Structured Physical Audits</h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Schedule audits scoped to departments, assign auditors, flag missing items, and auto-transition lost asset states.
              </p>
            </Card>
          </div>
        </section>
      </main>

      {/* 4. FOOTER */}
      <footer className="h-20 border-t border-white/5 bg-slate-950 flex items-center justify-between px-6 md:px-12 text-xs font-semibold text-slate-500 tracking-wide">
        <span>&copy; {new Date().getFullYear()} AssetFlow. All rights reserved.</span>
        <span>Enterprise ERP Portal.</span>
      </footer>
    </div>
  );
};

export default Home;
