import React from 'react';
import { UserCheck } from 'lucide-react';

export const Profile: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
        <UserCheck className="w-6 h-6 text-brand-400" />
        <div>
          <h1 className="text-xl font-bold text-white">Master Profile</h1>
          <p className="text-xs text-slate-400">Single source of verified facts: experience, projects, skills, education.</p>
        </div>
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
        Profile management component loaded. (Activated in Phase 2)
      </div>
    </div>
  );
};
