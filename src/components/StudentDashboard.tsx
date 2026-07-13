/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Calendar,
  GraduationCap,
  Sparkles,
  Play,
  ClipboardList,
  AlertCircle,
  FileDown,
  PlusCircle,
  Clock,
  ArrowLeft,
  Search,
  Bell,
  Award,
  User as UserIcon,
  Mic,
  Flame,
  Mail,
  TrendingUp,
  BarChart2,
  FileText
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { User, Course, Session, Lesson, Evaluation, Enrollment, Attendance, WeeklyReport } from '../types';
import BadgesComponent from './BadgesComponent';
import MiniQuizComponent from './MiniQuizComponent';
import ProfileEditor from './ProfileEditor';
import LearningRoadmap from './LearningRoadmap';
import MonthlyCalendar from './MonthlyCalendar';
import AudioPractice from './AudioPractice';
import AdvancedSearch from './AdvancedSearch';
import { useToast } from './Toast';
import { cacheLessons, getCachedLessons, cacheQuranVerses } from '../lib/indexedDbCache';
import { QURAN_DATABASE } from '../quranData';

interface StudentDashboardProps {
  currentUser: User;
  onLogout: () => void;
  onJoinClassroom: (sessionId: string) => void;
  isDark?: boolean;
  onUpdateUser: (user: User) => void;
}

