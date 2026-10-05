import React from 'react';
import { FileText } from 'lucide-react';

export const ResumePreview: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
        <FileText className="w-6 h-6 text-brand-400" />
        <div>
          <h1 className="text-xl font-bold text-white">Resume Preview & ATS Audit</h1>
          <p className="text-xs text-slate-400">Validated resume viewer, ATS breakdown, PDF & DOCX export.</p>
        </div>
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
        Resume previewer and download center. (Activated in Phase 7 & 8)
      </div>
    </div>
  );
};
