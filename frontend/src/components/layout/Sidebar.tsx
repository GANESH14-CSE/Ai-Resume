import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UserCheck, 
  History, 
  Settings, 
  ShieldCheck, 
  Sparkles,
  Send
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'My Profile', path: '/profile', icon: UserCheck },
  { name: 'Create Resume', path: '/create', icon: Sparkles },
  { name: 'Resume History', path: '/history', icon: History },
  { name: 'Auto Apply', path: '/auto-apply', icon: Send },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-brand-500/20">
            <ShieldCheck className="w-6 h-6 text-slate-950 font-bold" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight text-white leading-tight">Truthful AI</h1>
            <p className="text-xs text-brand-400 font-medium tracking-wide">Resume Tailor</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-brand-500/10 text-brand-400 border border-brand-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Truthfulness Guarantee Footer Banner */}
      <div className="p-4 m-3 rounded-xl bg-slate-950/80 border border-emerald-900/40 text-xs">
        <div className="flex items-center space-x-1.5 text-emerald-400 font-semibold mb-1">
          <ShieldCheck className="w-4 h-4" />
          <span>Zero Fabrication</span>
        </div>
        <p className="text-slate-400 leading-relaxed text-[11px]">
          Every claim and metric is strictly source-bound and validated against your profile.
        </p>
      </div>
    </aside>
  );
};
