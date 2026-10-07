import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { 
  Sparkles, 
  ShieldCheck, 
  FileText, 
  ArrowRight, 
  Cpu, 
  CheckCircle, 
  UserCheck,
  AlertTriangle,
  Database
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { data: health, isLoading: isHealthLoading } = useQuery({
    queryKey: ['health'],
    queryFn: api.getHealth,
  });

  const { data: profileData, isLoading: isProfileLoading } = useQuery({
    queryKey: ['masterProfile'],
    queryFn: api.getMasterProfile,
  });

  const { data: resumes = [], isLoading: isResumesLoading } = useQuery({
    queryKey: ['resumes'],
    queryFn: api.getResumes,
  });

  const hasMasterProfile = profileData?.exists && Boolean(profileData?.profile?.name);
  const profile = profileData?.profile;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn pb-20">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-850 border border-slate-800 p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Strict Truthfulness Guaranteed • Real Personal Data Only</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
            AI-Driven Resume Tailor with <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-cyan-300">Zero Hallucinations</span>
          </h1>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            Your Master Profile is the single ground truth. Paste any Job Description to automatically select relevant skills, rewrite facts professionally, calculate honest ATS compatibility, and download an ATS-ready PDF.
          </p>
          <div className="pt-2 flex flex-wrap gap-4">
            <Link
              to="/create"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold text-sm transition-all duration-150 shadow-lg shadow-brand-500/25 active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>Tailor Resume for a Job</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/profile"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 transition-all duration-150"
            >
              <UserCheck className="w-4 h-4 text-brand-400" />
              <span>{hasMasterProfile ? 'View / Edit Master Profile' : 'Set Up Master Profile'}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Profile Status Alert */}
      {!isProfileLoading && !hasMasterProfile && (
        <div className="p-5 rounded-2xl bg-amber-950/30 border border-amber-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-300">Master Profile Not Set Up Yet</p>
              <p className="text-xs text-amber-200/80 mt-0.5">
                Please enter your real skills, experiences, and projects once. That profile will power all your tailored job applications.
              </p>
            </div>
          </div>
          <Link
            to="/profile"
            className="px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shrink-0 self-start sm:self-auto shadow-md"
          >
            Enter My Real Profile →
          </Link>
        </div>
      )}

      {/* Quick Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Master Profile</span>
            <UserCheck className="w-4 h-4 text-brand-400" />
          </div>
          <div className="text-xl font-bold text-white truncate">
            {hasMasterProfile ? profile?.name : 'Not Configured'}
          </div>
          <p className="text-xs text-slate-500">
            {hasMasterProfile ? `${profile?.skills.length || 0} skills • ${profile?.experiences.length || 0} experiences` : 'Single source of truth'}
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Tailored Resumes</span>
            <FileText className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {isResumesLoading ? '...' : resumes.length}
          </div>
          <p className="text-xs text-slate-500">
            <Link to="/history" className="text-brand-400 hover:underline">
              View generated history →
            </Link>
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">AI LLM Adapter</span>
            <Cpu className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-lg font-bold text-white capitalize">
            {isHealthLoading ? 'Checking...' : health?.llm_provider || 'OpenAI'}
          </div>
          <p className="text-xs text-slate-500">
            {health?.mock_llm ? 'Mock mode' : 'Live OpenAI GPT-4o-mini'}
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">ATS Engine</span>
            <Database className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-lg font-bold text-cyan-400 flex items-center space-x-1.5">
            <CheckCircle className="w-4 h-4" />
            <span>Ready (v{health?.version || '1.0.0'})</span>
          </div>
          <p className="text-xs text-slate-500">Single-column ATS PDF generator</p>
        </div>
      </div>

      {/* The Core Workflow Explanation */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center space-x-2">
          <span>The Core Application Flow</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 text-xs">
          {[
            { step: '1', title: 'Master Profile', desc: 'Single source of truth entered once' },
            { step: '2', title: 'Paste Job Description', desc: 'Provide JD for any job application' },
            { step: '3', title: 'AI Analyzes JD', desc: 'Extracts skills, keywords, responsibilities' },
            { step: '4', title: 'Truthful Tailoring', desc: 'Rewrites only supported facts (zero hallucinations)' },
            { step: '5', title: 'ATS Scoring', desc: 'Estimated score & matched vs missing skills' },
            { step: '6', title: 'Download PDF', desc: 'Clean, single-column ATS PDF ready to apply' },
          ].map((item) => (
            <div key={item.step} className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 space-y-1">
              <span className="inline-block px-1.5 py-0.5 rounded bg-slate-800 text-brand-400 font-mono font-bold text-[10px]">
                Step {item.step}
              </span>
              <p className="font-semibold text-slate-200 text-xs leading-tight">{item.title}</p>
              <p className="text-[11px] text-slate-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
