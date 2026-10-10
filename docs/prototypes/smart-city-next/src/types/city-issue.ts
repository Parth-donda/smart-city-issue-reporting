export type IssueCategory =
  | 'Pothole'
  | 'Broken Streetlight'
  | 'Water Leak'
  | 'Trash Accumulation'
  | 'Traffic Signal'
  | 'Damaged Sidewalk'
  | 'Illegal Parking'
  | 'Tree Hazard';

export type IssueStatus = 'Open' | 'In Progress' | 'Resolved';

export type IssueSeverity = 'Low' | 'Medium' | 'High';

export interface TimelineUpdate {
  id: string;
  status: IssueStatus;
  timestamp: string;
  note: string;
  author: string;
}

export interface CityIssue {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  status: IssueStatus;
  severity: IssueSeverity;
  coordinates: {
    lat: number;
    lng: number;
  };
  address: string;
  upvotes: number;
  reporterName: string;
  dateSubmitted: string;
  imageUrl?: string;
  updatesTimeline: TimelineUpdate[];
}
