import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import {
  Download,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  FileText,
  ArrowLeft,
  Sparkles,
  Info
} from 'lucide-react';

export const ResumePreview: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const { data: resume, isLoading, error } = useQuery({
    queryKey: ['resume', id],
    queryFn: () => api.getResume(id!),
    enabled: Boolean(id),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex items-center space-x-3 text-brand-400">
          <div className="w-5 h-5 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading tailored resume & ATS audit...</span>
        </div>
      </div>
    );
  }

  if (error || !resume) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center space-y-4">
        <p className="text-rose-400 font-semibold">Resume not found or could not be loaded.</p>
        <Link to="/history" className="text-xs text-brand-400 hover:underline">
          Return to Resume History
        </Link>
      </div>
    );
  }

  const content = resume.resume_content;
  const breakdown = resume.ats_breakdown;
  const downloadUrl = api.getPdfDownloadUrl(resume.id);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10';
    if (score >= 75) return 'text-brand-400 border-brand-500/40 bg-brand-500/10';
    return 'text-amber-400 border-amber-500/40 bg-amber-500/10';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-fadeIn">
      {/* Top Bar Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <Link
            to="/history"
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Back to History"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-white tracking-tight">
                {resume.target_role}
              </h1>
              {resume.target_company && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
                  @{resume.target_company}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Generated on {new Date(resume.created_at).toLocaleDateString()} • ATS Single-Column Format
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/create"
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center space-x-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span>Tailor Another JD</span>
          </Link>

          <a
            href={downloadUrl}
            download
            className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold text-xs flex items-center space-x-2 shadow-lg shadow-brand-500/25 transition-all active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Download ATS PDF</span>
          </a>
        </div>
      </div>

      {/* ATS COMPATIBILITY AUDIT SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score Card */}
        <div className="lg:col-span-1 bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">ATS Score</span>
              <ShieldCheck className="w-4 h-4 text-brand-400" />
            </div>

            <div className="flex items-baseline space-x-2 my-2">
              <span className={`text-4xl font-extrabold tracking-tight px-3 py-1 rounded-xl border ${getScoreColor(resume.ats_score)}`}>
                {resume.ats_score}
              </span>
              <span className="text-slate-400 text-sm font-semibold">/ 100</span>
            </div>

            <p className="text-xs font-bold text-white mt-3">
              Estimated ATS Compatibility: {resume.ats_score}/100
            </p>
            <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
              {breakdown?.disclaimer || 'Calculated via keyword match, skill coverage, and structure. Actual ATS results can vary between systems.'}
            </p>
          </div>

          {/* Breakdown Mini-Bars */}
          <div className="space-y-2.5 pt-3 border-t border-slate-800/80 text-xs">
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-slate-400">Skill Coverage</span>
                <span className="text-slate-200 font-mono">{breakdown?.skill_score || 0} / 45</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-brand-500 h-full rounded-full"
                  style={{ width: `${((breakdown?.skill_score || 0) / 45) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-slate-400">Keyword Density</span>
                <span className="text-slate-200 font-mono">{breakdown?.keyword_score || 0} / 25</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-cyan-400 h-full rounded-full"
                  style={{ width: `${((breakdown?.keyword_score || 0) / 25) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-slate-400">Role & Experience Relevance</span>
                <span className="text-slate-200 font-mono">{breakdown?.experience_score || 0} / 20</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-cyan-400 h-full rounded-full"
                  style={{ width: `${((breakdown?.experience_score || 0) / 20) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-slate-400">ATS Structure & Formatting</span>
                <span className="text-cyan-400 font-mono">10.0 / 10 (Optimal)</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-cyan-400 h-full rounded-full w-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Matched vs Missing Skills */}
        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-5">
          {/* Matched Skills */}
          <div>
            <div className="flex items-center space-x-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Matched Skills ({resume.matched_skills.length})</span>
            </div>
            <p className="text-[11px] text-slate-400 mb-2.5">
              Verified skills present in your Master Profile that match this Job Description:
            </p>
            {resume.matched_skills.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No direct skill overlap found.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {resume.matched_skills.map((s) => (
                  <span
                    key={s}
                    className="px-2.5 py-1 rounded-lg bg-cyan-950/40 border border-cyan-800/60 text-cyan-300 text-xs font-medium flex items-center space-x-1"
                  >
                    <span>✓</span>
                    <span>{s}</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Missing Skills */}
          <div className="pt-4 border-t border-slate-800/80">
            <div className="flex items-center space-x-2 text-rose-400 text-xs font-bold uppercase tracking-wider mb-2">
              <XCircle className="w-4 h-4" />
              <span>Missing Skills from Master Profile ({resume.missing_skills.length})</span>
            </div>
            <p className="text-[11px] text-slate-400 mb-2.5">
              Mentioned in the Job Description but NOT in your profile. <strong className="text-slate-200">Omitted from your resume for strict honesty:</strong>
            </p>
            {resume.missing_skills.length === 0 ? (
              <p className="text-xs text-cyan-400 font-semibold">
                Perfect! No missing core skills from this job description.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {resume.missing_skills.map((s) => (
                  <span
                    key={s}
                    className="px-2.5 py-1 rounded-lg bg-rose-950/30 border border-rose-800/50 text-rose-300 text-xs font-medium flex items-center space-x-1"
                  >
                    <span>×</span>
                    <span>{s}</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Recommendations */}
          {breakdown?.recommendations && breakdown.recommendations.length > 0 && (
            <div className="pt-3 border-t border-slate-800/80">
              <p className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center space-x-1.5">
                <Info className="w-3.5 h-3.5 text-brand-400" />
                <span>Legitimate Improvement Suggestions</span>
              </p>
              <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                {breakdown.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* LIVE RESUME PREVIEW (ATS Clean Document Layout) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <FileText className="w-4 h-4 text-brand-400" />
            <span>ATS Resume Preview (Exact PDF Content)</span>
          </h2>
          <a
            href={downloadUrl}
            download
            className="text-xs text-brand-400 hover:underline font-semibold flex items-center space-x-1"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download this PDF</span>
          </a>
        </div>

        {/* Clean Paper View */}
        <div className="bg-white text-slate-900 rounded-2xl p-8 sm:p-12 shadow-2xl max-w-4xl mx-auto space-y-6 font-sans border border-slate-300">
          {/* Header */}
          <div className="text-center space-y-1 pb-4 border-b border-slate-300">
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">
              {content.header?.name || 'Candidate Name'}
            </h1>
            <p className="text-sm font-semibold text-blue-700">
              {content.header?.title || resume.target_role}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-slate-600 pt-1">
              {content.header?.email && <span>{content.header.email}</span>}
              {content.header?.phone && <span>• {content.header.phone}</span>}
              {content.header?.location && <span>• {content.header.location}</span>}
              {content.header?.linkedin && <span>• LinkedIn: {content.header.linkedin}</span>}
              {content.header?.github && <span>• GitHub: {content.header.github}</span>}
              {content.header?.portfolio && <span>• {content.header.portfolio}</span>}
            </div>
          </div>

          {/* Professional Summary */}
          {content.summary && (
            <div className="space-y-1">
              <h2 className="text-xs font-bold text-slate-950 uppercase tracking-wider border-b border-slate-300 pb-0.5">
                Professional Summary
              </h2>
              <p className="text-xs text-slate-800 leading-relaxed pt-1">
                {content.summary}
              </p>
            </div>
          )}

          {/* Technical Skills */}
          {content.skills && (
            <div className="space-y-1">
              <h2 className="text-xs font-bold text-slate-950 uppercase tracking-wider border-b border-slate-300 pb-0.5">
                Technical Skills
              </h2>
              <div className="text-xs text-slate-800 space-y-1 pt-1">
                {content.skills.languages?.length > 0 && (
                  <p>
                    <strong className="font-semibold text-slate-950">Programming Languages: </strong>
                    {content.skills.languages.join(', ')}
                  </p>
                )}
                {content.skills.frameworks?.length > 0 && (
                  <p>
                    <strong className="font-semibold text-slate-950">Frameworks & Libraries: </strong>
                    {content.skills.frameworks.join(', ')}
                  </p>
                )}
                {content.skills.databases?.length > 0 && (
                  <p>
                    <strong className="font-semibold text-slate-950">Databases & Storage: </strong>
                    {content.skills.databases.join(', ')}
                  </p>
                )}
                {content.skills.tools?.length > 0 && (
                  <p>
                    <strong className="font-semibold text-slate-950">Tools & Platforms: </strong>
                    {content.skills.tools.join(', ')}
                  </p>
                )}
                {content.skills.other?.length > 0 && (
                  <p>
                    <strong className="font-semibold text-slate-950">Other Skills: </strong>
                    {content.skills.other.join(', ')}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Work Experience */}
          {content.experiences?.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-bold text-slate-950 uppercase tracking-wider border-b border-slate-300 pb-0.5">
                Work Experience
              </h2>
              {content.experiences.map((exp, idx) => (
                <div key={idx} className="space-y-1 text-xs">
                  <div className="flex justify-between items-baseline">
                    <p className="font-bold text-slate-950">
                      {exp.role} <span className="font-normal text-slate-700">| {exp.company}</span>
                      {exp.location && <span className="font-normal text-slate-500"> ({exp.location})</span>}
                    </p>
                    {(exp.start_date || exp.end_date) && (
                      <span className="text-slate-500 text-[11px]">
                        {exp.start_date || ''} – {exp.end_date || 'Present'}
                      </span>
                    )}
                  </div>
                  <ul className="list-disc list-outside pl-4 space-y-1 text-slate-800 text-[11px] leading-relaxed">
                    {exp.bullets?.map((b, bIdx) => (
                      <li key={bIdx}>{b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {/* Projects */}
          {content.projects?.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-bold text-slate-950 uppercase tracking-wider border-b border-slate-300 pb-0.5">
                Projects
              </h2>
              {content.projects.map((proj, idx) => (
                <div key={idx} className="space-y-1 text-xs">
                  <div className="flex justify-between items-baseline">
                    <p className="font-bold text-slate-950">
                      {proj.name}
                      {proj.technologies?.length ? (
                        <span className="font-normal italic text-slate-600">
                          {' '}
                          | Technologies: {proj.technologies.join(', ')}
                        </span>
                      ) : null}
                    </p>
                    {(proj.github_url || proj.live_url) && (
                      <span className="text-slate-500 text-[11px] space-x-2">
                        {proj.github_url && <span>GitHub</span>}
                        {proj.live_url && <span>Demo</span>}
                      </span>
                    )}
                  </div>
                  <ul className="list-disc list-outside pl-4 space-y-1 text-slate-800 text-[11px] leading-relaxed">
                    {proj.bullets?.map((b, bIdx) => (
                      <li key={bIdx}>{b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {/* Education */}
          {content.education?.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-xs font-bold text-slate-950 uppercase tracking-wider border-b border-slate-300 pb-0.5">
                Education
              </h2>
              {content.education.map((edu, idx) => (
                <div key={idx} className="flex justify-between text-xs text-slate-800">
                  <p>
                    <strong className="text-slate-950 font-bold">{edu.degree}</strong> in {edu.field} | {edu.institution}
                    {edu.grade && <span className="text-slate-600"> • Grade: {edu.grade}</span>}
                  </p>
                  {(edu.start_year || edu.end_year) && (
                    <span className="text-slate-500 text-[11px]">
                      {edu.start_year || ''} – {edu.end_year || 'Present'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Certifications */}
          {Boolean(content.certifications && content.certifications.length > 0) && (
            <div className="space-y-1">
              <h2 className="text-xs font-bold text-slate-950 uppercase tracking-wider border-b border-slate-300 pb-0.5">
                Certifications
              </h2>
              <ul className="list-disc list-outside pl-4 text-xs text-slate-800 space-y-0.5">
                {content.certifications?.map((c, idx) => (
                  <li key={idx}>
                    <strong>{c.name}</strong> — {c.issuer} {c.date ? `(${c.date})` : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Achievements */}
          {Boolean(content.achievements && content.achievements.length > 0) && (
            <div className="space-y-1">
              <h2 className="text-xs font-bold text-slate-950 uppercase tracking-wider border-b border-slate-300 pb-0.5">
                Key Achievements
              </h2>
              <ul className="list-disc list-outside pl-4 text-xs text-slate-800 space-y-0.5">
                {content.achievements?.map((a, idx) => (
                  <li key={idx}>
                    <strong>{a.title}</strong>: {a.description}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Bottom Download Bar */}
        <div className="flex justify-center pt-4">
          <a
            href={downloadUrl}
            download
            className="px-8 py-3.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold text-sm flex items-center space-x-2.5 shadow-xl shadow-brand-500/25 transition-all active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Download My Tailored ATS PDF</span>
          </a>
        </div>
      </div>
    </div>
  );
};
