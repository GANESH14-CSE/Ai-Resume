import axios, { AxiosError } from 'axios';
import { HealthCheckResponse, AuthResponse } from '../types';

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

// Interceptor for standardized error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<any>) => {
    // Return structured error
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
  }
};