export default function StudentDashboard({ currentUser, onLogout, onJoinClassroom, isDark = false, onUpdateUser }: StudentDashboardProps) {
  const { showToast } = useToast();
  
  // Offline Caching & Connection detection states
  const [offlineCachedAt, setOfflineCachedAt] = useState<string | null>(() => localStorage.getItem('offline_cached_at'));
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);
  const [cachedLessonsCount, setCachedLessonsCount] = useState<number>(() => {
    try {
      const stored = localStorage.getItem('offline_lessons');
      return stored ? JSON.parse(stored).length : 0;
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    // Check initial online status
    setIsOfflineMode(!navigator.onLine);

    const handleOnline = () => {
      setIsOfflineMode(false);
      showToast('تمت استعادة الاتصال بالإنترنت! جاري تحديث الدروس والمناهج تلقائياً...', 'success');
    };
    const handleOffline = async () => {
      setIsOfflineMode(true);
      showToast('تم فقد الاتصال بالإنترنت! تم الانتقال التلقائي لوضع التصفح المحلي المخزن مؤقتاً من IndexedDB.', 'warning');
      try {
        const cached = await getCachedLessons();
        if (cached && cached.length > 0) {
          setAllLessons(cached);
        }
      } catch (err) {
        console.error('Failed to load lessons from IndexedDB cache', err);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleCacheOffline = async () => {
    if (allLessons.length === 0) {
      showToast('لا توجد دروس حالياً لحفظها مؤقتاً.', 'warning');
      return;
    }
    setLoading(true);
    try {
      // 1. Cache lessons in IndexedDB
      await cacheLessons(allLessons);

      // 2. Cache Quran database in IndexedDB
      await cacheQuranVerses(QURAN_DATABASE);

      // Save metadata in localStorage
      localStorage.setItem('offline_lessons', JSON.stringify(allLessons));
      localStorage.setItem('offline_cached_at', new Date().toISOString());
      setOfflineCachedAt(new Date().toISOString());
      setCachedLessonsCount(allLessons.length);
      showToast('تم بنجاح تنزيل وحفظ المناهج والدروس ونصوص القرآن الكريم بالكامل في قاعدة بيانات المتصفح الآمنة IndexedDB لتصفحها دون اتصال! 📥', 'success');
    } catch (err) {
      console.error('Error saving to IndexedDB:', err);
      showToast('حدث خطأ أثناء التخزين المؤقت للبيانات في IndexedDB.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const [activeTab, setActiveTab] = useState<'my-sessions' | 'lessons' | 'my-grades' | 'enroll-new' | 'profile' | 'audio-practice' | 'weekly-reports' | 'advanced-search'>('my-sessions');
  
  // State from server
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [myEnrollments, setMyEnrollments] = useState<Enrollment[]>([]);
  const [allSessions, setAllSessions] = useState<Session[]>([]);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [myEvaluations, setMyEvaluations] = useState<Evaluation[]>([]);
  const [myAttendance, setMyAttendance] = useState<Attendance[]>([]);
  const [myWeeklyReports, setMyWeeklyReports] = useState<WeeklyReport[]>([]);
  
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Search & Category Filters state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Sessions Filtering States
  const [sessionFilter, setSessionFilter] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');

  // Interactive quiz active state (stores the lesson id of the active quiz)
  const [activeQuizLessonId, setActiveQuizLessonId] = useState<string | null>(null);

  // Live countdown timer and notification state
  const [tick, setTick] = useState(0);
  const [notifiedSessionIds, setNotifiedSessionIds] = useState<string[]>([]);
  const [notifPermission, setNotifPermission] = useState<string>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setNotifPermission(Notification.permission);
    }
  }, []);

  const requestNotifPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotifPermission(permission);
    }
  };

  // Helper to parse dates and calculate remaining seconds
  const getRemainingSeconds = (dateStr: string, timeStr: string): number => {
    try {
      // dateStr: "2026-06-25"
      // timeStr: "18:00"
      const [year, month, day] = dateStr.split('-').map(Number);
      const [hours, minutes] = timeStr.split(':').map(Number);
      
      const targetDate = new Date(year, month - 1, day, hours, minutes, 0);
      const now = new Date();
      
      const diffMs = targetDate.getTime() - now.getTime();
      return Math.max(0, Math.floor(diffMs / 1000));
    } catch (err) {
      return 0;
    }
  };

  // Helper to format remaining time in seconds to Arabic text
  const formatCountdown = (seconds: number): string => {
    if (seconds <= 0) return 'بدأت الحلقة أو على وشك البدء 🔴';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    const parts = [];
    if (hours > 0) parts.push(`${hours} ساعة`);
    if (minutes > 0 || hours > 0) parts.push(`${minutes} دقيقة`);
    parts.push(`${secs} ثانية`);
    
    return parts.join(' و ');
  };

  // Course categorization helper
  const getCourseCategory = (courseName: string): string => {
    const name = courseName.toLowerCase();
    if (name.includes('تجويد') || name.includes('مخارج') || name.includes('أحكام') || name.includes('القواعد')) {
      return 'تجويد';
    }
    if (name.includes('حفظ') || name.includes('تسميع') || name.includes('مراجعة') || name.includes('جزء')) {
      return 'حفظ';
    }
    return 'تلاوة';
  };

  // Tick timer every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Monitor upcoming sessions and trigger notifications
  useEffect(() => {
    if (allSessions.length === 0) return;

    allSessions.forEach((session) => {
      if (session.status !== 'scheduled') return;

      const secondsLeft = getRemainingSeconds(session.date, session.startTime);
      
      // If session is starting in less than 5 minutes (300 seconds) and more than 0 seconds
      if (secondsLeft > 0 && secondsLeft <= 300) {
        if (!notifiedSessionIds.includes(session.id)) {
          // Trigger browser notification
          if ('Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification(`تنبيه حلقة قرآنية: ${session.title}`, {
                body: `يا بني! حلقة "${session.title}" ستبدأ بعد قليل (خلال ${Math.ceil(secondsLeft / 60)} دقائق). انضم للغرفة فوراً للاستماع والقراءة.`,
                icon: '/favicon.ico',
              });
            } catch (e) {
              console.error('Notification error:', e);
            }
          }

          // In-app backup toast alert
          setMessage(`🔔 تنبيه مباشر: حلقة "${session.title}" ستبدأ خلال أقل من 5 دقائق!`);
          setTimeout(() => setMessage(''), 12000);

          setNotifiedSessionIds((prev) => [...prev, session.id]);
        }
      }
    });
  }, [tick, allSessions, notifiedSessionIds]);

  const fetchStudentData = async () => {
    setLoading(true);
    try {
      const [cRes, eRes, sRes, lRes, evRes, attRes, wrRes] = await Promise.all([
        fetch('/api/courses'),
        fetch('/api/enrollments'),
        fetch('/api/sessions'),
        fetch('/api/lessons'),
        fetch('/api/evaluations'),
        fetch('/api/attendance'),
        fetch('/api/weekly-reports')
      ]);

      const [cData, eData, sData, lData, evData, attData, wrData] = await Promise.all([
        cRes.json(),
        eRes.json(),
        sRes.json(),
        lRes.json(),
        evRes.json(),
        attRes.json(),
        wrRes.json()
      ]);

      setAllCourses(cData);
      
      // Filter enrollments belonging to current student
      const studentEnroll = eData.filter((e: Enrollment) => e.studentId === currentUser.id);
      setMyEnrollments(studentEnroll);

      // Extract course IDs of my approved courses
      const myApprovedCourseIds = studentEnroll
        .filter((e: Enrollment) => e.status === 'approved')
        .map((e: Enrollment) => e.courseId);

      // Filter sessions belonging to approved courses
      setAllSessions(sData.filter((s: Session) => myApprovedCourseIds.includes(s.courseId)));
      
      // Filter lessons belonging to approved courses (or all lessons for simplify)
      const approvedLessons = lData.filter((l: Lesson) => {
        const course = cData.find((c: Course) => c.teacherId === l.teacherId);
        return course ? myApprovedCourseIds.includes(course.id) : true;
      });
      setAllLessons(approvedLessons);

      setMyEvaluations(evData.filter((ev: Evaluation) => ev.studentId === currentUser.id));
      setMyAttendance(attData.filter((att: Attendance) => att.studentId === currentUser.id));
      setMyWeeklyReports(wrData.filter((wr: any) => wr.studentId === currentUser.id));
    } catch (err) {
      console.error('Error loading student dashboard data, trying local IndexedDB cache:', err);
      try {
        const cached = await getCachedLessons();
        if (cached && cached.length > 0) {
          setAllLessons(cached);
          showToast('تم تحميل الدروس والمناهج من التخزين المؤقت المحلي (IndexedDB).', 'info');
        }
      } catch (cacheErr) {
        console.error('Failed to load local IndexedDB cache:', cacheErr);
      }
    } finally {
      setLoading(false);
    }
  };

  const recordDailyActivity = async () => {
    try {
      const res = await fetch(`/api/users/${currentUser.id}/record-activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const updatedUser = await res.json();
        if (updatedUser && updatedUser.streakDays !== undefined) {
          onUpdateUser(updatedUser);
        }
      }
    } catch (err) {
      console.error('Error recording daily activity:', err);
    }
  };

  useEffect(() => {
    fetchStudentData();
    recordDailyActivity();
  }, []);

  const handleRequestEnroll = async (courseId: string) => {
    setError('');
    setMessage('');
    try {
      const res = await fetch('/api/enrollments/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: currentUser.id, courseId })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'خطأ أثناء تقديم الطلب');
      }

      showToast('📖 تم إرسال طلب التحاقك بالمقرر بنجاح! في انتظار موافقة الإدارة.', 'success');
      setMessage('تم إرسال طلب التحاقك بالمقرر بنجاح! بانتظار موافقة الإدارة.');
      fetchStudentData();
      setTimeout(() => setMessage(''), 4000);
    } catch (err: any) {
      showToast(err.message || 'خطأ أثناء التقديم', 'error');
      setError(err.message);
      setTimeout(() => setError(''), 4000);
    }
  };

  // Calculations for Visual Progress Section
  const totalAttended = myAttendance.length;
  const averageScore = myEvaluations.length > 0 
    ? Math.round(myEvaluations.reduce((acc, curr) => acc + curr.score, 0) / myEvaluations.length) 
    : 0;
  const coursesInProgress = myEnrollments.filter(e => e.status === 'approved').length;

  const statsData = [
    { name: 'الجلسات المحضورة', value: totalAttended, fill: '#10B981' }, // Emerald
    { name: 'معدل التقييم (%)', value: averageScore, fill: '#6366F1' }, // Indigo
    { name: 'مقرراتي الجارية', value: coursesInProgress, fill: '#14B8A6' } // Teal
  ];

  return (
    <div className={`min-h-screen text-right font-sans transition-colors duration-300 ${isDark ? 'bg-[#0B0F19] text-slate-100' : 'bg-slate-50 text-slate-800'}`} dir="rtl" id="student-dashboard-container">
      {/* Top Banner */}
      <div className={`pb-24 pt-8 px-6 border-b transition-colors duration-300 ${isDark ? 'bg-[#121826] border-slate-850 text-slate-100 shadow-sm' : 'bg-white border-slate-100 text-slate-800 shadow-sm'}`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`text-xs px-3 py-1 rounded-full font-bold border ${isDark ? 'bg-emerald-950/45 text-emerald-400 border-emerald-800/60' : 'bg-emerald-50 border-emerald-100 text-emerald-800'}`}>بوابة الطالب المقبول</span>
              <span className="text-xs px-3 py-1 rounded-full font-bold border bg-amber-500/10 text-amber-500 border-amber-500/20 flex items-center gap-1">
                <Flame className="h-3.5 w-3.5 text-amber-500 fill-current animate-bounce" />
                <span>سلسلة الحفظ والمذاكرة: {currentUser.streakDays || 1} {((currentUser.streakDays || 1) >= 3 && (currentUser.streakDays || 1) <= 10) ? 'أيام' : 'يوم'} متتالية!</span>
              </span>
            </div>
            <h1 className="text-3xl font-extrabold mt-1">{currentUser.fullName}</h1>
            <p className={`text-sm mt-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>مرحباً بك مجدداً في حلقتك القرآنية المباركة. استمر في الحفظ والتقدم</p>
          </div>
          <button
            id="student-logout-btn"
            onClick={onLogout}
            className={`font-medium px-5 py-2.5 rounded-xl border transition-all cursor-pointer text-sm shadow-sm ${
              isDark 
                ? 'bg-[#1E293B] border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white' 
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            تسجيل الخروج
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-6 -mt-16 pb-12">
        {/* Quick info boxes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className={`p-5 rounded-2xl border flex items-center justify-between hover:shadow-md transition-shadow ${isDark ? 'bg-[#121826] border-slate-850' : 'bg-white border-slate-100 shadow-sm'}`}>
            <div>
              <p className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>مقرراتي المعتمدة</p>
              <h3 className="text-2xl font-bold mt-1 font-mono">{coursesInProgress}</h3>
            </div>
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center font-bold border shadow-sm ${isDark ? 'bg-emerald-950/40 border-emerald-900 text-emerald-400' : 'bg-emerald-50 border-emerald-100/50 text-emerald-600'}`}>
              <BookOpen className="h-5 w-5" />
            </div>
          </div>

          <div className={`p-5 rounded-2xl border flex items-center justify-between hover:shadow-md transition-shadow ${isDark ? 'bg-[#121826] border-slate-850' : 'bg-white border-slate-100 shadow-sm'}`}>
            <div>
              <p className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>تقييماتي الصادرة</p>
              <h3 className="text-2xl font-bold mt-1 font-mono">{myEvaluations.length}</h3>
            </div>
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center font-bold border shadow-sm ${isDark ? 'bg-indigo-950/40 border-indigo-900 text-indigo-400' : 'bg-indigo-50 border-indigo-100/50 text-indigo-600'}`}>
              <GraduationCap className="h-5 w-5" />
            </div>
          </div>

          <div className={`p-5 rounded-2xl border flex items-center justify-between hover:shadow-md transition-shadow ${isDark ? 'bg-[#121826] border-slate-850' : 'bg-white border-slate-100 shadow-sm'}`}>
            <div>
              <p className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>ساعات الحضور الكلية</p>
              <h3 className="text-2xl font-bold mt-1 font-mono">
                {Math.round(myAttendance.reduce((acc, curr) => acc + (curr.duration || 0), 0) / 60)} دقيقة
              </h3>
            </div>
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center font-bold border shadow-sm ${isDark ? 'bg-teal-950/40 border-teal-900 text-teal-400' : 'bg-teal-50 border-teal-100/50 text-teal-600'}`}>
              <Clock className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Visual Progress Summary Card with Recharts Chart */}
        <div className={`p-6 rounded-3xl border mb-8 transition-all duration-300 ${
          isDark 
            ? 'bg-[#121826] border-slate-850 shadow-lg shadow-slate-950/20' 
            : 'bg-white border-slate-100 shadow-sm'
        }`}>
          <div className="flex items-center gap-2 mb-6">
            <span className="text-xl">📊</span>
            <div>
              <h2 className="text-lg font-bold font-sans">ملخص الأداء والتقدم الدراسي البياني</h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>مؤشرات التحصيل وحضور الحلقات القرآنية المباشرة بالتفصيل</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Stats Breakdown Panel */}
            <div className="lg:col-span-4 space-y-4">
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#172033]/60 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>مجموع الجلسات المحضورة</span>
                  <span className="text-emerald-500 font-bold text-xs bg-emerald-500/10 px-2 py-0.5 rounded-full">الجلسات</span>
                </div>
                <h3 className="text-xl font-bold font-mono">{totalAttended} حلقة</h3>
                <p className={`text-[10px] mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>تم رصد حضورك تلقائياً أثناء انضمامك للغرف الصوتية المباشرة</p>
              </div>

              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#172033]/60 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>معدل التقييم الصادر من الشيوخ</span>
                  <span className="text-indigo-500 font-bold text-xs bg-indigo-500/10 px-2 py-0.5 rounded-full">المعدل</span>
                </div>
                <h3 className="text-xl font-bold font-mono">{averageScore}%</h3>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-indigo-600 h-full rounded-full transition-all duration-500" style={{ width: `${averageScore}%` }} />
                </div>
              </div>

              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#172033]/60 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>مقررات جارية تدرسها حالياً</span>
                  <span className="text-teal-500 font-bold text-xs bg-teal-500/10 px-2 py-0.5 rounded-full">المناهج</span>
                </div>
                <h3 className="text-xl font-bold font-mono">{coursesInProgress} مقررات معتمدة</h3>
                <p className={`text-[10px] mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>دورات معتمدة تتابع تلاوتها وتصحح مخارج حروفها حياً</p>
              </div>
            </div>

            {/* Recharts Chart Container */}
            <div className="lg:col-span-8">
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900/40 border-slate-850' : 'bg-slate-50/50 border-slate-100'}`}>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={statsData}
                      margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1E293B' : '#E2E8F0'} />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontFamily: 'Cairo' }}
                        axisLine={{ stroke: isDark ? '#334155' : '#CBD5E1' }}
                      />
                      <YAxis 
                        tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontFamily: 'monospace' }}
                        axisLine={{ stroke: isDark ? '#334155' : '#CBD5E1' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                          borderColor: isDark ? '#334155' : '#E2E8F0',
                          color: isDark ? '#F1F5F9' : '#0F172A',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontFamily: 'Cairo',
                          textAlign: 'right'
                        }}
                        itemStyle={{ color: isDark ? '#38BDF8' : '#4F46E5' }}
                        labelStyle={{ fontWeight: 'bold' }}
                      />
                      <Bar dataKey="value" radius={[10, 10, 0, 0]} maxBarSize={55} animationDuration={800}>
                        {statsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 🏅 Badges and Achievements Section */}
        <div className="mb-8">
          <BadgesComponent
            totalAttended={totalAttended}
            averageScore={averageScore}
            coursesInProgress={coursesInProgress}
            myEvaluations={myEvaluations}
            isDark={isDark}
          />
        </div>

        {/* 🔔 Browser Notification Permission Request Banner */}
        {notifPermission === 'default' && (
          <div className={`mb-8 p-4 rounded-2xl border flex flex-col sm:flex-row justify-between items-center gap-3 ${
            isDark ? 'bg-indigo-950/25 border-indigo-900/40' : 'bg-indigo-50/50 border-indigo-100/40'
          }`}>
            <div className="flex items-center gap-2.5 text-right w-full sm:w-auto">
              <span className="text-xl">🔔</span>
              <div>
                <h4 className={`text-xs font-bold ${isDark ? 'text-indigo-300' : 'text-indigo-850'}`}>
                  تفعيل تنبيهات المتصفح للحلقات المباشرة
                </h4>
                <p className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-550'}`}>
                  فعّل التنبيهات لنقوم بتنبيهك تلقائياً قبل بدء حصتك القرآنية بـ 5 دقائق حتى لا يفوتك البث المباشر.
                </p>
              </div>
            </div>
            <button
              onClick={requestNotifPermission}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold px-4 py-2 rounded-xl cursor-pointer transition-all shrink-0 w-full sm:w-auto"
            >
              تفعيل التنبيهات الآن 🔔
            </button>
          </div>
        )}

        {message && (
          <div id="student-toast-msg" className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-4 rounded-xl mb-6 shadow-sm text-sm">
            {message}
          </div>
        )}

        {error && (
          <div id="student-toast-err" className="bg-rose-50 border border-rose-100 text-rose-700 p-4 rounded-xl mb-6 shadow-sm text-sm">
            {error}
          </div>
        )}

        {/* Tab Selection */}
        <div className={`flex border mb-6 p-2 rounded-2xl shadow-sm gap-2 overflow-x-auto transition-colors ${isDark ? 'bg-[#121826] border-slate-850' : 'bg-white border-slate-100'}`}>
          <button
            id="tab-student-sessions"
            onClick={() => setActiveTab('my-sessions')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'my-sessions'
                ? 'bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-100/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span>حلقاتي وجدولي المباشر</span>
          </button>

          <button
            id="tab-student-lessons"
            onClick={() => setActiveTab('lessons')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'lessons'
                ? 'bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-100'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <ClipboardList className="h-4 w-4" />
            <span>دروس التجويد والمرفقات</span>
          </button>

          <button
            id="tab-student-grades"
            onClick={() => setActiveTab('my-grades')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'my-grades'
                ? 'bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-100'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <GraduationCap className="h-4 w-4" />
            <span>سجل درجاتي وملاحظات الشيخ</span>
          </button>

          <button
            id="tab-student-audio"
            onClick={() => setActiveTab('audio-practice')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'audio-practice'
                ? 'bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-100'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <Mic className="h-4 w-4" />
            <span>🎤 مقرأة التسجيل والتدريب</span>
          </button>

          <button
            id="tab-student-enroll"
            onClick={() => setActiveTab('enroll-new')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'enroll-new'
                ? 'bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-100'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <PlusCircle className="h-4 w-4" />
            <span>الالتحاق بدورة جديدة</span>
          </button>

          <button
            id="tab-student-reports"
            onClick={() => setActiveTab('weekly-reports')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'weekly-reports'
                ? 'bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-100'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            <span>التقارير الأسبوعية والتقدم 📊📩</span>
          </button>

          <button
            id="tab-student-search"
            onClick={() => setActiveTab('advanced-search')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'advanced-search'
                ? 'bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-100'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <Search className="h-4 w-4" />
            <span>البحث القرآني المتقدم 🔍</span>
          </button>

          <button
            id="tab-student-profile"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-100'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <UserIcon className="h-4 w-4" />
            <span>تعديل الملف الشخصي</span>
          </button>
        </div>

        {/* Tab Panels */}
        {activeTab === 'my-sessions' && (
          <div className={`rounded-2xl border shadow-sm p-6 transition-colors ${isDark ? 'bg-[#121826] border-slate-850' : 'bg-white border-slate-100'}`} id="student-sessions-panel">
            {/* Instructions Banner */}
            <div className={`mb-6 p-4 rounded-2xl border ${
              isDark ? 'bg-emerald-950/20 border-emerald-900/40' : 'bg-emerald-50/45 border-emerald-100/60'
            }`}>
              <div className="flex items-start gap-3">
                <span className="text-2xl">📖</span>
                <div className="flex-1">
                  <h3 className={`text-sm font-bold ${isDark ? 'text-emerald-300' : 'text-emerald-800'} mb-1`}>
                    كيف تدخل البث المباشر؟
                  </h3>
                  <ul className={`text-xs space-y-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    <li>1. انتظر حتى تبدأ الحصة وتبدأ الحالة "مباشر 🔴"</li>
                    <li>2. اضغط على زر "انضم للدرس واستمع الآن 🎧" الأخضر</li>
                    <li>3. يمكنك الدخول مبكراً قبل 30 دقيقة من بدء الحصة</li>
                    <li>4. تأكد من السماح باستخدام الميكروفون عند الطلب</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <MonthlyCalendar 
                sessions={allSessions} 
                isDark={isDark} 
                onAction={(sessId) => onJoinClassroom(sessId)} 
                actionLabel="انضمام للحلقة"
              />
            </div>

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
              <h2 className={`text-lg font-bold font-sans ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>قائمة الحصص القرآنية المجدولة والنشطة</h2>
              
              {/* Session Filters */}
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <select
                  value={sessionFilter}
                  onChange={(e) => setSessionFilter(e.target.value as any)}
                  className={`px-3 py-2 text-sm rounded-lg border outline-none cursor-pointer flex-1 md:flex-none ${
                    isDark 
                      ? 'bg-slate-800 border-slate-700 text-slate-200 focus:border-emerald-500' 
                      : 'bg-white border-slate-200 text-slate-700 focus:border-emerald-500'
                  }`}
                >
                  <option value="all">عرض الكل</option>
                  <option value="today">اليوم</option>
                  <option value="week">هذا الأسبوع</option>
                  <option value="month">هذا الشهر</option>
                  <option value="custom">مخصص</option>
                </select>

                {sessionFilter === 'custom' && (
                  <div className="flex items-center gap-2 flex-1 md:flex-none">
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className={`px-2 py-2 text-sm rounded-lg border outline-none ${
                        isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    />
                    <span className="text-slate-400">-</span>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className={`px-2 py-2 text-sm rounded-lg border outline-none ${
                        isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    />
                  </div>
                )}
              </div>
            </div>

            {(() => {
              const filteredSessions = allSessions.filter(session => {
                if (sessionFilter === 'all') return true;
                
                const sessionDate = new Date(session.date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                if (sessionFilter === 'today') {
                  return session.date === today.toISOString().split('T')[0];
                }
                
                if (sessionFilter === 'week') {
                  const weekAgo = new Date(today);
                  weekAgo.setDate(today.getDate() - 7);
                  const weekNext = new Date(today);
                  weekNext.setDate(today.getDate() + 7);
                  return sessionDate >= weekAgo && sessionDate <= weekNext;
                }
                
                if (sessionFilter === 'month') {
                  const monthAgo = new Date(today);
                  monthAgo.setMonth(today.getMonth() - 1);
                  const monthNext = new Date(today);
                  monthNext.setMonth(today.getMonth() + 1);
                  return sessionDate >= monthAgo && sessionDate <= monthNext;
                }
                
                if (sessionFilter === 'custom') {
                  if (!customStartDate || !customEndDate) return true;
                  const start = new Date(customStartDate);
                  const end = new Date(customEndDate);
                  end.setHours(23, 59, 59, 999);
                  return sessionDate >= start && sessionDate <= end;
                }
                
                return true;
              });

              return filteredSessions.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-sm">
                  <AlertCircle className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                  <p>لا توجد حصص مجدولة حالياً لمقرراتك المعتمدة أو حسب التصفية المحددة.</p>
                  <button
                    onClick={() => setActiveTab('enroll-new')}
                    className="mt-3 text-emerald-700 font-bold hover:underline"
                  >
                    التحق ببعض المناهج التعليمية أولاً من هنا
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredSessions.map(session => {
                  const secondsLeft = getRemainingSeconds(session.date, session.startTime);
                  const isSoon = secondsLeft > 0 && secondsLeft <= 1800; // less than 30 mins
                  
                  return (
                    <div key={session.id} className={`p-5 border rounded-2xl transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                      session.status === 'live'
                        ? isDark ? 'bg-emerald-950/20 border-emerald-500' : 'bg-emerald-50/45 border-emerald-200 shadow-sm'
                        : isSoon
                          ? isDark ? 'bg-amber-950/20 border-amber-800/80' : 'bg-amber-50/45 border-amber-250 shadow-sm'
                          : isDark ? 'bg-[#172033] border-slate-800 hover:border-emerald-500' : 'bg-white border-slate-100 hover:border-emerald-200'
                    }`}>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {session.status === 'live' ? (
                            <span className="bg-rose-950/40 text-rose-400 border border-rose-900/60 text-xs font-bold px-2.5 py-0.5 rounded-full animate-pulse">
                              الحصة قائمة الآن 🔴
                            </span>
                          ) : isSoon ? (
                            <span className="bg-amber-950/40 text-amber-400 border border-amber-900/60 text-xs font-bold px-2.5 py-0.5 rounded-full animate-pulse">
                              تبدأ قريباً جداً ⏱️
                            </span>
                          ) : (
                            <span className={`text-xs px-2.5 py-0.5 rounded-full ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                              مجدولة
                            </span>
                          )}
                          <span className={`text-xs font-bold ${isDark ? 'text-indigo-400' : 'text-indigo-700'}`}>{session.courseName}</span>
                        </div>
                        <h3 className={`text-base font-extrabold mt-2 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{session.title}</h3>
                        <p className={`text-xs mt-1.5 flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          <Clock className="h-3.5 w-3.5" />
                          <span>التاريخ: {session.date} | الوقت: {session.startTime} - {session.endTime}</span>
                        </p>

                        {/* Live Countdown Badge */}
                        {session.status === 'scheduled' && secondsLeft > 0 && (
                          <div className={`mt-3 px-3 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold w-fit ${
                            isSoon
                              ? 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                              : isDark ? 'bg-slate-800/40 border-slate-700 text-emerald-400' : 'bg-slate-50 border-slate-200 text-emerald-750'
                          }`}>
                            <span className="animate-spin text-xs">⏳</span>
                            <span>يبدأ البث بعد:</span>
                            <span className="font-mono text-xs tracking-wider">{formatCountdown(secondsLeft)}</span>
                          </div>
                        )}
                      </div>

                      <div>
                        {session.status === 'live' ? (
                          <button
                            id={`join-live-btn-${session.id}`}
                            onClick={() => onJoinClassroom(session.id)}
                            className="bg-emerald-700 hover:bg-emerald-600 text-white font-bold px-5 py-2.5 rounded-xl shadow-md cursor-pointer text-sm flex items-center gap-1.5 transition-all"
                          >
                            <Play className="h-4 w-4" />
                            <span>انضم للدرس واستمع الآن 🎧</span>
                          </button>
                        ) : isSoon ? (
                          <div className="flex flex-col items-end gap-1.5">
                            <span className="text-amber-500 text-[10px] font-bold animate-pulse">تجهّز للدخول للغرفة الصوتية</span>
                            <button
                              id={`join-live-btn-${session.id}`}
                              onClick={() => onJoinClassroom(session.id)}
                              className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-4 py-2 rounded-xl shadow-md cursor-pointer text-xs flex items-center gap-1 transition-all"
                            >
                              <Play className="h-3.5 w-3.5" />
                              <span>دخول مبكر 🎧</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs font-bold">بانتظار بدء المعلم للدرس</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              );
            })()}
          </div>
        )}

        {activeTab === 'lessons' && (
          <div className={`rounded-2xl border shadow-sm p-6 transition-colors ${isDark ? 'bg-[#121826] border-slate-850' : 'bg-white border-slate-100'}`} id="student-lessons-panel">
            {/* Interactive Learning Roadmap */}
            <div className="mb-8">
              <LearningRoadmap isDark={isDark} />
            </div>

            {/* Offline Cache & Connection Controller */}
            <div className={`mb-6 p-4 rounded-2xl border ${
              isOfflineMode 
                ? 'bg-amber-500/10 border-amber-500/20' 
                : isDark ? 'bg-emerald-950/20 border-emerald-900/40' : 'bg-emerald-50/45 border-emerald-100/60'
            }`}>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-block h-2 w-2 rounded-full ${isOfflineMode ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                    <h3 className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      {isOfflineMode ? 'أنت تتصفح حالياً دون اتصال بالإنترنت (الوضع المحلي) 📶' : 'متصل بالإنترنت - المناهج محدثة بالكامل 🟢'}
                    </h3>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                    تمت تهيئة المنصة لحفظ المناهج ودروس التجويد محلياً للتمكن من مراجعتها ودراستها من أي مكان وفي أي وقت دون الحاجة لاتصال دائم.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCacheOffline}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-550 text-white rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-500/10"
                    title="تنزيل وتحديث المحتوى في الذاكرة المؤقتة"
                  >
                    <span>📥 تنزيل المناهج محلياً</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsOfflineMode(!isOfflineMode);
                      showToast(!isOfflineMode ? 'تم تفعيل وضع عدم الاتصال التجريبي (المحاكي)' : 'تم العودة للوضع المتصل بالإنترنت', 'info');
                    }}
                    className={`px-3 py-2 rounded-xl text-[10px] font-bold transition-all border cursor-pointer ${
                      isOfflineMode 
                        ? 'bg-amber-600 border-amber-500 text-white' 
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {isOfflineMode ? '🔌 العودة للوضع المتصل' : '🔌 محاكاة وضع أوفلاين'}
                  </button>
                </div>
              </div>

              {/* Cache status info footer */}
              <div className="mt-3 pt-2.5 border-t border-slate-150 dark:border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
                <span>آخر مزامنة للتخزين المؤقت: <strong>{offlineCachedAt ? new Date(offlineCachedAt).toLocaleString('ar-SA') : 'لم يتم التنزيل بعد'}</strong></span>
                <span>الدروس المخزنة محلياً: <strong>{cachedLessonsCount} دروس</strong></span>
              </div>
            </div>

            <h2 className={`text-lg font-bold mb-4 font-sans ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>مواد وكتيبات التجويد المرفوعة من شيوخك</h2>
            {(() => {
              const displayedLessons = isOfflineMode 
                ? (() => {
                    try {
                      const stored = localStorage.getItem('offline_lessons');
                      return stored ? JSON.parse(stored) : [];
                    } catch {
                      return [];
                    }
                  })()
                : allLessons;

              return displayedLessons.length === 0 ? (
                <p className="text-slate-400 text-sm py-4">
                  {isOfflineMode 
                    ? 'لا توجد دروس مخزنة مؤقتاً في هذا المتصفح حالياً. يرجى الاتصال بالإنترنت وتنزيل المناهج.' 
                    : 'لم يرفع معلموك أي دروس للمنهج حتى الآن.'}
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {displayedLessons.map(lesson => (
                    <div key={lesson.id} className={`p-4 border rounded-xl transition-all flex flex-col justify-between ${isDark ? 'bg-[#172033] border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                      <div>
                        <div className="flex justify-between items-center">
                          <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${isDark ? 'bg-indigo-950/60 text-indigo-400 border border-indigo-900/40' : 'bg-indigo-100 text-indigo-800'}`}>درس تجويد معتمد</span>
                          <span className="text-[10px] text-slate-400">{new Date(lesson.createdAt).toLocaleDateString('ar-SA')}</span>
                        </div>
                        <h4 className={`font-extrabold text-sm mt-2 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{lesson.title}</h4>
                        <p className={`text-xs mt-1 line-clamp-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{lesson.description}</p>
                      </div>

                      <div className={`mt-4 pt-3 border-t flex justify-between items-center flex-wrap gap-2 ${isDark ? 'border-slate-800' : 'border-slate-200/60'}`}>
                        <a
                          href="#"
                          onClick={(e) => { e.preventDefault(); alert(`[محاكاة التحميل] تم تحميل كتيب التجويد المرفق: ${lesson.pdfFile}`); }}
                          className={`text-xs font-bold flex items-center gap-1 ${isDark ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-800 hover:underline'}`}
                        >
                          <FileDown className="h-3.5 w-3.5" />
                          <span>تحميل كتيب {lesson.pdfFile}</span>
                        </a>
                        
                        <div className="flex gap-3 flex-wrap">
                          {lesson.videoLink && (
                            <a
                              href={lesson.videoLink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-rose-500 hover:underline font-bold flex items-center gap-1"
                            >
                              <span>🎥 مشاهدة الشرح</span>
                            </a>
                          )}
                          
                          <button
                            onClick={() => setActiveQuizLessonId(activeQuizLessonId === lesson.id ? null : lesson.id)}
                            className={`text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                              activeQuizLessonId === lesson.id
                                ? 'text-rose-500 hover:text-rose-600'
                                : isDark ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-650 hover:text-indigo-800'
                            }`}
                          >
                            <span>📝 {activeQuizLessonId === lesson.id ? 'إخفاء الاختبار' : 'اختبر معلوماتك ⚡'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Inline Mini-Quiz Panel */}
                      {activeQuizLessonId === lesson.id && (
                        <div className="mt-4 border-t border-dashed border-slate-200 dark:border-slate-800/80 pt-2">
                          <MiniQuizComponent lesson={lesson} isDark={isDark} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {activeTab === 'my-grades' && (
          <div className={`rounded-2xl border shadow-sm p-6 transition-colors ${isDark ? 'bg-[#121826] border-slate-850' : 'bg-white border-slate-100'}`} id="student-grades-panel">
            <h2 className={`text-lg font-bold mb-4 font-sans ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>تاريخ تقييماتي وتحصيلي القرآني</h2>
            {myEvaluations.length === 0 ? (
              <p className="text-slate-400 text-sm py-4">لا توجد تقييمات مرصودة لك من قبل المعلم حتى الآن. استمر بالقراءة والتصحيح في البث المباشر.</p>
            ) : (
              <div className="space-y-4">
                {myEvaluations.map(grade => (
                  <div key={grade.id} className={`p-4 border rounded-xl ${isDark ? 'bg-[#172033] border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <div>
                        <h4 className={`font-extrabold text-sm flex items-center gap-1 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                          <Sparkles className="h-4 w-4 text-emerald-500" />
                          <span>الحصة: {grade.sessionTitle}</span>
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-1 font-mono">رصد بتاريخ: {new Date(grade.createdAt).toLocaleDateString('ar-SA')}</p>
                      </div>
                      <div className="bg-emerald-850 text-white font-mono text-sm px-3 py-1 rounded-xl font-bold shadow-sm">
                        الدرجة الإجمالية: {grade.score}%
                      </div>
                    </div>
                    
                    {/* Specific breakdown */}
                    <div className={`mt-3 grid grid-cols-3 gap-2 text-[10px] font-bold p-2 rounded-lg border ${isDark ? 'bg-slate-900/40 border-slate-800 text-slate-300' : 'bg-white border-slate-100 text-slate-600'}`}>
                      <div>مخارج الحروف: {grade.readingAccuracy}%</div>
                      <div>أحكام التجويد: {grade.tajweedAccuracy}%</div>
                      <div>طلاقة القراءة: {grade.fluency}%</div>
                    </div>

                    {grade.notes && (
                      <p className={`text-xs mt-3 p-2.5 rounded-lg border leading-relaxed ${isDark ? 'bg-emerald-950/25 border-emerald-900/40 text-slate-300' : 'bg-emerald-50/40 border-emerald-100/40 text-slate-600'}`}>
                        <strong>ملاحظات وتوجيهات الشيخ المعلم: </strong>
                        <span>{grade.notes}</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'enroll-new' && (() => {
          const filteredCourses = allCourses.filter(course => {
            const matchesSearch = course.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                  course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  (course.teacherName || '').toLowerCase().includes(searchQuery.toLowerCase());
            
            if (!matchesSearch) return false;
            if (selectedCategory === 'الكل') return true;
            
            const cat = getCourseCategory(course.name);
            if (selectedCategory === 'أحكام التجويد' && cat === 'تجويد') return true;
            if (selectedCategory === 'حفظ ومراجعة' && cat === 'حفظ') return true;
            if (selectedCategory === 'تلاوة وتصحيح' && cat === 'تلاوة') return true;
            
            return false;
          });

          return (
            <div className={`rounded-2xl border shadow-sm p-6 transition-colors ${isDark ? 'bg-[#121826] border-slate-850' : 'bg-white border-slate-100'}`} id="student-enroll-panel">
              <div className="mb-6">
                <h2 className={`text-lg font-bold font-sans ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>طلب الالتحاق بحلقات ومناهج جديدة</h2>
                <p className="text-slate-400 text-xs mt-1">تصفح الدورات المتوفرة وقدم طلب انضمام ليتسنى للمعلمين قبولك وتفعيل ميكروفون القراءة لك.</p>
              </div>

              {/* Search and Category Filter Section */}
              <div className="mb-6 space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="ابحث عن اسم المقرر، الوصف، أو اسم الشيخ المعلم..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full text-right text-xs pr-10 pl-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all ${
                      isDark 
                        ? 'bg-slate-900 border-slate-800 text-slate-100 placeholder-slate-500' 
                        : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
                    }`}
                  />
                  <Search className="absolute right-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute left-3.5 top-3.5 text-xs text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
                    >
                      مسح
                    </button>
                  )}
                </div>

                {/* Category Filters */}
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                  {['الكل', 'أحكام التجويد', 'حفظ ومراجعة', 'تلاوة وتصحيح'].map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer border ${
                        selectedCategory === category
                          ? 'bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-500/10'
                          : isDark
                            ? 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {filteredCourses.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm border border-dashed border-slate-200 dark:border-slate-800/80 rounded-2xl">
                  <AlertCircle className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto mb-2.5" />
                  <p className="font-bold">لم نجد أي دورات مطابقة لخيارات البحث الحالية.</p>
                  <p className="text-xs text-slate-500 mt-1">تأكد من كتابة أحرف صحيحة أو جرب تصفح فئة أخرى.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredCourses.map(course => {
                    const enrollment = myEnrollments.find(e => e.courseId === course.id);
                    const isApproved = enrollment?.status === 'approved';
                    const isPending = enrollment?.status === 'pending';

                    return (
                      <div key={course.id} className={`p-5 border rounded-2xl transition-all flex flex-col justify-between ${isDark ? 'bg-[#172033] border-slate-800 hover:border-emerald-500' : 'bg-white border-slate-100 hover:border-emerald-100'}`}>
                        <div>
                          <div className="flex justify-between items-start gap-2 flex-wrap">
                            <h4 className={`font-extrabold text-base ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{course.name}</h4>
                            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                              getCourseCategory(course.name) === 'تجويد'
                                ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-500'
                                : getCourseCategory(course.name) === 'حفظ'
                                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                            }`}>
                              {getCourseCategory(course.name) === 'تجويد' ? 'أحكام تجويد' : getCourseCategory(course.name) === 'حفظ' ? 'حفظ ومراجعة' : 'تلاوة وتصحيح'}
                            </span>
                          </div>
                          <p className={`text-xs mt-1.5 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{course.description}</p>
                          <p className="text-xs text-emerald-500 font-bold mt-2">فضيلة الشيخ المعلم: {course.teacherName}</p>
                        </div>

                        <div className={`mt-4 pt-3 border-t flex justify-between items-center ${isDark ? 'border-slate-850' : 'border-slate-100'}`}>
                          <span className="text-[10px] text-slate-400 font-mono">الخطة: {course.startDate} إلى {course.endDate}</span>
                          
                          {isApproved ? (
                            <span className="bg-emerald-950/40 text-emerald-400 border border-emerald-900/50 text-xs px-3 py-1 rounded-full font-bold">ملتحق بالفعل</span>
                          ) : isPending ? (
                            <span className="bg-amber-950/40 text-amber-400 border border-amber-900/50 text-xs px-3 py-1 rounded-full font-bold animate-pulse">في انتظار القبول</span>
                          ) : (
                            <button
                              onClick={() => handleRequestEnroll(course.id)}
                              className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer transition-all"
                            >
                              تقديم طلب التحاق
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {activeTab === 'weekly-reports' && (
          <div className="space-y-6 text-right animate-fade-in" id="student-weekly-reports-panel">
            <div className={`p-6 rounded-3xl border ${isDark ? 'bg-[#121826] border-slate-850' : 'bg-white border-slate-100 shadow-sm'}`}>
              <div className="flex items-center gap-2.5 mb-6">
                <div className="h-10 w-10 bg-emerald-600/10 text-emerald-600 rounded-xl flex items-center justify-center font-bold">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">تقارير الأداء والمتابعة الأسبوعية</h3>
                  <p className="text-xs text-slate-400 mt-1">تتبع منحنى حفظك ومراجعتك للقرآن الكريم مع تفاصيل التقييمات التفاعلية وتوجيهات الشيوخ المعلمين.</p>
                </div>
              </div>

              {myWeeklyReports.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-slate-100 dark:border-slate-855 rounded-2xl">
                  <Mail className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                  <p className="text-xs text-slate-400 font-bold">لا توجد تقارير أسبوعية صادرة لك حتى الآن.</p>
                  <p className="text-[11px] text-slate-500 mt-1">سيقوم معلم الحلقة بإصدار تقريرك الأسبوعي وإرساله لبريدك الإلكتروني فور اكتمال تقييمات الأسبوع.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column - Historical Report Cards */}
                  <div className="lg:col-span-1 space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 mb-2">أرشيف تقاريرك الصادرة</h4>
                    <div className="max-h-[600px] overflow-y-auto space-y-4 pr-1">
                      {myWeeklyReports.map((report) => (
                        <div key={report.id} className={`p-4 rounded-2xl border transition-all ${isDark ? 'bg-[#172033] border-slate-800' : 'bg-slate-50 border-slate-150'}`}>
                          <div className="flex justify-between items-start flex-wrap gap-2">
                            <div>
                              <span className="text-[10px] bg-emerald-500/10 text-emerald-500 font-bold px-2.5 py-0.5 rounded-full">التقرير الأسبوعي</span>
                              <p className="text-[11px] text-slate-400 mt-1.5 font-bold">من {report.weekStartDate} إلى {report.weekEndDate}</p>
                            </div>
                            <div className="text-sm font-mono font-bold bg-emerald-600 text-white px-2.5 py-1 rounded-lg">
                              المعدل: {report.overallScore}%
                            </div>
                          </div>

                          <div className={`mt-3 grid grid-cols-3 gap-1.5 text-[10px] font-bold p-2 rounded-lg border text-center ${isDark ? 'bg-slate-900/40 border-slate-800 text-slate-300' : 'bg-white border-slate-100 text-slate-600'}`}>
                            <div>
                              <span className="block opacity-70">الحفظ</span>
                              <span className="font-mono text-xs">{report.memorizationScore}%</span>
                            </div>
                            <div>
                              <span className="block opacity-70">المراجعة</span>
                              <span className="font-mono text-xs">{report.revisionScore}%</span>
                            </div>
                            <div>
                              <span className="block opacity-70">التجويد</span>
                              <span className="font-mono text-xs">{report.tajweedScore}%</span>
                            </div>
                          </div>

                          {report.notes && (
                            <div className={`text-xs mt-3 p-2.5 rounded-xl border leading-relaxed ${isDark ? 'bg-indigo-950/20 border-indigo-900/40 text-slate-300' : 'bg-indigo-50/50 border-indigo-100/40 text-slate-600'}`}>
                              <strong>💬 توجيه فضيلة الشيخ:</strong>
                              <p className="mt-1 italic">" {report.notes} "</p>
                            </div>
                          )}

                          <div className="mt-3 pt-2.5 border-t border-slate-150 dark:border-slate-800/80 flex justify-between items-center text-[9px] text-slate-400 font-bold">
                            <span>أستاذ المادة: {report.teacherName}</span>
                            <span className="text-emerald-500 font-bold">✓ تم الإرسال للبريد</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column - Graphical Performance & High-Level Progress */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Performance Trends Chart */}
                    <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#172033] border-slate-800' : 'bg-slate-50 border-slate-150'}`}>
                      <div className="mb-4">
                        <h4 className="text-sm font-extrabold flex items-center gap-1.5">
                          <TrendingUp className="h-4 w-4 text-emerald-500" />
                          <span>منحنى تطور حفظك ومراجعتك الأسبوعي</span>
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">يعرض هذا الرسم البياني مستواك التراكمي في التلاوة والتجويد عبر الأسابيع.</p>
                      </div>

                      <div className="h-64 w-full" dir="ltr">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={myWeeklyReports
                              .sort((a, b) => a.weekStartDate.localeCompare(b.weekStartDate))
                              .map((r, idx) => ({
                                name: `أسبوع ${idx + 1}`,
                                'الحفظ': r.memorizationScore,
                                'المراجعة': r.revisionScore,
                                'التجويد': r.tajweedScore,
                                'المعدل العام': r.overallScore,
                              }))}
                            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#f1f5f9'} />
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                            <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: isDark ? '#0f172a' : '#ffffff',
                                borderColor: isDark ? '#334155' : '#e2e8f0',
                                borderRadius: '8px',
                                textAlign: 'right',
                              }}
                            />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                            <Line name="درجة الحفظ" type="monotone" dataKey="الحفظ" stroke="#10b981" strokeWidth={2.5} activeDot={{ r: 6 }} />
                            <Line name="درجة المراجعة" type="monotone" dataKey="المراجعة" stroke="#6366f1" strokeWidth={2.5} />
                            <Line name="تطبيق التجويد" type="monotone" dataKey="التجويد" stroke="#f59e0b" strokeWidth={2.5} />
                            <Line name="المعدل العام" type="monotone" dataKey="المعدل العام" stroke="#f43f5e" strokeWidth={3} strokeDasharray="5 5" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Progress Achievements */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className={`p-4 rounded-2xl border flex items-center justify-between ${isDark ? 'bg-indigo-950/20 border-indigo-900/40' : 'bg-indigo-50/50 border-indigo-100/40'}`}>
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold">أعلى علامة مراجعة</p>
                          <h3 className="text-xl font-extrabold mt-1 font-mono text-indigo-500">
                            {Math.max(...myWeeklyReports.map((r) => r.revisionScore))}%
                          </h3>
                        </div>
                        <Award className="h-8 w-8 text-indigo-500 opacity-80" />
                      </div>

                      <div className={`p-4 rounded-2xl border flex items-center justify-between ${isDark ? 'bg-emerald-950/20 border-emerald-900/40' : 'bg-emerald-50/50 border-emerald-100/40'}`}>
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold">أعلى علامة حفظ</p>
                          <h3 className="text-xl font-extrabold mt-1 font-mono text-emerald-500">
                            {Math.max(...myWeeklyReports.map((r) => r.memorizationScore))}%
                          </h3>
                        </div>
                        <Award className="h-8 w-8 text-emerald-500 opacity-80" />
                      </div>

                      <div className={`p-4 rounded-2xl border flex items-center justify-between ${isDark ? 'bg-amber-950/20 border-amber-900/40' : 'bg-amber-50/50 border-amber-100/40'}`}>
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold">المعدل التراكمي العام</p>
                          <h3 className="text-xl font-extrabold mt-1 font-mono text-amber-500">
                            {myWeeklyReports.length > 0 
                              ? `${Math.round(myWeeklyReports.reduce((acc, r) => acc + r.overallScore, 0) / myWeeklyReports.length)}%`
                              : '0%'
                            }
                          </h3>
                        </div>
                        <Sparkles className="h-8 w-8 text-amber-500 opacity-80 animate-pulse" />
                      </div>
                    </div>

                    {/* Quick Encouragement message */}
                    <div className={`p-5 rounded-2xl border flex gap-3.5 items-start ${isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-100'}`}>
                      <span className="text-2xl">💡</span>
                      <div>
                        <h5 className="text-xs font-bold">توجيه همة لحفظ كتاب الله:</h5>
                        <p className={`text-[11px] mt-1 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-550'}`}>
                          يا بني! تذكر دائماً قول النبي ﷺ: «يُقَالُ لِصَاحِبِ الْقُرْآنِ اقْرَأْ وَارْتَقِ وَرَتِّلْ كَمَا كُنْتَ تُرَتِّلُ فِي الدُّنْيَا فَإِنَّ مَنْزِلَتَكَ عِنْدَ آخِرِ آيَةٍ تَقْرَأُ بِهَا». استمر في حصد هذه الدرجات المباركة وتطبيق أحكام التجويد في تلاوتك اليومية!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <ProfileEditor currentUser={currentUser} onUpdateUser={onUpdateUser} isDark={isDark} />
        )}

        {activeTab === 'audio-practice' && (
          <AudioPractice currentUser={currentUser} isDark={isDark} lessons={allLessons} />
        )}

        {activeTab === 'advanced-search' && (
          <AdvancedSearch lessons={allLessons} isDark={isDark} />
        )}
      </div>
    </div>
  );
}
