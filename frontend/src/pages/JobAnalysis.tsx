import React from 'react';
import { Layers } from 'lucide-react';

export const JobAnalysis: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
        <Layers className="w-6 h-6 text-cyan-400" />
        <div>
          <h1 className="text-xl font-bold text-white">Job Analysis & Matching</h1>
          <p className="text-xs text-slate-400">Extracted JD attributes, matched skills, missing skills, and ranked projects.</p>
        </div>
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
        Analysis results viewer. (Activated in Phase 4 & 5)
      </div>
    </div>
  );
};
