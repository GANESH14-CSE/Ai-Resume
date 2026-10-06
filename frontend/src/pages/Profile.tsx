import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { MasterProfile, Experience, Project, Education, Certification, Achievement, SkillCategory, EmploymentType } from '../types';
import {
  UserCheck,
  Save,
  Plus,
  Trash2,
  Code,
  Briefcase,
  FolderGit2,
  GraduationCap,
  Award,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  RotateCcw
} from 'lucide-react';

const EMPTY_PROFILE: MasterProfile = {
  name: '',
  title: '',
  email: '',
  phone: '',
  location: '',
  linkedin: '',
  github: '',
  portfolio: '',
  summary: '',
  other_info: '',
  skills: [],
  experiences: [],
  projects: [],
  education: [],
  certifications: [],
  achievements: [],
};

export const Profile: React.FC = () => {
  const queryClient = useQueryClient();
  const [profile, setProfile] = useState<MasterProfile>(EMPTY_PROFILE);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'skills' | 'experience' | 'projects' | 'education' | 'extra'>('info');

  // Skill input states
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState<SkillCategory>('language');

  const { data, isLoading } = useQuery({
    queryKey: ['masterProfile'],
    queryFn: api.getMasterProfile,
  });

  useEffect(() => {
    if (data?.profile) {
      setProfile({
        ...EMPTY_PROFILE,
        ...data.profile,
        skills: data.profile.skills || [],
        experiences: data.profile.experiences || [],
        projects: data.profile.projects || [],
        education: data.profile.education || [],
        certifications: data.profile.certifications || [],
        achievements: data.profile.achievements || [],
      });
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: api.saveMasterProfile,
    onSuccess: (res) => {
      queryClient.setQueryData(['masterProfile'], res);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    },
    onError: (err: any) => {
      alert(`Failed to save profile: ${err.message || 'Unknown error'}`);
    }
  });

  const resetMutation = useMutation({
    mutationFn: api.resetMasterProfile,
    onSuccess: () => {
      setProfile(EMPTY_PROFILE);
      queryClient.invalidateQueries({ queryKey: ['masterProfile'] });
    },
  });

  const handleSave = () => {
    if (!profile.name.trim()) {
      alert('Please provide your Full Name.');
      setActiveTab('info');
      return;
    }
    saveMutation.mutate(profile);
  };

  const extractMutation = useMutation({
    mutationFn: api.extractProfileFromResume,
    onSuccess: (extractedProfile) => {
      const newProfile = {
        ...EMPTY_PROFILE,
        ...extractedProfile,
      };
      setProfile(newProfile);
      // Automatically save after extracting
      saveMutation.mutate(newProfile);
    },
    onError: (err: any) => {
      alert(`Failed to extract resume: ${err.message || 'Unknown error'}`);
    }
  });

  const handleUploadResume = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      extractMutation.mutate(e.target.files[0]);
    }
    // reset input so the same file can be selected again
    e.target.value = '';
  };

  // Skill Management
  const addSkill = () => {
    if (!newSkillName.trim()) return;
    const exists = profile.skills.some(
      (s) => s.name.toLowerCase() === newSkillName.trim().toLowerCase()
    );
    if (!exists) {
      setProfile({
        ...profile,
        skills: [...profile.skills, { name: newSkillName.trim(), category: newSkillCategory }],
      });
    }
    setNewSkillName('');
  };

  const removeSkill = (name: string) => {
    setProfile({
      ...profile,
      skills: profile.skills.filter((s) => s.name !== name),
    });
  };

  // Experience Management
  const addExperience = () => {
    const newExp: Experience = {
      company: '',
      role: '',
      employment_type: 'job',
      location: '',
      start_date: '',
      end_date: null,
      description_points: [''],
      technologies: [],
    };
    setProfile({ ...profile, experiences: [newExp, ...profile.experiences] });
  };

  const updateExperience = (index: number, field: keyof Experience, value: any) => {
    const updated = [...profile.experiences];
    updated[index] = { ...updated[index], [field]: value };
    setProfile({ ...profile, experiences: updated });
  };

  const removeExperience = (index: number) => {
    setProfile({
      ...profile,
      experiences: profile.experiences.filter((_, i) => i !== index),
    });
  };

  // Project Management
  const addProject = () => {
    const newProj: Project = {
      name: '',
      domain: '',
      github_url: '',
      live_url: '',
      start_date: '',
      end_date: null,
      description_points: [''],
      technologies: [],
    };
    setProfile({ ...profile, projects: [newProj, ...profile.projects] });
  };

  const updateProject = (index: number, field: keyof Project, value: any) => {
    const updated = [...profile.projects];
    updated[index] = { ...updated[index], [field]: value };
    setProfile({ ...profile, projects: updated });
  };

  const removeProject = (index: number) => {
    setProfile({
      ...profile,
      projects: profile.projects.filter((_, i) => i !== index),
    });
  };

  // Education Management
  const addEducation = () => {
    const newEdu: Education = {
      institution: '',
      degree: '',
      field: '',
      start_year: null,
      end_year: null,
      grade: '',
    };
    setProfile({ ...profile, education: [...profile.education, newEdu] });
  };

  const updateEducation = (index: number, field: keyof Education, value: any) => {
    const updated = [...profile.education];
    updated[index] = { ...updated[index], [field]: value };
    setProfile({ ...profile, education: updated });
  };

  const removeEducation = (index: number) => {
    setProfile({
      ...profile,
      education: profile.education.filter((_, i) => i !== index),
    });
  };

  // Certifications Management
  const addCertification = () => {
    const newCert: Certification = {
      name: '',
      issuer: '',
      date: null,
      credential_url: '',
    };
    setProfile({ ...profile, certifications: [...profile.certifications, newCert] });
  };

  const updateCertification = (index: number, field: keyof Certification, value: any) => {
    const updated = [...profile.certifications];
    updated[index] = { ...updated[index], [field]: value };
    setProfile({ ...profile, certifications: updated });
  };

  const removeCertification = (index: number) => {
    setProfile({
      ...profile,
      certifications: profile.certifications.filter((_, i) => i !== index),
    });
  };

  // Achievements Management
  const addAchievement = () => {
    const newAch: Achievement = {
      title: '',
      description: '',
      date: null,
    };
    setProfile({ ...profile, achievements: [...profile.achievements, newAch] });
  };

  const updateAchievement = (index: number, field: keyof Achievement, value: any) => {
    const updated = [...profile.achievements];
    updated[index] = { ...updated[index], [field]: value };
    setProfile({ ...profile, achievements: updated });
  };

  const removeAchievement = (index: number) => {
    setProfile({
      ...profile,
      achievements: profile.achievements.filter((_, i) => i !== index),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex items-center space-x-3 text-brand-400">
          <div className="w-5 h-5 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading Master Profile...</span>
        </div>
      </div>
    );
  }

  const isProfileEmpty = !profile.name && profile.skills.length === 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 animate-fadeIn">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800 gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
              <span>My Master Profile</span>
              <span className="px-2 py-0.5 text-[10px] rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                Single Source of Truth
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Only real factual information. The AI tailors your resumes strictly from this verified profile with zero fabrications.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          <label
            title="Upload Resume to Auto-Fill Profile"
            className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 flex items-center space-x-1.5 cursor-pointer transition-colors"
          >
            {extractMutation.isPending ? (
              <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span className="hidden sm:inline">
              {extractMutation.isPending ? 'Extracting...' : 'Upload Resume'}
            </span>
            <input type="file" accept=".pdf,.docx,.txt" onChange={handleUploadResume} className="hidden" disabled={extractMutation.isPending} />
          </label>

          <button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="px-5 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold text-xs flex items-center space-x-2 shadow-lg shadow-brand-500/20 transition-all active:scale-95 disabled:opacity-50"
          >
            {saveMutation.isPending ? (
              <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>Save Master Profile</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Master Profile saved successfully! Your real data is now stored as the single source of truth.</span>
          </div>
        </div>
      )}

      {isProfileEmpty && (
        <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-200 text-xs flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-300">Set Up Your Real Profile (First Time Setup)</p>
            <p className="text-amber-200/80 mt-1">
              Please enter your actual personal details, technical skills, work experience, and projects below. Once saved, you can paste any Job Description and automatically generate truthful, tailored resumes!
            </p>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto space-x-1 border-b border-slate-800 text-xs pb-px scrollbar-none">
        {[
          { id: 'info', label: '1. Personal & Contact', icon: UserCheck },
          { id: 'skills', label: '2. Technical Skills', icon: Code, count: profile.skills.length },
          { id: 'experience', label: '3. Experience & Internships', icon: Briefcase, count: profile.experiences.length },
          { id: 'projects', label: '4. Projects', icon: FolderGit2, count: profile.projects.length },
          { id: 'education', label: '5. Education & Certs', icon: GraduationCap, count: profile.education.length + profile.certifications.length },
          { id: 'extra', label: '6. Achievements & Summary', icon: Award },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2.5 font-semibold transition-all border-b-2 whitespace-nowrap ${
                isActive
                  ? 'border-brand-500 text-brand-400 bg-brand-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isActive ? 'bg-brand-500/20 text-brand-300' : 'bg-slate-800 text-slate-400'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: PERSONAL & CONTACT */}
      {activeTab === 'info' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider text-slate-300">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Real Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Alex Rivera"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Professional Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Python Backend Developer / Full Stack Engineer"
                  value={profile.title}
                  onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Email Address *</label>
                <input
                  type="email"
                  placeholder="e.g. alex@example.com"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="e.g. +1 (555) 019-2834"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1">Location (City, Country / Remote)</label>
                <input
                  type="text"
                  placeholder="e.g. San Francisco, CA (Open to Remote)"
                  value={profile.location}
                  onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider text-slate-300">Profiles & Portfolios</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">LinkedIn URL</label>
                <input
                  type="url"
                  placeholder="https://linkedin.com/in/username"
                  value={profile.linkedin}
                  onChange={(e) => setProfile({ ...profile, linkedin: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">GitHub URL</label>
                <input
                  type="url"
                  placeholder="https://github.com/username"
                  value={profile.github}
                  onChange={(e) => setProfile({ ...profile, github: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Portfolio / Personal Website</label>
                <input
                  type="url"
                  placeholder="https://myportfolio.dev"
                  value={profile.portfolio}
                  onChange={(e) => setProfile({ ...profile, portfolio: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider text-slate-300">Master Career Summary</h2>
            <p className="text-xs text-slate-400">
              Provide your real core career background and strengths. When tailoring resumes, the AI will adapt this summary for specific job roles while strictly adhering to the facts written here.
            </p>
            <textarea
              rows={4}
              placeholder="e.g. Backend developer with experience building production microservices in Django and PostgreSQL. Passionate about API performance, asynchronous task queues, and clean software architecture."
              value={profile.summary}
              onChange={(e) => setProfile({ ...profile, summary: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-brand-500 leading-relaxed"
            />
          </div>
        </div>
      )}

      {/* TAB 2: TECHNICAL SKILLS */}
      {activeTab === 'skills' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider text-slate-300">Add Real Skills</h2>
                <p className="text-xs text-slate-400">
                  Only add skills you actually have. Missing skills in job descriptions will be honestly flagged, never fabricated.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <select
                value={newSkillCategory}
                onChange={(e) => setNewSkillCategory(e.target.value as SkillCategory)}
                className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-brand-500"
              >
                <option value="language">Programming Language</option>
                <option value="framework">Framework / Library</option>
                <option value="database">Database</option>
                <option value="tool">Tool / DevOps / Cloud</option>
                <option value="other">Other Skill</option>
              </select>

              <input
                type="text"
                placeholder="Skill name (e.g. Python, Django, Docker)..."
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addSkill()}
                className="flex-1 min-w-[200px] px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500"
              />

              <button
                type="button"
                onClick={addSkill}
                className="px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Skill</span>
              </button>
            </div>
          </div>

          {/* Categorized Skills Display */}
          {(['language', 'framework', 'database', 'tool', 'other'] as SkillCategory[]).map((cat) => {
            const catSkills = profile.skills.filter((s) => s.category === cat);
            const titles: Record<SkillCategory, string> = {
              language: 'Programming Languages',
              framework: 'Frameworks & Libraries',
              database: 'Databases & Storage',
              tool: 'Tools, DevOps & Cloud',
              other: 'Other Technical Skills',
            };
            return (
              <div key={cat} className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                    <span>{titles[cat]}</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-400 font-mono">
                      {catSkills.length}
                    </span>
                  </h3>
                </div>

                {catSkills.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No {titles[cat].toLowerCase()} added yet.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {catSkills.map((s) => (
                      <span
                        key={s.name}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/80 text-slate-200 text-xs font-medium group hover:border-brand-500/50 transition-colors"
                      >
                        <span>{s.name}</span>
                        <button
                          type="button"
                          onClick={() => removeSkill(s.name)}
                          className="text-slate-500 hover:text-rose-400 transition-colors ml-1"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: WORK EXPERIENCE & INTERNSHIPS */}
      {activeTab === 'experience' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider text-slate-300">
                Work Experience & Internships
              </h2>
              <p className="text-xs text-slate-400">
                Enter your real career history. The AI will polish bullet points with strong action verbs and ATS keywords while strictly preserving verified metrics.
              </p>
            </div>
            <button
              type="button"
              onClick={addExperience}
              className="px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Experience</span>
            </button>
          </div>

          {profile.experiences.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/40 border border-slate-800 rounded-xl space-y-3">
              <Briefcase className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-sm text-slate-400">No work experience or internships recorded.</p>
              <button
                onClick={addExperience}
                className="text-xs text-brand-400 hover:underline font-semibold"
              >
                + Add your first role
              </button>
            </div>
          ) : (
            profile.experiences.map((exp, idx) => (
              <div key={idx} className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-4 relative">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-full bg-slate-800 text-brand-400 flex items-center justify-center text-xs font-mono font-bold">
                      {idx + 1}
                    </span>
                    <h3 className="text-sm font-bold text-white">
                      {exp.role || 'New Role'} {exp.company ? `@ ${exp.company}` : ''}
                    </h3>
                  </div>
                  <button
                    onClick={() => removeExperience(idx)}
                    className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                    title="Remove experience"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Company / Organization *</label>
                    <input
                      type="text"
                      placeholder="e.g. Acme Tech"
                      value={exp.company}
                      onChange={(e) => updateExperience(idx, 'company', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Job Title / Role *</label>
                    <input
                      type="text"
                      placeholder="e.g. Backend Software Engineer"
                      value={exp.role}
                      onChange={(e) => updateExperience(idx, 'role', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Employment Type</label>
                    <select
                      value={exp.employment_type}
                      onChange={(e) => updateExperience(idx, 'employment_type', e.target.value as EmploymentType)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-brand-500"
                    >
                      <option value="job">Full-time / Part-time</option>
                      <option value="internship">Internship</option>
                      <option value="contract">Contract / Freelance</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Location</label>
                    <input
                      type="text"
                      placeholder="e.g. New York, NY (Remote)"
                      value={exp.location}
                      onChange={(e) => updateExperience(idx, 'location', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Start Date</label>
                    <input
                      type="text"
                      placeholder="e.g. Jan 2022"
                      value={exp.start_date || ''}
                      onChange={(e) => updateExperience(idx, 'start_date', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">End Date (Leave blank if Present)</label>
                    <input
                      type="text"
                      placeholder="e.g. Dec 2023 or Present"
                      value={exp.end_date || ''}
                      onChange={(e) => updateExperience(idx, 'end_date', e.target.value || null)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                {/* Bullet Points */}
                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-medium text-slate-300">
                    Factual Bullet Points & Responsibilities (1 per line or array)
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Enter factual responsibilities, one bullet per line. Example:&#10;• Developed Django REST APIs handling payment processing and donation webhooks.&#10;• Integrated Redis caching for frequent user queries.&#10;• Collaborated in an Agile sprint cycle with 4 engineers."
                    value={exp.description_points.join('\n')}
                    onChange={(e) =>
                      updateExperience(
                        idx,
                        'description_points',
                        e.target.value.split('\n').filter((l) => l.trim().length > 0)
                      )
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-brand-500 leading-relaxed"
                  />
                  <p className="text-[11px] text-slate-500">
                    Tip: State exact facts and real accomplishments. The AI will preserve your facts while optimizing formatting for ATS parsers.
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 4: PROJECTS */}
      {activeTab === 'projects' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider text-slate-300">Real Projects</h2>
              <p className="text-xs text-slate-400">
                Personal or academic projects. For each job application, the AI will prioritize the projects with technologies matching the Job Description.
              </p>
            </div>
            <button
              type="button"
              onClick={addProject}
              className="px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Project</span>
            </button>
          </div>

          {profile.projects.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/40 border border-slate-800 rounded-xl space-y-3">
              <FolderGit2 className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-sm text-slate-400">No projects added yet.</p>
              <button
                onClick={addProject}
                className="text-xs text-brand-400 hover:underline font-semibold"
              >
                + Add your first project
              </button>
            </div>
          ) : (
            profile.projects.map((proj, idx) => (
              <div key={idx} className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-full bg-slate-800 text-brand-400 flex items-center justify-center text-xs font-mono font-bold">
                      {idx + 1}
                    </span>
                    <h3 className="text-sm font-bold text-white">{proj.name || 'New Project'}</h3>
                  </div>
                  <button
                    onClick={() => removeProject(idx)}
                    className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Project Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. AI Resume Generator"
                      value={proj.name}
                      onChange={(e) => updateProject(idx, 'name', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Domain / Category</label>
                    <input
                      type="text"
                      placeholder="e.g. AI/ML, FinTech, Full-Stack"
                      value={proj.domain}
                      onChange={(e) => updateProject(idx, 'domain', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">GitHub / Code URL</label>
                    <input
                      type="url"
                      placeholder="https://github.com/..."
                      value={proj.github_url}
                      onChange={(e) => updateProject(idx, 'github_url', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-slate-300 mb-1">Live URL / Demo Link</label>
                    <input
                      type="url"
                      placeholder="https://myproject.com"
                      value={proj.live_url}
                      onChange={(e) => updateProject(idx, 'live_url', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Technologies Used (comma-separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. Python, Django, React, SQLite"
                      value={(proj.technologies || []).join(', ')}
                      onChange={(e) =>
                        updateProject(
                          idx,
                          'technologies',
                          e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                        )
                      }
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-medium text-slate-300">
                    Project Bullet Points & Features (1 per line)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="• Built a donation web portal integrating Razorpay API for checkout.&#10;• Designed PostgreSQL database models and Django REST APIs.&#10;• Created a responsive React user interface."
                    value={proj.description_points.join('\n')}
                    onChange={(e) =>
                      updateProject(
                        idx,
                        'description_points',
                        e.target.value.split('\n').filter((l) => l.trim().length > 0)
                      )
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 5: EDUCATION & CERTS */}
      {activeTab === 'education' && (
        <div className="space-y-8">
          {/* Education */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider text-slate-300">Education</h2>
                <p className="text-xs text-slate-400">Degrees, colleges, and academic credentials.</p>
              </div>
              <button
                type="button"
                onClick={addEducation}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center space-x-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Education</span>
              </button>
            </div>

            {profile.education.map((edu, idx) => (
              <div key={idx} className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Degree #{idx + 1}</span>
                  <button onClick={() => removeEducation(idx)} className="text-slate-500 hover:text-rose-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Institution / University</label>
                    <input
                      type="text"
                      placeholder="e.g. Stanford University"
                      value={edu.institution}
                      onChange={(e) => updateEducation(idx, 'institution', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Degree</label>
                    <input
                      type="text"
                      placeholder="e.g. Bachelor of Technology / B.S."
                      value={edu.degree}
                      onChange={(e) => updateEducation(idx, 'degree', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Field of Study</label>
                    <input
                      type="text"
                      placeholder="e.g. Computer Science and Engineering"
                      value={edu.field}
                      onChange={(e) => updateEducation(idx, 'field', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Start Year</label>
                    <input
                      type="number"
                      placeholder="2020"
                      value={edu.start_year || ''}
                      onChange={(e) => updateEducation(idx, 'start_year', e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">End Year</label>
                    <input
                      type="number"
                      placeholder="2024"
                      value={edu.end_year || ''}
                      onChange={(e) => updateEducation(idx, 'end_year', e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Grade / CGPA</label>
                    <input
                      type="text"
                      placeholder="e.g. 8.8 CGPA or 3.8 GPA"
                      value={edu.grade}
                      onChange={(e) => updateEducation(idx, 'grade', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Certifications */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider text-slate-300">Certifications</h2>
                <p className="text-xs text-slate-400">Industry certifications and credentials.</p>
              </div>
              <button
                type="button"
                onClick={addCertification}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center space-x-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Certification</span>
              </button>
            </div>

            {profile.certifications.map((c, idx) => (
              <div key={idx} className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Certification #{idx + 1}</span>
                  <button onClick={() => removeCertification(idx)} className="text-slate-500 hover:text-rose-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Certification Name</label>
                    <input
                      type="text"
                      placeholder="e.g. AWS Certified Developer"
                      value={c.name}
                      onChange={(e) => updateCertification(idx, 'name', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Issuer / Authority</label>
                    <input
                      type="text"
                      placeholder="e.g. Amazon Web Services"
                      value={c.issuer}
                      onChange={(e) => updateCertification(idx, 'issuer', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Credential URL</label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={c.credential_url}
                      onChange={(e) => updateCertification(idx, 'credential_url', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: ACHIEVEMENTS & EXTRA */}
      {activeTab === 'extra' && (
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider text-slate-300">
                  Key Achievements & Honors
                </h2>
                <p className="text-xs text-slate-400">Competitions, hackathons, awards, and notable milestones.</p>
              </div>
              <button
                type="button"
                onClick={addAchievement}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center space-x-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Achievement</span>
              </button>
            </div>

            {profile.achievements.map((ach, idx) => (
              <div key={idx} className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Achievement #{idx + 1}</span>
                  <button onClick={() => removeAchievement(idx)} className="text-slate-500 hover:text-rose-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Title</label>
                    <input
                      type="text"
                      placeholder="e.g. 1st Place National Hackathon"
                      value={ach.title}
                      onChange={(e) => updateAchievement(idx, 'title', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Description</label>
                    <input
                      type="text"
                      placeholder="e.g. Built a real-time disaster management alert platform with 5 teammates."
                      value={ach.description}
                      onChange={(e) => updateAchievement(idx, 'description', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider text-slate-300">
              Other Relevant Information
            </h2>
            <p className="text-xs text-slate-400">
              Any other facts (e.g. open source contributions, leadership positions, languages spoken).
            </p>
            <textarea
              rows={3}
              placeholder="e.g. Fluent in English and Spanish. Active contributor to open-source Django repositories."
              value={profile.other_info || ''}
              onChange={(e) => setProfile({ ...profile, other_info: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500">Danger Zone:</span>
            <button
              type="button"
              onClick={() => {
                if (confirm('Are you sure you want to completely reset your Master Profile? This cannot be undone.')) {
                  resetMutation.mutate();
                }
              }}
              className="px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 text-xs flex items-center space-x-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Profile Data</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating Save Bar */}
      <div className="fixed bottom-6 right-8 z-40 bg-slate-900/90 backdrop-blur-md border border-slate-700 p-2.5 rounded-2xl shadow-2xl flex items-center space-x-3">
        <span className="text-xs text-slate-300 pl-2 hidden sm:inline">
          {profile.name ? `Editing: ${profile.name}` : 'Unsaved Profile'}
        </span>
        <button
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold text-xs flex items-center space-x-2 shadow-lg shadow-brand-500/25 transition-all active:scale-95 disabled:opacity-50"
        >
          {saveMutation.isPending ? (
            <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save className="w-3.5 h-3.5" />
          )}
          <span>Save Master Profile</span>
        </button>
      </div>
    </div>
  );
};
