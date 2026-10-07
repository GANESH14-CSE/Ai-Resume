import axios, { AxiosError } from 'axios';
import {
  HealthCheckResponse,
  AuthResponse,
  MasterProfileResponse,
  MasterProfile,
  TailoredResume,
  GenerateResumePayload,
  UploadResumeResponse,
  CompareResumeResponse,
  ApplyAndGeneratePayload
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token && config.headers) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

// Standardized error handler
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<any>) => {
    if (error.response?.data?.error) {
      return Promise.reject(error.response.data.error);
    }
    return Promise.reject({
      code: 'NETWORK_ERROR',
      message: error.message || 'Unable to connect to the backend server.',
      details: {},
    });
  }
);

export const api = {
  getHealth: async (): Promise<HealthCheckResponse> => {
    const response = await apiClient.get<HealthCheckResponse>('/health/');
    return response.data;
  },
  login: async (username: string, password: string): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login/', { username, password });
    localStorage.setItem('auth_token', response.data.token);
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('auth_token');
  },
  getCurrentUser: async () => {
    const response = await apiClient.get('/auth/me/');
    return response.data;
  },

  // Master Profile (Single Source of Truth)
  getMasterProfile: async (): Promise<MasterProfileResponse> => {
    const response = await apiClient.get<MasterProfileResponse>('/profile/');
    return response.data;
  },
  saveMasterProfile: async (profile: Partial<MasterProfile>): Promise<MasterProfileResponse> => {
    const response = await apiClient.post<MasterProfileResponse>('/profile/', profile);
    return response.data;
  },
  resetMasterProfile: async (): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('/profile/reset/');
    return response.data;
  },
  extractProfileFromResume: async (file: File): Promise<MasterProfile> => {
    const formData = new FormData();
    formData.append('resume', file);
    const response = await apiClient.post<MasterProfile>('/profile/extract/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Tailored Resume Generation Pipeline
  generateResume: async (payload: GenerateResumePayload): Promise<TailoredResume> => {
    const response = await apiClient.post<TailoredResume>('/resumes/generate/', payload);
    return response.data;
  },
  getResume: async (id: string): Promise<TailoredResume> => {
    const response = await apiClient.get<TailoredResume>(`/resumes/${id}/`);
    return response.data;
  },
  getResumes: async (): Promise<TailoredResume[]> => {
    const response = await apiClient.get<TailoredResume[]>('/resumes/');
    return response.data;
  },
  getPdfDownloadUrl: (id: string): string => {
    return `${API_BASE_URL}/resumes/${id}/pdf/`;
  },

  // Custom Resume Creation & Interactive Customization Pipeline
  uploadAndParseResume: async (file?: File, rawText?: string): Promise<UploadResumeResponse> => {
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      const response = await apiClient.post<UploadResumeResponse>('/resumes/upload-parse/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    }
    const response = await apiClient.post<UploadResumeResponse>('/resumes/upload-parse/', { raw_text: rawText });
    return response.data;
  },

  analyzeAndCompareResume: async (resumeContent: any, jdText: string): Promise<CompareResumeResponse> => {
    const response = await apiClient.post<CompareResumeResponse>('/resumes/analyze-compare/', {
      resume_content: resumeContent,
      job_description_text: jdText,
    });
    return response.data;
  },

  applyAndGenerateResume: async (payload: ApplyAndGeneratePayload): Promise<TailoredResume> => {
    const response = await apiClient.post<TailoredResume>('/resumes/apply-and-generate/', payload);
    return response.data;
  },
  
  saveGoogleToken: async (code: string): Promise<void> => {
    await apiClient.post('/auth/google/', { code });
  },

  sendAutoApplication: async (payload: { email: string, role: string, company: string, image?: File, text?: string }): Promise<void> => {
    const formData = new FormData();
    formData.append('email', payload.email);
    formData.append('role', payload.role);
    formData.append('company', payload.company);
    if (payload.image) {
      formData.append('image', payload.image);
    }
    if (payload.text) {
      formData.append('text', payload.text);
    }
    await apiClient.post('/applications/send/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }
};

