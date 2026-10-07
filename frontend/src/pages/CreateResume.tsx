import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import {
  CompareResumeResponse,
  TailoredResume
} from '../types';
import {
  Sparkles,
  Upload,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  CheckSquare,
  Square,
  FileType,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';

export const CreateResume: React.FC = () => {
  const navigate = useNavigate();

  // Workflow Steps: 'input' -> 'review' -> 'generating'
  const [currentStep, setCurrentStep] = useState<'input' | 'review' | 'generating'>('input');

  // Resume Source Selection
  const [resumeSource, setResumeSource] = useState<'profile' | 'upload' | 'paste'>('profile');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [pastedResumeText, setPastedResumeText] = useState('');
  const [parsedCustomResume, setParsedCustomResume] = useState<any | null>(null);
  const [isParsingResume, setIsParsingResume] = useState(false);

  // Job Description Input
  const [jdText, setJdText] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [targetCompany, setTargetCompany] = useState('');

  // Comparison & Suggestions State
  const [comparisonResult, setComparisonResult] = useState<CompareResumeResponse | null>(null);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Record<string, boolean>>({});
  const [saveAsMasterProfile, setSaveAsMasterProfile] = useState<boolean>(false);

  // Fetch Master Profile
  const { data: profileData, isLoading: isProfileLoading } = useQuery({
    queryKey: ['masterProfile'],
    queryFn: api.getMasterProfile,
  });

  const hasMasterProfile = profileData?.exists && Boolean(profileData?.profile?.name);
  const masterProfile = profileData?.profile;

  // Auto-select "profile" if master profile exists, otherwise "upload"
  useEffect(() => {
    if (!isProfileLoading) {
      if (hasMasterProfile) {
        setResumeSource('profile');
      } else {
        setResumeSource('upload');
      }
    }
  }, [hasMasterProfile, isProfileLoading]);

  // Upload & Parse Mutation
  const handleFileUpload = async (file: File) => {
    setUploadedFile(file);
    setIsParsingResume(true);
    try {
      const res = await api.uploadAndParseResume(file);
      setParsedCustomResume(res.parsed_resume);
    } catch (err: any) {
      alert(err.message || 'Failed to extract text from resume file.');
    } finally {
      setIsParsingResume(false);
    }
  };

  const handleParsePastedText = async () => {
    if (!pastedResumeText.trim()) {
      alert('Please paste your resume text first.');
      return;
    }
    setIsParsingResume(true);
    try {
      const res = await api.uploadAndParseResume(undefined, pastedResumeText.trim());
      setParsedCustomResume(res.parsed_resume);
    } catch (err: any) {
      alert(err.message || 'Failed to parse resume text.');
    } finally {
      setIsParsingResume(false);
    }
  };

  // Compare & Analyze Mutation
  const compareMutation = useMutation({
    mutationFn: async () => {
      let activeResume: any = null;
      if (resumeSource === 'profile') {
        if (!hasMasterProfile) {
          throw new Error('Master Profile is not configured. Please upload or paste a resume.');
        }
        activeResume = masterProfile;
      } else {
        if (!parsedCustomResume) {
          throw new Error('Please upload or parse your existing resume first.');
        }
        activeResume = parsedCustomResume;
      }

      if (!jdText.trim()) {
        throw new Error('Please enter or paste a Job Description.');
      }

      return await api.analyzeAndCompareResume(activeResume, jdText.trim());
    },
    onSuccess: (data) => {
      setComparisonResult(data);
      // Pre-select suggestions
      const initialSelected: Record<string, boolean> = {};
      data.suggestions.forEach((sug) => {
        initialSelected[sug.id] = sug.default_selected !== false;
      });
      setSelectedSuggestions(initialSelected);
      setCurrentStep('review');
    },
    onError: (err: any) => {
      alert(err.message || 'Comparison failed. Please verify resume and JD.');
    },
  });

  // Apply & Generate Mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      let activeResume: any = null;
      if (resumeSource === 'profile') {
        activeResume = masterProfile;
      } else {
        activeResume = parsedCustomResume;
      }

      const approved = (comparisonResult?.suggestions || []).filter(
        (sug) => selectedSuggestions[sug.id]
      );

      return await api.applyAndGenerateResume({
        resume_content: activeResume,
        job_description_text: jdText.trim(),
        approved_suggestions: approved,
        save_as_master_profile: saveAsMasterProfile,
        target_role: targetRole.trim() || undefined,
        target_company: targetCompany.trim() || undefined,
        job_analysis: comparisonResult?.job_analysis,
      });
    },
    onSuccess: (res: TailoredResume) => {
      navigate(`/resumes/${res.id}`);
    },
    onError: (err: any) => {
      setCurrentStep('review');
      alert(err.message || 'Failed to generate tailored resume.');
    },
  });

  const toggleSuggestion = (id: string) => {
    setSelectedSuggestions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const selectAllSuggestions = (select: boolean) => {
    const updated: Record<string, boolean> = {};
    (comparisonResult?.suggestions || []).forEach((s) => {
      updated[s.id] = select;
    });
    setSelectedSuggestions(updated);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-fadeIn">
      {/* Top Header */}
      <div className="pb-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
              <span>Create & Customize Resume</span>
            </h1>
            <p className="text-xs text-slate-400">
              Use your existing resume, paste a JD, review smart recommendations, and export a customized ATS PDF.
            </p>
          </div>
        </div>

        {/* Stepper Indicator */}
        <div className="flex items-center space-x-2 text-xs font-semibold">
          <span
            className={`px-3 py-1 rounded-full border ${
              currentStep === 'input'
                ? 'bg-brand-500/20 border-brand-500 text-brand-300'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            1. Resume & JD
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span
            className={`px-3 py-1 rounded-full border ${
              currentStep === 'review'
                ? 'bg-brand-500/20 border-brand-500 text-brand-300'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            2. Review Suggestions
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span
            className={`px-3 py-1 rounded-full border ${
              currentStep === 'generating'
                ? 'bg-brand-500/20 border-brand-500 text-brand-300'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            3. Final PDF
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STEP 1: INPUT RESUME & JOB DESCRIPTION                                  */}
      {/* ========================================================================= */}
      {currentStep === 'input' && (
        <div className="space-y-6">
          {/* SECTION 1: RESUME SELECTION */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider text-slate-200">
                  Step 1: Select or Upload Existing Resume
                </h2>
                <p className="text-xs text-slate-400">
                  Reuse your existing resume without typing everything from scratch.
                </p>
              </div>

              {/* Source Tabs */}
              <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setResumeSource('profile')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    resumeSource === 'profile'
                      ? 'bg-brand-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Saved Profile
                </button>
                <button
                  type="button"
                  onClick={() => setResumeSource('upload')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    resumeSource === 'upload'
                      ? 'bg-brand-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setResumeSource('paste')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    resumeSource === 'paste'
                      ? 'bg-brand-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Paste Text
                </button>
              </div>
            </div>

            {/* TAB 1: SAVED MASTER PROFILE */}
            {resumeSource === 'profile' && (
              <div>
                {hasMasterProfile ? (
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white text-sm">{masterProfile?.name}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-medium">
                            Saved Source of Truth
                          </span>
                        </div>
                        <p className="text-slate-400 mt-0.5">
                          {masterProfile?.title} • {masterProfile?.skills.length || 0} skills •{' '}
                          {masterProfile?.experiences.length || 0} experiences •{' '}
                          {masterProfile?.projects.length || 0} projects
                        </p>
                      </div>
                    </div>
                    <Link
                      to="/profile"
                      className="text-xs text-brand-400 hover:text-brand-300 font-semibold underline shrink-0"
                    >
                      View / Edit Profile
                    </Link>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-200 text-xs flex items-start space-x-3">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-amber-300">No Master Profile Saved Yet</p>
                      <p className="text-amber-200/80 mt-0.5">
                        Switch to <strong>Upload File</strong> or <strong>Paste Text</strong> to import your existing resume right now, or{' '}
                        <Link to="/profile" className="text-brand-400 underline font-semibold">
                          enter your Master Profile
                        </Link>
                        .
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: UPLOAD FILE */}
            {resumeSource === 'upload' && (
              <div className="space-y-3">
                <div className="border-2 border-dashed border-slate-700 hover:border-brand-500/60 rounded-xl p-6 text-center transition-colors bg-slate-950/40">
                  <input
                    type="file"
                    id="resume-file-input"
                    accept=".pdf,.docx,.txt"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                  <label htmlFor="resume-file-input" className="cursor-pointer block space-y-2">
                    <div className="w-12 h-12 rounded-xl bg-slate-800 mx-auto flex items-center justify-center text-brand-400">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">
                        Click to upload your existing resume (PDF, Word, or TXT)
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Supported: .pdf, .docx, .txt (Preserves your existing resume structure)
                      </p>
                    </div>
                  </label>
                </div>

                {isParsingResume && (
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center space-x-2 text-xs text-brand-400 animate-pulse">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Extracting and parsing resume data...</span>
                  </div>
                )}

                {parsedCustomResume && (
                  <div className="p-4 rounded-xl bg-slate-950 border border-cyan-900/40 text-xs flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                      <div>
                        <span className="font-bold text-white">
                          Resume Loaded: {parsedCustomResume.name || 'Candidate'}{uploadedFile ? ` (${uploadedFile.name})` : ''}
                        </span>
                        <p className="text-[11px] text-slate-400">
                          {parsedCustomResume.skills?.length || 0} skills detected • Structure preserved
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-mono">
                      Ready for JD
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: PASTE TEXT */}
            {resumeSource === 'paste' && (
              <div className="space-y-3">
                <textarea
                  rows={6}
                  placeholder="Paste your existing resume text here..."
                  value={pastedResumeText}
                  onChange={(e) => setPastedResumeText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-brand-500"
                />
                <button
                  type="button"
                  onClick={handleParsePastedText}
                  disabled={isParsingResume || !pastedResumeText.trim()}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center space-x-2 disabled:opacity-50"
                >
                  {isParsingResume ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FileType className="w-3.5 h-3.5 text-brand-400" />
                  )}
                  <span>Extract Resume Details</span>
                </button>

                {parsedCustomResume && (
                  <div className="p-3 rounded-lg bg-slate-950 border border-cyan-900/40 text-xs flex items-center space-x-2 text-cyan-300">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                    <span>Resume extracted: {parsedCustomResume.name || 'Ready'} ({parsedCustomResume.skills?.length || 0} skills)</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SECTION 2: JOB DESCRIPTION */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider">
                Step 2: Enter or Paste Job Description (JD) *
              </label>
              <span className="text-[11px] text-slate-500 font-mono">
                {jdText.length} characters
              </span>
            </div>

            <textarea
              rows={8}
              placeholder={`Paste the Job Description here (plain text, copied words, or requirements list)...\n\nExample:\nWe are hiring a Python / Django Developer. Key requirements:\n- 3+ years Python & Django REST framework\n- PostgreSQL and Redis caching\n- Docker & CI/CD pipeline experience\n- Collaborative team player`}
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono leading-relaxed focus:outline-none focus:border-brand-500 placeholder-slate-600"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Target Job Title (Optional override)
                </label>
                <input
                  type="text"
                  placeholder="Auto-detected from JD if left blank"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Target Company (Optional override)
                </label>
                <input
                  type="text"
                  placeholder="Auto-detected from JD if left blank"
                  value={targetCompany}
                  onChange={(e) => setTargetCompany(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>
          </div>

          {/* Compare Button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => compareMutation.mutate()}
              disabled={
                compareMutation.isPending ||
                !jdText.trim() ||
                (resumeSource === 'profile' && !hasMasterProfile) ||
                (resumeSource !== 'profile' && !parsedCustomResume)
              }
              className="px-8 py-3.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold text-sm flex items-center space-x-2 shadow-xl shadow-brand-500/25 transition-all active:scale-95 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              {compareMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Analyzing Resume & Comparing with JD...</span>
                </>
              ) : (
                <>
                  <span>Analyze Resume & Compare with JD</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: REVIEW MATCHING & APPROVE SUGGESTIONS                           */}
      {/* ========================================================================= */}
      {currentStep === 'review' && comparisonResult && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header Summary */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-brand-400 font-bold">
                  Target Role Analysis
                </span>
                <h2 className="text-xl font-bold text-white">
                  {comparisonResult.job_analysis?.job_title || targetRole || 'Target Role'}
                </h2>
                {comparisonResult.job_analysis?.company && (
                  <p className="text-xs text-slate-400">@{comparisonResult.job_analysis.company}</p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setCurrentStep('input')}
                className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 flex items-center space-x-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Edit Resume / JD</span>
              </button>
            </div>

            {/* MATCHING SKILLS FOUND */}
            <div>
              <div className="flex items-center space-x-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Skills & Keywords Already Present in Your Resume ({comparisonResult.matching_skills?.length || 0})</span>
              </div>
              <p className="text-[11px] text-slate-400 mb-2.5">
                These qualifications are already verified in your resume and will be prominently highlighted:
              </p>
              {comparisonResult.matching_skills?.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No direct matching skills found in initial scan.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {comparisonResult.matching_skills?.map((s) => (
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
          </div>

          {/* SUGGESTIONS CHECKLIST (THE KEY USER REQUIREMENT) */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider text-slate-200 flex items-center space-x-2">
                  <SlidersHorizontal className="w-4 h-4 text-brand-400" />
                  <span>Review Recommended Suggestions</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Select which recommendations you approve to include in your customized resume.
                </p>
              </div>

              <div className="flex items-center space-x-2 text-xs">
                <button
                  type="button"
                  onClick={() => selectAllSuggestions(true)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium border border-slate-700"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => selectAllSuggestions(false)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium border border-slate-700"
                >
                  Deselect All
                </button>
              </div>
            </div>

            {/* Suggestions List */}
            <div className="space-y-3 pt-2">
              {comparisonResult.suggestions?.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No additional suggestions needed. Resume is already fully aligned!</p>
              ) : (
                comparisonResult.suggestions?.map((sug) => {
                  const isChecked = Boolean(selectedSuggestions[sug.id]);
                  return (
                    <div
                      key={sug.id}
                      onClick={() => toggleSuggestion(sug.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start space-x-3 ${
                        isChecked
                          ? 'bg-brand-500/5 border-brand-500/40 text-white'
                          : 'bg-slate-950/40 border-slate-800 text-slate-400 opacity-60'
                      }`}
                    >
                      <button
                        type="button"
                        className="mt-0.5 text-brand-400 focus:outline-none"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSuggestion(sug.id);
                        }}
                      >
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-brand-400" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-600" />
                        )}
                      </button>

                      <div className="flex-1 space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-white">{sug.title}</span>
                          <span
                            className={`text-[10px] px-2 py-0.2 rounded-full uppercase font-mono font-bold ${
                              sug.type === 'skill'
                                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                                : sug.type === 'keyword'
                                ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
                                : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                            }`}
                          >
                            {sug.type}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 font-mono">{sug.content}</p>
                        <p className="text-[11px] text-slate-400 leading-tight">{sug.reason}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Profile Persistence Option */}
            <div className="pt-4 border-t border-slate-800 flex items-center space-x-2 text-xs text-slate-300">
              <input
                type="checkbox"
                id="save-as-master-check"
                checked={saveAsMasterProfile}
                onChange={(e) => setSaveAsMasterProfile(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-brand-500 focus:ring-brand-500 cursor-pointer"
              />
              <label htmlFor="save-as-master-check" className="cursor-pointer select-none">
                Also save these approved customizations into my Master Profile
              </label>
            </div>
            <p className="text-[11px] text-slate-500 pl-5">
              (Leave unchecked to keep your original Master Profile untouched while creating this job-specific resume)
            </p>
          </div>

          {/* Action Button: Apply & Generate Final PDF */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep('input')}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 flex items-center space-x-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCurrentStep('generating');
                generateMutation.mutate();
              }}
              disabled={generateMutation.isPending}
              className="px-8 py-3.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold text-sm flex items-center space-x-2.5 shadow-xl shadow-brand-500/25 transition-all active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>Apply Suggestions & Generate ATS PDF</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: GENERATING SCREEN                                               */}
      {/* ========================================================================= */}
      {currentStep === 'generating' && (
        <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4 animate-fadeIn">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400 mx-auto animate-pulse">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white">Generating Your Customized ATS Resume</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            Applying approved suggestions, optimizing bullet points with strong action verbs, running deterministic truthfulness audit, calculating ATS score, and rendering the ATS single-column PDF...
          </p>
          <div className="pt-4 flex justify-center">
            <div className="w-6 h-6 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      )}
    </div>
  );
};
