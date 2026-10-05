import React from 'react';
import { Sparkles } from 'lucide-react';

export const CreateResume: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
        <Sparkles className="w-6 h-6 text-brand-400" />
        <div>
          <h1 className="text-xl font-bold text-white">Create Tailored Resume</h1>
          <p className="text-xs text-slate-400">Paste JD to trigger deterministic analysis & truthful resume generation.</p>
        </div>
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
        Job input and pipeline triggering. (Activated in Phase 3 & 4)
      </div>
    </div>
  );
};
