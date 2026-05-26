import { supabase } from './supabase';
import { SAFE_PROFILE_COLUMNS, type Announcement, type Attendance, type AttendanceDate, type AttendanceWithStudent, type Content, type Profile } from './types';

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

export async function fetchStudents(limit = 300): Promise<Profile[]> {
  const client = requireClient();
  const { data, error } = await client
    .from('profiles')
    .select(SAFE_PROFILE_COLUMNS)
    .eq('role', 'student')
    .order('full_name', { ascending: true })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data as Profile[]) ?? [];
}

export async function fetchAdminAttendances(limit = 80): Promise<AttendanceWithStudent[]> {
  const client = requireClient();
  const { data, error } = await client
    .from('attendances')
    .select(
      `
      id,
      student_id,
      date,
      created_at,
      student:student_id (
        id,
        full_name,
        belt,
        degree
      )
    `
    )
    .order('date', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  const rows = (data ?? []).map((attendance) => ({
    ...attendance,
    student: Array.isArray(attendance.student) ? attendance.student[0] ?? null : attendance.student,
  }));

  return rows as unknown as AttendanceWithStudent[];
}

export async function fetchAttendanceDates(limit = 6000): Promise<AttendanceDate[]> {
  const client = requireClient();
  const { data, error } = await client
    .from('attendances')
    .select('student_id,date')
    .order('date', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data as AttendanceDate[]) ?? [];
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
