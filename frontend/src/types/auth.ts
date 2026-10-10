export type UserRole =
  | 'CITIZEN'
  | 'DEPARTMENT_OFFICER'
  | 'WORKER'
  | 'SUPERVISOR'
  | 'MUNICIPAL_ADMIN'
  | 'SYSTEM_ADMIN';

export interface WorkerProfile {
  id: number;
  department: number;
  department_name: string;
  department_code: string;
  phone: string;
  skills: string;
  is_available: boolean;
  active_task_count: number;
  created_at: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  phone: string;
  avatar: string | null;
  is_verified: boolean;
  department?: number | null;
  department_name?: string | null;
  department_code?: string | null;
  worker_profile?: WorkerProfile | null;
  created_at: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
  message?: string;
}
