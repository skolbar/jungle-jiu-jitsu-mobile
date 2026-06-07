import { supabase } from './supabase';
import type { Announcement, Belt, CheckIn, CheckInStatus, Content, Profile, Role } from './types';

const DEFAULT_WEB_API_URL = 'https://v0-jiu-jitsu-mvp.vercel.app';

const webApiUrl = (process.env.EXPO_PUBLIC_WEB_API_URL ?? DEFAULT_WEB_API_URL).replace(/\/+$/, '');

type ApiRequestOptions = {
  body?: unknown;
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
};

type CreateUserPayload = {
  full_name: string;
  email: string;
  password: string;
  belt: Belt;
  degree: number;
  role?: Role;
};

type UpdateStudentPayload = {
  full_name?: string;
  belt?: Belt;
  degree?: number;
};

type CreateContentPayload = {
  title: string;
  description: string;
  type: string;
  url: string;
  required_belt: Belt;
  required_degree: number;
  module_slug: string;
  category: string;
};

async function getAccessToken() {
  if (!supabase) {
    throw new Error('Supabase nao esta configurado.');
  }

  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.access_token) {
    throw new Error('Sessao expirada. Entre novamente no app.');
  }

  return data.session.access_token;
}

async function parseError(response: Response) {
  const fallback = `Erro ${response.status}`;

  try {
    const payload = await response.json();
    if (payload?.error) return String(payload.error);
    if (payload?.message) return String(payload.message);
    return fallback;
  } catch {
    return fallback;
  }
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const token = await getAccessToken();
  const response = await fetch(`${webApiUrl}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  const text = await response.text();
  return (text ? JSON.parse(text) : null) as T;
}

export function createUser(payload: CreateUserPayload) {
  return apiRequest<{ ok: boolean; userId: string; message: string }>('/api/admin/create-user', {
    method: 'POST',
    body: { ...payload, role: payload.role ?? 'student' },
  });
}

export function updateStudent(studentId: string, payload: UpdateStudentPayload) {
  return apiRequest<Profile>(`/api/students/${studentId}`, {
    method: 'PATCH',
    body: payload,
  });
}

export function deleteStudent(studentId: string) {
  return apiRequest<{ success: boolean }>(`/api/students/${studentId}`, {
    method: 'DELETE',
  });
}

export function addStudentClasses(studentId: string, quantity: number) {
  return apiRequest<Profile>(`/api/students/${studentId}/add-classes`, {
    method: 'PATCH',
    body: { quantity },
  });
}

export function registerAttendance(studentId: string, date?: string) {
  return apiRequest<{ id: string }>(`/api/attendances`, {
    method: 'POST',
    body: { studentId, date },
  });
}

export function fetchCheckIns() {
  return apiRequest<CheckIn[]>('/api/check-ins');
}

export function decideCheckIn(id: string, status: Exclude<CheckInStatus, 'pending'>) {
  return apiRequest<CheckIn>('/api/check-ins', {
    method: 'PATCH',
    body: { id, status },
  });
}

export function decideAllCheckIns(status: Exclude<CheckInStatus, 'pending'>) {
  return apiRequest<{ updated: number }>('/api/check-ins/bulk', {
    method: 'PATCH',
    body: { status },
  });
}

export function createAnnouncement(title: string, message: string) {
  return apiRequest<Announcement>('/api/announcements', {
    method: 'POST',
    body: { title, message },
  });
}

export function createContent(payload: CreateContentPayload) {
  return apiRequest<Content>('/api/contents', {
    method: 'POST',
    body: payload,
  });
}

export function deleteContent(contentId: string) {
  return apiRequest<{ success: boolean }>(`/api/contents/${contentId}`, {
    method: 'DELETE',
  });
}

export function updateProfile(payload: { full_name?: string; avatar_url?: string | null }) {
  return apiRequest<Profile>('/api/profile', {
    method: 'PATCH',
    body: payload,
  });
}

export function updatePassword(newPassword: string) {
  return apiRequest<{ success: boolean }>('/api/profile/password', {
    method: 'PATCH',
    body: { newPassword },
  });
}

export function lockStudentBelt(belt: Belt, degree: number) {
  return apiRequest<Profile>('/api/profile/belt', {
    method: 'PATCH',
    body: { belt, degree },
  });
}
