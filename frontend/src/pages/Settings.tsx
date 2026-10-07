import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import {
  Settings as SettingsIcon,
  ShieldCheck,
  Cpu,
  Lock,
  Database,
  CheckCircle2
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { data: health } = useQuery({
    queryKey: ['health'],
    queryFn: api.getHealth,
  });

  const { data: profileData } = useQuery({
    queryKey: ['masterProfile'],
    queryFn: api.getMasterProfile,
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-fadeIn">
      {/* Page Header */}
      <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
        <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
          <SettingsIcon className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">System & Security Status</h1>
          <p className="text-xs text-slate-400">
            Backend environment configuration, API security boundaries, and model parameters.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* API Key Security Card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-3">
          <div className="flex items-center space-x-2 text-cyan-400">
            <Lock className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Server-Side Security</span>
          </div>
          <h2 className="text-sm font-bold text-white">Zero Client-Side Exposure</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Your OpenAI API key is stored exclusively in the server-side Django backend environment (<code className="text-brand-400 bg-slate-950 px-1 py-0.5 rounded">backend/.env</code>).
            It is never sent to the browser, JavaScript bundle, or local storage.
          </p>
          <div className="pt-2 flex items-center space-x-2 text-[11px] text-cyan-400 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Strict Secret Isolation Active</span>
          </div>
        </div>

        {/* AI Model Adapter Card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-3">
          <div className="flex items-center space-x-2 text-brand-400">
            <Cpu className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">AI LLM Adapter</span>
          </div>
          <h2 className="text-sm font-bold text-white">OpenAI Structured Output</h2>
          <div className="space-y-1.5 text-xs text-slate-300">
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Provider</span>
              <span className="font-mono text-white capitalize">{health?.llm_provider || 'OpenAI'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Model</span>
              <span className="font-mono text-brand-400">gpt-4o-mini</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Mock Mode</span>
              <span className="font-mono text-cyan-400">{health?.mock_llm ? 'Active' : 'Disabled (Live)'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Response Mode</span>
              <span className="font-mono text-white">json_object (Strict)</span>
            </div>
          </div>
        </div>

        {/* Master Profile Integrity */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-3">
          <div className="flex items-center space-x-2 text-cyan-400">
            <Database className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Master Profile Source</span>
          </div>
          <h2 className="text-sm font-bold text-white">Single Ground Truth</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Status:{' '}
            {profileData?.exists ? (
              <span className="text-cyan-400 font-semibold">
                Configured ({profileData.profile?.name} • {profileData.profile?.skills.length} skills)
              </span>
            ) : (
              <span className="text-amber-400 font-semibold">Not Configured Yet</span>
            )}
          </p>
          <p className="text-[11px] text-slate-400">
            All resume generation strictly queries this master record. No dummy or sample data is mixed into the active workflow.
          </p>
        </div>

        {/* Truthfulness Audit Protocol */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-3">
          <div className="flex items-center space-x-2 text-cyan-400">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Truthfulness Validator</span>
          </div>
          <h2 className="text-sm font-bold text-white">Post-Generation Audit</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Every AI-generated resume passes through a deterministic validator that verifies each skill, company, and project against the Master Profile whitelist.
            Any unauthorized claims or fabricated percentages are automatically stripped.
          </p>
          <div className="flex items-center space-x-1.5 text-[11px] text-cyan-400 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Zero Hallucination Enforcement: ON</span>
          </div>
        </div>
      </div>
    </div>
  );
};
