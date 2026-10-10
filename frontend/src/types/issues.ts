export type IssueStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'ASSIGNED'
  | 'ON_THE_WAY'
  | 'ARRIVED'
  | 'WORK_STARTED'
  | 'IN_PROGRESS'
  | 'DONE'
  | 'VERIFIED'
  | 'CLOSED'
  | 'REOPENED';

export type IssuePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type IssueRejectionReason =
  | 'INVALID_EVIDENCE'
  | 'DUPLICATE'
  | 'OUTSIDE_RESPONSIBILITY'
  | 'INSUFFICIENT_INFORMATION'
  | 'NOT_FOUND_AFTER_INSPECTION'
  | 'OTHER';

export interface CompletionEvidence {
  id?: number;
  after_image: string | null;
  before_image?: string | null;
  description: string;
  materials_used: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  completed_at: string;
}

export interface IssueCategory {
  id: number;
  name: string;
  code: string;
  description: string;
  default_department: {
    id: number;
    name: string;
    code: string;
  } | null;
  default_priority: IssuePriority;
  icon_name: string;
  is_active: boolean;
}

export interface IssueLocation {
  id: number;
  latitude: number | string;
  longitude: number | string;
  address_text: string;
  landmark?: string;
  ward?: string;
  captured_at: string;
}

export interface IssueImage {
  id: number;
  image: string;
  caption?: string;
  is_primary: boolean;
  capture_source: 'CAMERA' | 'GALLERY';
  uploaded_at: string;
}

export interface IssueVideo {
  id: number;
  video: string;
  duration_seconds: number;
  uploaded_at: string;
}

export interface IssueStatusHistoryItem {
  id: number;
  from_status: IssueStatus;
  to_status: IssueStatus;
  changed_by?: number;
  changed_by_name?: string;
  changed_by_role?: string;
  remarks: string;
  created_at: string;
}

export interface EvidenceVerification {
  id: number;
  overall_confidence_score: number;
  confidence_band: 'HIGH' | 'MEDIUM' | 'MANUAL_REVIEW';
  confidence_band_display: string;
  exif_metadata: Record<string, any>;
  location_consistency: string;
  timestamp_consistency: string;
  manipulation_indicators: {
    location_analysis?: { status: string; remarks: string };
    timestamp_analysis?: { status: string; remarks: string };
    duplicate_analysis?: { status: string; remarks: string };
    capture_source?: string;
    software_used?: string;
    flags?: string[];
  };
  file_hash_sha256: string;
  perceptual_hash: string;
  verified_at: string;
}

export interface Issue {
  id: number;
  issue_id: string;
  title: string;
  description: string;
  category: IssueCategory;
  department_name?: string;
  department_code?: string;
  department?: {
    id: number;
    name: string;
    code: string;
    description: string;
    contact_email?: string;
    contact_phone?: string;
  };
  priority: IssuePriority;
  priority_display: string;
  status: IssueStatus;
  status_display: string;
  citizen_name?: string;
  assigned_worker_name?: string;
  assigned_worker?: any;
  location?: IssueLocation;
  images_count?: number;
  primary_image?: IssueImage | null;
  images?: IssueImage[];
  videos?: IssueVideo[];
  completion_evidence?: CompletionEvidence | null;
  evidence_verification?: EvidenceVerification | null;
  status_history?: IssueStatusHistoryItem[];
  rejection_reason?: IssueRejectionReason;
  rejection_reason_display?: string;
  rejection_notes?: string;
  sla_deadline?: string | null;
  is_sla_breached?: boolean;
  time_remaining_seconds?: number | null;
  is_approaching_sla?: boolean;
  created_at: string;
  updated_at: string;
}

export interface QueueSummary {
  total: number;
  submitted: number;
  under_review: number;
  accepted: number;
  assigned: number;
  on_the_way: number;
  arrived: number;
  work_started: number;
  in_progress: number;
  done: number;
  verified: number;
  closed: number;
  rejected: number;
  reopened: number;
  sla_breached: number;
  sla_approaching: number;
  department_name?: string | null;
  department_code?: string | null;
}

export interface DepartmentWorker {
  id: number;
  worker_profile_id: number;
  name: string;
  username: string;
  phone: string;
  skills: string;
  is_available: boolean;
  active_task_count: number;
  department_id: number;
  department_name: string;
  department_code: string;
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  notification_type: 'STATUS_UPDATE' | 'WORKER_ASSIGNED' | 'SLA_WARNING' | 'VERIFICATION_REQUEST' | 'CLOSURE';
  link: string;
  is_read: boolean;
  created_at: string;
  time_ago: string;
}
