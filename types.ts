export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  CLUBS = 'CLUBS',
  ADMISSIONS = 'ADMISSIONS',
  // Teacher Specific
  MY_CLASSES = 'MY_CLASSES',
  GRADING = 'GRADING',
  // Admin Specific
  ACADEMICS = 'ACADEMICS'
}

export type UserRole = 'admin' | 'teacher' | 'student' | 'parent';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
}

export interface House {
  id: string;
  name: string;
  points: number;
  color: string;
  members: number;
}

export interface Club {
  id: string;
  name: string;
  category: string; // e.g., "Arts", "Science", "Sports"
  description: string;
  meeting_day: string;
  patron_name?: string;
  member_count?: number;
}

export interface ElectionCandidate {
  id: string;
  name: string;
  votes: number;
  houseId: string;
  avatar: string;
}

// Academic Types

export interface Subject {
  id: string;
  name: string;
  code: string;
}

export interface ClassLevel {
  id: string;
  name: string;
  level: number;
}

export interface Stream {
  id: string;
  name: string;
  class_id: string;
}

export interface TeacherAllocation {
  id: string;
  subject_name: string; // Joined from subjects
  stream_name: string;  // Joined from streams
  class_name: string;   // Joined from class_levels
  subject_code: string;
  teacher_name?: string; // Optional for Admin View
}

export interface Student {
  id: string;
  full_name: string;
  student_id_human: string;
}

export interface MarkEntry {
  student_id: string;
  score: number;
  id?: string; // mark id if exists
  assessment_type: string;
}