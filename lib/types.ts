export type Belt = 'white' | 'blue' | 'purple' | 'brown' | 'black';
export type Role = 'admin' | 'student';

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: Role;
  belt: Belt;
  degree: number;
  total_classes: number;
  cycle_classes: number;
  avatar_url: string | null;
  belt_locked: boolean;
  created_at: string;
  updated_at: string;
}

export interface Attendance {
  id: string;
  student_id: string;
  date: string;
  created_at: string;
}

export interface AttendanceWithStudent extends Attendance {
  student: Pick<Profile, 'id' | 'full_name' | 'belt' | 'degree'> | null;
}

export interface AttendanceDate {
  student_id: string;
  date: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  created_at: string;
}

export interface Content {
  id: string;
  title: string;
  description: string | null;
  type: string;
  url: string | null;
  required_belt: Belt;
  required_degree: number;
  module_slug: string | null;
  category: string | null;
  created_at: string;
}

export const SAFE_PROFILE_COLUMNS =
  'id,email,full_name,role,belt,degree,total_classes,cycle_classes,avatar_url,belt_locked,created_at,updated_at';
