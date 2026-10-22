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
    <header className="h-14 sm:h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-2.5 sm:px-6 flex items-center justify-between z-10 sticky top-0 gap-1.5 sm:gap-2">
      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 shrink">
        {/* Mobile Brand Name */}
        <div className="md:hidden flex items-center space-x-1.5 sm:space-x-2 min-w-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-brand-500/20 shrink-0">
            <ShieldCheck className="w-4 h-4 text-slate-950 font-bold" />
          </div>
          <span className="font-bold text-white tracking-tight text-xs sm:text-base whitespace-nowrap">Truthful AI</span>
        </div>

        {/* Desktop Workspace Label */}
        <span className="hidden md:inline-block text-xs uppercase tracking-wider font-semibold text-slate-500">
          Personal Single-User Workspace
        </span>
      </div>

      <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
        {/* Backend Health Badge */}
        <div className="flex items-center space-x-1 sm:space-x-2 px-2 py-0.5 sm:px-3 sm:py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-[10px] sm:text-xs shrink-0">
          <Activity className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 shrink-0" />
          <span className="text-slate-400 font-medium hidden sm:inline">Backend:</span>
          {isLoading && <span className="text-amber-400 animate-pulse">Checking...</span>}
          {isSuccess && (
            <span className="flex items-center space-x-1 text-cyan-400 font-medium">
              <CheckCircle2 className="w-3 h-3 shrink-0" />
              <span className="capitalize">{health.status}</span>
              <span className="text-slate-400 hidden md:inline">({health.llm_provider})</span>
              {health.ai_configured === false && (
                <span className="text-amber-400 text-[9px] sm:text-[10px] ml-1 bg-amber-950/60 px-1 py-0.2 rounded border border-amber-800/40 hidden xs:inline">
                  Key Missing
                </span>
              )}
            </span>
          )}
          {isError && (
            <span className="flex items-center space-x-1 text-rose-400 font-medium">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>Offline</span>
            </span>
          )}
        </div>

        {/* User indicator */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 border-l border-slate-800 pl-1.5 sm:pl-3 shrink-0">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-brand-500/20 text-brand-400 border border-brand-500/30 flex items-center justify-center font-bold text-[10px] sm:text-xs shrink-0">
            U
          </div>
          <span className="text-xs font-medium text-slate-300 hidden sm:inline">Admin</span>
        </div>
      </div>
    </header>
  );
};
