import { AuthTokens, User } from '../types/auth';
import {
  Issue,
  IssueCategory,
  QueueSummary,
  DepartmentWorker,
  NotificationItem,
  IssuePriority,
  IssueRejectionReason
} from '../types/issues';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

class ApiService {
  private getTokens(): AuthTokens | null {
    const tokens = localStorage.getItem('smartcivic_tokens');
    return tokens ? JSON.parse(tokens) : null;
  }

  public getAccessToken(): string | null {
    const tokens = this.getTokens();
    return tokens?.access || null;
  }

  public setTokens(tokens: AuthTokens): void {
    localStorage.setItem('smartcivic_tokens', JSON.stringify(tokens));
  }

  public clearAuth(): void {
    localStorage.removeItem('smartcivic_tokens');
    localStorage.removeItem('smartcivic_user');
  }

  public setUser(user: User): void {
    localStorage.setItem('smartcivic_user', JSON.stringify(user));
  }

  public getUser(): User | null {
    const user = localStorage.getItem('smartcivic_user');
    return user ? JSON.parse(user) : null;
  }

  public async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const tokens = this.getTokens();

    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> || {}),
    };

    // Only set Content-Type to application/json if body is not FormData
    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    if (tokens?.access) {
      headers['Authorization'] = `Bearer ${tokens.access}`;
    }

    let response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle token expiration & automatic refresh
    if (response.status === 401 && tokens?.refresh) {
      try {
        const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh: tokens.refresh }),
        });

        if (refreshResponse.ok) {
          const newTokens: { access: string } = await refreshResponse.json();
          this.setTokens({
            access: newTokens.access,
            refresh: tokens.refresh,
          });

          // Retry initial request with renewed token
          headers['Authorization'] = `Bearer ${newTokens.access}`;
          response = await fetch(url, {
            ...options,
            headers,
          });
        } else {
          this.clearAuth();
          window.location.href = '/login';
          throw new Error('Session expired. Please log in again.');
        }
      } catch (err) {
        this.clearAuth();
        window.location.href = '/login';
        throw err;
      }
    }

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { detail: response.statusText };
      }
      throw errorData;
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  // --- Auth Endpoints ---
  public async login(credentials: { username: string; password: string }): Promise<{ access: string; refresh: string }> {
    const tokens = await this.request<{ access: string; refresh: string }>('/auth/login/', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    this.setTokens(tokens);
    return tokens;
  }

  public async register(data: any): Promise<{ user: User; tokens: AuthTokens }> {
    const res = await this.request<{ user: User; tokens: AuthTokens }>('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.setTokens(res.tokens);
    this.setUser(res.user);
    return res;
  }

  public async getMe(): Promise<User> {
    const user = await this.request<User>('/auth/me/');
    this.setUser(user);
    return user;
  }

  // --- Categories & Departments ---
  public async getCategories(): Promise<IssueCategory[]> {
    return this.request<IssueCategory[]>('/issues/categories/');
  }

  public async getDepartments(): Promise<any[]> {
    const res = await this.request<any>('/departments/');
    return Array.isArray(res) ? res : res.results || [];
  }

  // --- Issues Queue & Management ---
  public async getDepartmentSummary(): Promise<QueueSummary> {
    return this.request<QueueSummary>('/issues/summary/');
  }

  public async getIssues(params: {
    tab?: string;
    status?: string;
    priority?: string;
    category?: string | number;
    ward?: string;
    search?: string;
    ordering?: string;
    page?: number;
  } = {}): Promise<{ count: number; results: Issue[] } | Issue[]> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '' && val !== 'ALL') {
        query.append(key, String(val));
      }
    });
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return this.request(`/issues/${queryString}`);
  }

  public async getIssueDetail(lookup: string | number): Promise<Issue> {
    return this.request<Issue>(`/issues/${lookup}/`);
  }

  public async getPublicIssueTrack(issueId: string): Promise<any> {
    return this.request(`/issues/track/${issueId}/`);
  }

  public async createIssue(formData: FormData): Promise<Issue> {
    return this.request<Issue>('/issues/', {
      method: 'POST',
      body: formData,
    });
  }

  // --- Triage Actions ---
  public async startReview(lookup: string | number): Promise<Issue> {
    return this.request<Issue>(`/issues/${lookup}/start-review/`, {
      method: 'POST',
    });
  }

  public async acceptIssue(
    lookup: string | number,
    payload: { priority?: IssuePriority; remarks?: string } = {}
  ): Promise<Issue> {
    return this.request<Issue>(`/issues/${lookup}/accept/`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async rejectIssue(
    lookup: string | number,
    payload: {
      rejection_reason: IssueRejectionReason;
      rejection_notes?: string;
      target_department_id?: number;
    }
  ): Promise<Issue> {
    return this.request<Issue>(`/issues/${lookup}/reject/`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async assignWorker(
    lookup: string | number,
    payload: { worker_id: number; notes?: string }
  ): Promise<Issue> {
    return this.request<Issue>(`/issues/${lookup}/assign/`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async changePriority(
    lookup: string | number,
    payload: { priority: IssuePriority; remarks?: string }
  ): Promise<Issue> {
    return this.request<Issue>(`/issues/${lookup}/change-priority/`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async rerouteIssue(
    lookup: string | number,
    payload: { target_department_id: number; reason: string }
  ): Promise<Issue> {
    return this.request<Issue>(`/issues/${lookup}/reroute/`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async getDepartmentWorkers(deptId?: number): Promise<DepartmentWorker[]> {
    const endpoint = deptId ? `/departments/${deptId}/workers/` : '/departments/my-workers/';
    return this.request<DepartmentWorker[]>(endpoint);
  }

  // --- Worker Phase 5 Actions ---
  public async workerTransition(
    lookup: string | number,
    payload: { to_status: string; remarks?: string; latitude?: string | number; longitude?: string | number }
  ): Promise<Issue> {
    return this.request<Issue>(`/issues/${lookup}/worker-transition/`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async completeWork(lookup: string | number, formData: FormData): Promise<Issue> {
    return this.request<Issue>(`/issues/${lookup}/complete/`, {
      method: 'POST',
      body: formData,
    });
  }

  // --- Supervisor Phase 6 Verification ---
  public async supervisorVerify(
    lookup: string | number,
    payload: { action: 'APPROVE' | 'REJECT'; remarks?: string }
  ): Promise<Issue> {
    return this.request<Issue>(`/issues/${lookup}/verify/`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // --- Citizen Feedback & Reopen ---
  public async submitCitizenFeedback(
    lookup: string | number,
    payload: { is_satisfied: boolean; rating?: number; comment?: string }
  ): Promise<Issue> {
    return this.request<Issue>(`/issues/${lookup}/feedback/`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // --- Municipal Admin Phase 7 ---
  public async getAdminOverview(): Promise<any> {
    return this.request<any>('/issues/admin-overview/');
  }

  public async getAuditLogs(issueId?: string): Promise<any[]> {
    const query = issueId ? `?issue_id=${issueId}` : '';
    const res = await this.request<any>(`/audit/${query}`);
    return Array.isArray(res) ? res : res.results || [];
  }

  public async updateCategory(id: number, data: any): Promise<IssueCategory> {
    return this.request<IssueCategory>(`/issues/categories/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  public async getSlaConfigs(): Promise<any[]> {
    const res = await this.request<any>('/issues/sla-config/');
    return Array.isArray(res) ? res : res.results || [];
  }

  // --- Phase 9 Duplicates & Upvoting ---
  public async checkDuplicates(params: {
    latitude: number | string;
    longitude: number | string;
    category_id?: number | string;
  }): Promise<{ duplicates: any[] }> {
    const q = new URLSearchParams();
    q.set('latitude', String(params.latitude));
    q.set('longitude', String(params.longitude));
    if (params.category_id) q.set('category_id', String(params.category_id));
    return this.request<{ duplicates: any[] }>(`/issues/check-duplicates/?${q.toString()}`);
  }

  public async upvoteIssue(lookup: string | number): Promise<{ message: string; affected_citizens_count: number; issue: Issue }> {
    return this.request<{ message: string; affected_citizens_count: number; issue: Issue }>(`/issues/${lookup}/upvote/`, {
      method: 'POST',
    });
  }

  // --- Notifications ---
  public async getNotifications(): Promise<NotificationItem[]> {
    const res = await this.request<any>('/notifications/');
    return Array.isArray(res) ? res : res.results || [];
  }

  public async getUnreadNotificationCount(): Promise<{ unread_count: number }> {
    return this.request<{ unread_count: number }>('/notifications/unread-count/');
  }

  public async markNotificationRead(id: number): Promise<{ status: string; id: number }> {
    return this.request<{ status: string; id: number }>(`/notifications/${id}/mark-read/`, {
      method: 'POST',
    });
  }

  public async markAllNotificationsRead(): Promise<{ status: string; count: number }> {
    return this.request<{ status: string; count: number }>('/notifications/mark-all-read/', {
      method: 'POST',
    });
  }
}

export const api = new ApiService();
