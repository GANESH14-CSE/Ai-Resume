export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, any> | string[];
  };
}

export interface HealthCheckResponse {
  status: string;
  service: string;
  version: string;
  python_version: string;
  llm_provider: string;
  mock_llm: boolean;
}

export interface User {
  id: number;
  username: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export type SkillCategory = 'language' | 'framework' | 'database' | 'tool' | 'other';
export type EmploymentType = 'job' | 'internship' | 'contract';

export interface Skill {
  id?: string;
  name: string;
  category: SkillCategory;
  proficiency?: string;
  aliases?: string[];
}

export interface Experience {
  id?: string;
  company: string;
  role: string;
  employment_type: EmploymentType;
  location?: string;
  start_date?: string | null;
  end_date?: string | null;
  description_points: string[];
  technologies?: string[];
}

export interface Project {
  id?: string;
  name: string;
  domain?: string;
  github_url?: string;
  live_url?: string;
  start_date?: string | null;
  end_date?: string | null;
  description_points: string[];
  technologies?: string[];
}

export interface Education {
  id?: string;
  institution: string;
  degree: string;
  field: string;
  start_year?: number | null;
  end_year?: number | null;
  grade?: string;
}

export interface Certification {
  id?: string;
  name: string;
  issuer: string;
  date?: string | null;
  credential_url?: string;
}

export interface Achievement {
  id?: string;
  title: string;
  description: string;
  date?: string | null;
}

export interface MasterProfile {
  id?: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  portfolio: string;
  summary: string;
  other_info?: string;
  skills: Skill[];
  experiences: Experience[];
  projects: Project[];
  education: Education[];
  certifications: Certification[];
  achievements: Achievement[];
  created_at?: string;
  updated_at?: string;
}

export interface MasterProfileResponse {
  exists: boolean;
  profile: MasterProfile | null;
  message?: string;
}

export interface AtsBreakdown {
  overall_score: number;
  skill_score: number;
  skill_max: number;
  keyword_score: number;
  keyword_max: number;
  experience_score: number;
  experience_max: number;
  structure_score: number;
  structure_max: number;
  matched_keywords_count?: number;
  total_keywords_count?: number;
  recommendations: string[];
  disclaimer: string;
}

export interface TailoredResumeContent {
  target_role: string;
  target_company?: string;
  header: {
    name: string;
    title: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    github?: string;
    portfolio?: string;
  };
  summary: string;
  skills: {
    languages: string[];
    frameworks: string[];
    databases: string[];
    tools: string[];
    other: string[];
  };
  experiences: {
    role: string;
    company: string;
    employment_type: string;
    location?: string;
    start_date?: string | null;
    end_date?: string | null;
    bullets: string[];
  }[];
  projects: {
    name: string;
    domain?: string;
    github_url?: string;
    live_url?: string;
    technologies?: string[];
    bullets: string[];
  }[];
  education: {
    institution: string;
    degree: string;
    field: string;
    start_year?: number | null;
    end_year?: number | null;
    grade?: string;
  }[];
  certifications?: {
    name: string;
    issuer: string;
    date?: string | null;
    credential_url?: string;
  }[];
  achievements?: {
    title: string;
    description: string;
    date?: string | null;
  }[];
}

export interface TailoredResume {
  id: string;
  target_role: string;
  target_company: string;
  ats_score: number;
  matched_skills: string[];
  missing_skills: string[];
  ats_breakdown: AtsBreakdown;
  resume_content: TailoredResumeContent;
  pdf_url: string;
  created_at: string;
}

export interface GenerateResumePayload {
  job_description_text: string;
  target_role?: string;
  target_company?: string;
}

export interface SuggestionItem {
  id: string;
  type: 'skill' | 'keyword' | 'phrasing' | 'summary';
  category?: SkillCategory;
  title: string;
  content: string;
  reason: string;
  default_selected?: boolean;
}

export interface CompareResumeResponse {
  matching_skills: string[];
  matching_keywords: string[];
  suggestions: SuggestionItem[];
  job_analysis: any;
}

export interface UploadResumeResponse {
  message: string;
  parsed_resume: MasterProfile;
  raw_text_length: number;
}

export interface ApplyAndGeneratePayload {
  resume_content: Partial<MasterProfile> | any;
  job_description_text: string;
  approved_suggestions: SuggestionItem[];
  save_as_master_profile?: boolean;
  target_role?: string;
  target_company?: string;
  job_analysis?: any;
}
