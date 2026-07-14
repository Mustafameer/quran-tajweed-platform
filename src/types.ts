/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'admin' | 'teacher' | 'student';
export type UserStatus = 'pending' | 'approved' | 'rejected';

export interface User {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  role: UserRole;
  status: UserStatus;
  city?: string;
  gender?: string;
  age?: number;
  createdAt: string;
  avatar?: string;
  specialty?: string;
  loginDates?: string[];
  streakDays?: number;
  twoFactorEnabled?: boolean;
  twoFactorType?: 'app' | 'email' | 'sms';
  notificationPreferences?: {
    app: boolean;
    email: boolean;
    sms: boolean;
    liveSession?: { app: boolean; email: boolean; sms: boolean };
    evaluation?: { app: boolean; email: boolean; sms: boolean };
    newLesson?: { app: boolean; email: boolean; sms: boolean };
    weeklyReport?: { app: boolean; email: boolean; sms: boolean };
  };
  // password is omitted in client responses for safety
}

export interface Course {
  id: string;
  name: string;
  description: string;
  teacherId: string;
  teacherName?: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'inactive';
}

export interface Enrollment {
  id: string;
  studentId: string;
  studentName?: string;
  courseId: string;
  courseName?: string;
  enrollmentDate: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface Session {
  id: string;
  courseId: string;
  courseName?: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'live' | 'completed';
  reminderSent?: boolean;
}

export interface ActiveSessionState {
  sessionId: string;
  speakingStudentId: string | null; // who is permitted to read
  speakingStudentName: string | null;
  assignment: {
    surahNumber: number;
    surahName: string;
    startAyah: number;
    endAyah: number;
    page?: number;
  } | null;
  bookAssignment: {
    bookId: string;
    bookTitle: string;
    chapterTitle: string;
    pageNumber: number;
    content: string[]; // Poetry lines or text paragraphs
  } | null;
  webRTC?: {
    offer?: any;
    offerUserId?: string;
    answer?: any;
    answerUserId?: string;
    iceCandidates?: Array<{ candidate: any; userId: string }>;
  };
}

export interface Attendance {
  id: string;
  studentId: string;
  studentName?: string;
  sessionId: string;
  sessionTitle?: string;
  joinTime: string;
  leaveTime?: string;
  duration?: number; // in seconds
}

export interface Evaluation {
  id: string;
  studentId: string;
  studentName?: string;
  sessionId: string;
  sessionTitle?: string;
  readingAccuracy: number; // 1-100
  tajweedAccuracy: number; // 1-100
  fluency: number; // 1-100
  score: number; // average/calculated score
  notes: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  dateTime: string;
  ip: string;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  videoLink?: string;
  pdfFile?: string; // name or link
  teacherId: string;
  teacherName?: string;
  createdAt: string;
}

export interface QuranVerse {
  id?: string; // unique key in IndexedDB (e.g. surahNumber_ayahNumber)
  number?: number; // global ayah number in the Quran (1 to 6236)
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
  text: string;
}

export interface UserFeedback {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  type: 'bug' | 'feature' | 'other';
  subject: string;
  message: string;
  createdAt: string;
}

export interface PracticeClip {
  id: string;
  studentId: string;
  studentName: string;
  title: string;
  audioUrl: string; // Base64 data URI
  notes?: string;
  feedback?: string; // teacher's text evaluation
  teacherId?: string;
  teacherName?: string;
  status: 'pending' | 'reviewed';
  createdAt: string;
}

export interface WeeklyReport {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail?: string;
  teacherId: string;
  teacherName: string;
  weekStartDate: string;
  weekEndDate: string;
  memorizationScore: number; // Progress/Score in Memorization (0-100)
  revisionScore: number;     // Progress/Score in Revision (0-100)
  tajweedScore: number;      // Progress/Score in Tajweed (0-100)
  overallScore: number;      // Combined Level/Score
  notes: string;
  sentAt: string;
  emailStatus: 'sent' | 'simulated';
}

export interface BookPage {
  pageNumber: number;
  content: string[];
}

export interface BookChapter {
  id: string;
  title: string;
  pages: BookPage[];
}

export interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  chapters: BookChapter[];
}

