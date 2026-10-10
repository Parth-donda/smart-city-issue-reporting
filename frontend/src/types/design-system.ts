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

export type UserRole =
  | 'Citizen'
  | 'Department Officer'
  | 'Worker'
  | 'Department Supervisor'
  | 'Municipal Admin'
  | 'System Admin';

export type ConfidenceBand = 'HIGH' | 'MEDIUM' | 'MANUAL_REVIEW';

