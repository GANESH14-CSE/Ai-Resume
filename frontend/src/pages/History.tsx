import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import {
  History as HistoryIcon,
  FileText,
  Download,
  ArrowRight,
  Calendar,
  Building,
  Sparkles
} from 'lucide-react';

export const History: React.FC = () => {
  const { data: resumes, isLoading } = useQuery({
    queryKey: ['resumes'],
    queryFn: api.getResumes,
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 animate-fadeIn">
      {/* Page Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
            <HistoryIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Tailored Resumes History</h1>
            <p className="text-xs text-slate-400">
              Access and download previously tailored resumes for each job application.
            </p>
          </div>
        </div>

        <Link
          to="/create"
          className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold text-xs flex items-center space-x-1.5 shadow-lg shadow-brand-500/20 transition-all active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Tailor New Resume</span>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[30vh]">
          <div className="w-5 h-5 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !resumes || resumes.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-2xl space-y-4">
          <FileText className="w-10 h-10 text-slate-600 mx-auto" />
          <h2 className="text-sm font-bold text-white">No Tailored Resumes Yet</h2>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Once you paste a Job Description and click "Generate My Resume", your tailored resumes will appear here.
          </p>
          <div className="pt-2">
            <Link
              to="/create"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold text-xs shadow-md"
            >
              <Sparkles className="w-4 h-4" />
              <span>Create Your First Resume</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {resumes.map((resume) => (
            <div
              key={resume.id}
              className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700 transition-colors"
            >
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2">
                  <h2 className="text-base font-bold text-white tracking-tight">{resume.target_role}</h2>
                  {resume.target_company && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium flex items-center space-x-1">
                      <Building className="w-3 h-3 text-slate-400" />
                      <span>{resume.target_company}</span>
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>{new Date(resume.created_at).toLocaleDateString()}</span>
                  </span>
                  <span>•</span>
                  <span className="text-cyan-400">
                    {resume.matched_skills.length} skills matched
                  </span>
                  <span>•</span>
                  <span className="text-rose-400">
                    {resume.missing_skills.length} skills missing
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-3 shrink-0">
                <div className="text-right mr-2 hidden sm:block">
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">ATS Score</p>
                  <p className="text-lg font-bold text-brand-400 font-mono">{resume.ats_score}/100</p>
                </div>

                <a
                  href={api.getPdfDownloadUrl(resume.id)}
                  download
                  title="Download ATS PDF"
                  className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                </a>

                <Link
                  to={`/resumes/${resume.id}`}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 flex items-center space-x-1.5 transition-colors"
                >
                  <span>View Details</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
