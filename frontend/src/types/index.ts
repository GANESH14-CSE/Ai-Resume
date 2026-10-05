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
