import React from 'react';
import { Settings as SettingsIcon } from 'lucide-react';

export const Settings: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
        <SettingsIcon className="w-6 h-6 text-brand-400" />
        <div>
          <h1 className="text-xl font-bold text-white">System Settings & LLM Configuration</h1>
          <p className="text-xs text-slate-400">Manage LLM parameters, temperature, truthfulness tolerances, and API keys.</p>
        </div>
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
        Settings panel. (Environment-backed settings)
      </div>
    </div>
  );
};
