import { supabase } from './supabase';
import type { Announcement, Attendance, Content } from './types';

function requireClient() {
  if (!supabase) {
    throw new Error('Supabase nao esta configurado.');
  }

  return supabase;
}

export async function fetchStudentAttendances(studentId: string, limit = 50): Promise<Attendance[]> {
  const client = requireClient();
  const { data, error } = await client
    .from('attendances')
    .select('id,student_id,date,created_at')
    .eq('student_id', studentId)
    .order('date', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data as Attendance[]) ?? [];
}

export async function fetchAnnouncements(limit = 30): Promise<Announcement[]> {
  const client = requireClient();
  const { data, error } = await client
    .from('announcements')
    .select('id,title,message,created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data as Announcement[]) ?? [];
}

export async function fetchContents(): Promise<Content[]> {
  const client = requireClient();
  const { data, error } = await client
    .from('contents')
    .select('id,title,description,type,url,required_belt,required_degree,module_slug,category,created_at')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data as Content[]) ?? [];
}
