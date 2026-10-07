import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Activity, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { data: health, isSuccess, isError, isLoading } = useQuery({
    queryKey: ['health'],
    queryFn: api.getHealth,
    refetchInterval: 30000,
  });

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between z-10 sticky top-0">
      <div className="flex items-center space-x-3">
        {/* Mobile Brand Name */}
        <div className="md:hidden flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-brand-500/20">
            <ShieldCheck className="w-5 h-5 text-slate-950 font-bold" />
          </div>
          <span className="font-bold text-white tracking-tight">Truthful AI</span>
        </div>

        {/* Desktop Workspace Label */}
        <span className="hidden md:inline-block text-xs uppercase tracking-wider font-semibold text-slate-500">
          Personal Single-User Workspace
        </span>
      </div>

      <div className="flex items-center space-x-4">
        {/* Backend Health Badge */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs">
          <Activity className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400 font-medium">Backend:</span>
          {isLoading && <span className="text-amber-400 animate-pulse">Checking...</span>}
          {isSuccess && (
            <span className="flex items-center space-x-1 text-cyan-400 font-medium">
              <CheckCircle2 className="w-3 h-3" />
              <span>{health.status} ({health.llm_provider})</span>
            </span>
          )}
          {isError && (
            <span className="flex items-center space-x-1 text-rose-400 font-medium">
              <AlertCircle className="w-3 h-3" />
              <span>Offline</span>
            </span>
          )}
        </div>

        {/* User indicator */}
        <div className="flex items-center space-x-2 border-l border-slate-800 pl-4">
          <div className="w-7 h-7 rounded-full bg-brand-500/20 text-brand-400 border border-brand-500/30 flex items-center justify-center font-bold text-xs">
            U
          </div>
          <span className="text-xs font-medium text-slate-300">Admin</span>
        </div>
      </div>
    </header>
  );
};
