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

export const SAFE_PROFILE_COLUMNS =
  'id,email,full_name,role,belt,degree,total_classes,cycle_classes,avatar_url,belt_locked,created_at,updated_at';
