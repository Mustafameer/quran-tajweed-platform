/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Mic,
  BookOpen,
  Calendar,
  Users,
  Video,
  FilePlus,
  PlusCircle,
  GraduationCap,
  Play,
  Check,
  CheckCircle,
  User as UserIcon,
  Clock,
  ArrowLeft,
  Mail,
  TrendingUp,
  BarChart2,
  FileText,
  Search,
  Loader,
  Sparkles
} from 'lucide-react';
import { User, Course, Session, Lesson, Evaluation, Attendance, WeeklyReport } from '../types';
import ProfileEditor from './ProfileEditor';
import MonthlyCalendar from './MonthlyCalendar';
import AdvancedSearch from './AdvancedSearch';
import { useToast } from './Toast';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar
} from 'recharts';

interface TeacherDashboardProps {
  currentUser: User;
  onLogout: () => void;
  onLaunchClassroom: (sessionId: string) => void;
  isDark?: boolean;
  onUpdateUser: (user: User) => void;
}

interface FeedbackTemplate {
  name: string;
  description: string;
  reading: number;
  tajweed: number;
  fluency: number;
  notes: string;
}

const FEEDBACK_TEMPLATES: FeedbackTemplate[] = [
  {
    name: "ممتاز مع مراعاة الغنة والتفخيم 🟢",
    description: "تلاوة متميزة ودرجة ممتازة، مع التنبيه على مواضع الغنن والحروف المفخمة.",
    reading: 95,
    tajweed: 90,
    fluency: 95,
    notes: "قراءة ممتازة ومخارج حروف سليمة جداً. نوصي بزيادة التركيز على أحكام الغنة وتفخيم الحروف المستعلية في مواضعها."
  },
  {
    name: "جيد جداً مع ضبط القلقلة 🔵",
    description: "قراءة منضبطة ودرجة جيدة جداً، مع الحاجة لضبط مراتب القلقلة عند الوقف.",
    reading: 88,
    tajweed: 82,
    fluency: 85,
    notes: "تلاوة جيدة جداً ولفظ سليم للكلمات. يرجى التركيز أكثر على مراتب القلقلة عند الوقف على الحروف الساكنة."
  },
  {
    name: "مستوى متوسط بحاجة لضبط المخارج 🟡",
    description: "أداء متوسط واعد، مع الحاجة لمزيد من الاستماع لضبط بعض المخارج الحرفية.",
    reading: 72,
    tajweed: 68,
    fluency: 70,
    notes: "أداء متوسط وجهد طيب. الطالب يحتاج إلى تكثيف سماع شيوخ التلاوة لضبط مخارج الحروف الشجرية والأسلية واللسوية."
  },
  {
    name: "طلاقة قوية مع تقصير في المدود 🟠",
    description: "تلاوة مسترسلة وسريعة، ولكن مع قصر لبعض المدود الطبيعية والفرعية.",
    reading: 90,
    tajweed: 70,
    fluency: 95,
    notes: "تلاوة سريعة مسترسلة وطلاقة ممتازة، ولكن يجب الانتباه لمقادير المدود الطبيعية والفرعية وعدم قصرها والالتزام بالمد المنفصل والمتصل."
  },
  {
    name: "مبتدئ مبارك مجتهد 🟣",
    description: "بداية مشجعة مع قراءة بطيئة، يحتاج للتدريب المستمر على أحكام النون الساكنة والتنوين.",
    reading: 65,
    tajweed: 60,
    fluency: 62,
    notes: "بداية مشجعة وقراءة بطيئة مباركة. يحتاج الطالب إلى تدريب يومي مستمر مع تصحيح بطيء وتطبيق أحكام النون الساكنة والتنوين."
  }
];

export default function TeacherDashboard({ currentUser, onLogout, onLaunchClassroom, isDark = false, onUpdateUser }: TeacherDashboardProps) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'sessions' | 'lessons' | 'grades' | 'profile' | 'audio-review' | 'advanced-search' | 'students-management'>('sessions');
  
  // State
  const [myCourses, setMyCourses] = useState<Course[]>([]);
  const [mySessions, setMySessions] = useState<Session[]>([]);
  const [myLessons, setMyLessons] = useState<Lesson[]>([]);
  const [allStudents, setAllStudents] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allEnrollments, setAllEnrollments] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);

  // Weekly Performance Reports States
  const [weeklyReports, setWeeklyReports] = useState<WeeklyReport[]>([]);
  const [gradesSubTab, setGradesSubTab] = useState<'individual' | 'weekly-reports'>('individual');
  const [selectedReportStudentId, setSelectedReportStudentId] = useState('');
  const [reportWeekStart, setReportWeekStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [reportWeekEnd, setReportWeekEnd] = useState(() => new Date().toISOString().split('T')[0]);
  const [reportMemorizationScore, setReportMemorizationScore] = useState(85);
  const [reportRevisionScore, setReportRevisionScore] = useState(80);
  const [reportTajweedScore, setReportTajweedScore] = useState(85);
  const [reportNotes, setReportNotes] = useState('أداء متميز وثابت هذا الأسبوع في الحفظ وتلاوة الأحكام. استمر بارك الله فيك ونفع بك.');
  const [sendingReport, setSendingReport] = useState(false);
  const [lastSentEmailPreview, setLastSentEmailPreview] = useState<any>(null);
  const [simulatedTelegramPreview, setSimulatedTelegramPreview] = useState<any>(null);
  const [isTriggeringAuto, setIsTriggeringAuto] = useState(false);

  // Student practice clips state
  const [practiceClips, setPracticeClips] = useState<any[]>([]);
  const [reviewText, setReviewText] = useState<Record<string, string>>({});
  const [isSubmittingReview, setIsSubmittingReview] = useState<Record<string, boolean>>({});
  
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Sessions Filtering States
  const [sessionFilter, setSessionFilter] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Course creation states
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseDesc, setNewCourseDesc] = useState('');
  const [newCourseStart, setNewCourseStart] = useState('');
  const [newCourseEnd, setNewCourseEnd] = useState('');

  // Session creation states
  const [newSessionCourse, setNewSessionCourse] = useState('');
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [newSessionDate, setNewSessionDate] = useState('');
  const [newSessionStart, setNewSessionStart] = useState('');
  const [newSessionEnd, setNewSessionEnd] = useState('');

  // Add Student to Course states
  const [addStudentCourseId, setAddStudentCourseId] = useState('');
  const [addStudentId, setAddStudentId] = useState('');

  const fetchPracticeClips = async () => {
    try {
      const res = await fetch('/api/practice-clips');
      if (res.ok) {
        const data = await res.json();
        setPracticeClips(data);
      }
    } catch (err) {
      console.error('Error fetching practice clips:', err);
    }
  };

  const handleSubmitReview = async (clipId: string) => {
    const feedback = reviewText[clipId]?.trim();
    if (!feedback) {
      showToast('يرجى كتابة التقييم والملاحظات أولاً', 'warning');
      return;
    }
    
    setIsSubmittingReview(prev => ({ ...prev, [clipId]: true }));
    try {
      const res = await fetch(`/api/practice-clips/${clipId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId: currentUser.id,
          teacherName: currentUser.fullName,
          feedback: feedback
        })
      });
      if (res.ok) {
        showToast('✅ تم رصد وحفظ تصحيح التلاوة والتوجيهات للطالب بنجاح!', 'success');
        setReviewText(prev => ({ ...prev, [clipId]: '' }));
        fetchPracticeClips();
      } else {
        const err = await res.json();
        showToast(err.error || 'فشل في حفظ التقييم', 'error');
      }
    } catch (err) {
      showToast('حدث خطأ في الشبكة أثناء إرسال التقييم', 'error');
    } finally {
      setIsSubmittingReview(prev => ({ ...prev, [clipId]: false }));
    }
  };

  // Lesson Upload Form State
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonDesc, setLessonDesc] = useState('');
  const [lessonVideo, setLessonVideo] = useState('');
  const [lessonPdf, setLessonPdf] = useState('');

  // Evaluation Form State
  const [evalStudent, setEvalStudent] = useState('');
  const [evalSession, setEvalSession] = useState('');
  const [evalReading, setEvalReading] = useState(80);
  const [evalTajweed, setEvalTajweed] = useState(80);
  const [evalFluency, setEvalFluency] = useState(80);
  const [evalNotes, setEvalNotes] = useState('');

  // Quick Evaluation drawer state
  const [isQuickEvalOpen, setIsQuickEvalOpen] = useState(false);

  const handleApplyTemplate = (tpl: FeedbackTemplate) => {
    setEvalReading(tpl.reading);
    setEvalTajweed(tpl.tajweed);
    setEvalFluency(tpl.fluency);
    setEvalNotes(tpl.notes);
    setIsQuickEvalOpen(false);
    
    setMessage('⚡ تم تطبيق قالب التقييم السريع بنجاح! يمكنك الآن مراجعة وحفظ التقييم.');
    setTimeout(() => setMessage(''), 4000);
  };

  const downloadAttendanceAndGradesReport = () => {
    let csvContent = "\uFEFF"; // UTF-8 BOM
    
    const headers = [
      "اسم الطالب",
      "الحصة / الحلقة",
      "تاريخ الحضور",
      "وقت الدخول للميكروفون",
      "وقت المغادرة",
      "مدة البقاء (بالدقائق)",
      "تقييم المخارج وقراءتها",
      "تقييم أحكام التجويد",
      "تقييم الطلاقة اللسانية",
      "المعدل الكلي",
      "توجيهات المعلم وملاحظاته"
    ];
    csvContent += headers.join(",") + "\n";

    attendance.forEach(att => {
      const correlatedEval = evaluations.find(
        ev => ev.studentId === att.studentId && ev.sessionId === att.sessionId
      );

      const sName = att.studentName || "طالب غير معروف";
      const sTitle = att.sessionTitle || "حلقة تلاوة";
      const jDate = new Date(att.joinTime).toLocaleDateString('ar-SA') || "-";
      const jTime = new Date(att.joinTime).toLocaleTimeString('ar-SA') || "-";
      const lTime = att.leaveTime ? new Date(att.leaveTime).toLocaleTimeString('ar-SA') : "نشط بالبث";
      const durationMin = att.duration ? Math.round(att.duration / 60) : 0;

      const readingAcc = correlatedEval ? `${correlatedEval.readingAccuracy}%` : "لم يقيم بعد";
      const tajweedAcc = correlatedEval ? `${correlatedEval.tajweedAccuracy}%` : "لم يقيم بعد";
      const fluencyVal = correlatedEval ? `${correlatedEval.fluency}%` : "لم يقيم بعد";
      const scoreTotal = correlatedEval ? `${correlatedEval.score}%` : "لم يقيم بعد";
      const notesClean = correlatedEval && correlatedEval.notes 
        ? `"${correlatedEval.notes.replace(/"/g, '""')}"` 
        : "-";

      const row = [
        sName,
        sTitle,
        jDate,
        jTime,
        lTime,
        durationMin,
        readingAcc,
        tajweedAcc,
        fluencyVal,
        scoreTotal,
        notesClean
      ];

      csvContent += row.join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `تقرير_الحضور_والتقييمات_القرآنية_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fetchTeacherData = async () => {
    setLoading(true);
    try {
      const [cRes, sRes, lRes, uRes, attRes, evRes, rRes, enRes] = await Promise.all([
        fetch('/api/courses'),
        fetch('/api/sessions'),
        fetch('/api/lessons'),
        fetch('/api/users'),
        fetch('/api/attendance'),
        fetch('/api/evaluations'),
        fetch('/api/weekly-reports'),
        fetch('/api/enrollments')
      ]);

      const [cData, sData, lData, uData, attData, evData, rData, enData] = await Promise.all([
        cRes.json(),
        sRes.json(),
        lRes.json(),
        uRes.json(),
        attRes.json(),
        evRes.json(),
        rRes.json(),
        enRes.json()
      ]);

      // Filter courses & lessons assigned to me
      const assignedCourses = cData.filter((c: Course) => c.teacherId === currentUser.id);
      const myCourseIds = assignedCourses.map((c: Course) => c.id);
      
      setMyCourses(assignedCourses);
      setMySessions(sData.filter((s: Session) => myCourseIds.includes(s.courseId)));
      setMyLessons(lData.filter((l: Lesson) => l.teacherId === currentUser.id));
      setAllStudents(uData.filter((u: User) => u.role === 'student' && u.status === 'approved'));
      setAllUsers(uData);
      setAllEnrollments(enData);
      setAttendance(attData);
      setEvaluations(evData);
      setWeeklyReports(rData);
      await fetchPracticeClips();
    } catch (err) {
      console.error('Error fetching teacher data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeacherData();
    fetchPracticeClips();
  }, []);

  const handleSendWeeklyReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReportStudentId) {
      showToast('يرجى اختيار الطالب المراد إصدار تقريره الأسبوعي', 'warning');
      return;
    }

    setSendingReport(true);
    try {
      const res = await fetch('/api/weekly-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedReportStudentId,
          teacherId: currentUser.id,
          weekStartDate: reportWeekStart,
          weekEndDate: reportWeekEnd,
          memorizationScore: reportMemorizationScore,
          revisionScore: reportRevisionScore,
          tajweedScore: reportTajweedScore,
          notes: reportNotes
        })
      });

      if (res.ok) {
        const data = await res.json();
        showToast('تم حفظ التقرير الأسبوعي وإرسال بريد إلكتروني تفاعلي للطالب بنجاح! 📊📩', 'success');
        setLastSentEmailPreview(data.simulatedEmail);
        
        // Reload weekly reports list
        const rRes = await fetch('/api/weekly-reports');
        if (rRes.ok) {
          const rData = await rRes.json();
          setWeeklyReports(rData);
        }
        
        // Clear notes form only
        setReportNotes('أداء متميز وثابت هذا الأسبوع في الحفظ وتلاوة الأحكام. استمر بارك الله فيك ونفع بك.');
      } else {
        const err = await res.json();
        showToast(err.error || 'فشل إرسال التقرير', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('حدث خطأ أثناء إرسال التقرير', 'error');
    } finally {
      setSendingReport(false);
    }
  };

  const handleTriggerAutoReports = async () => {
    setIsTriggeringAuto(true);
    try {
      const res = await fetch('/api/weekly-reports/trigger-auto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        showToast(data.message || 'تم تشغيل نظام التقارير التلقائية وإرسالها لجميع الطلاب!', 'success');
        
        // Reload weekly reports list
        const rRes = await fetch('/api/weekly-reports');
        if (rRes.ok) {
          const rData = await rRes.json();
          setWeeklyReports(rData);
        }
      } else {
        const err = await res.json();
        showToast(err.error || 'فشل تشغيل الأتمتة الدورية', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('حدث خطأ أثناء تشغيل الأتمتة', 'error');
    } finally {
      setIsTriggeringAuto(false);
    }
  };

  const handleApproveUser = async (userId: string, status: 'approved' | 'rejected') => {
    try {
      const res = await fetch(`/api/users/approve/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, actorId: currentUser.id, actorRole: currentUser.role })
      });
      if (res.ok) {
        const data = await res.json();
        showToast(status === 'approved' ? 'تم قبول وتسجيل الطالب بنجاح، وتم إرسال رسالة (Telegram) لإعلامه بالتفعيل 📩' : 'تم رفض طلب التسجيل', 'success');
        if (data.simulatedTelegram) {
          setSimulatedTelegramPreview(data.simulatedTelegram);
        }
        fetchTeacherData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveEnrollment = async (enrollmentId: string, status: 'approved' | 'rejected') => {
    try {
      const res = await fetch(`/api/enrollments/approve/${enrollmentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, actorId: currentUser.id, actorRole: currentUser.role })
      });
      if (res.ok) {
        showToast(status === 'approved' ? 'تم قبول الطالب في دورتك' : 'تم رفض انضمام الطالب للدورة', 'success');
        fetchTeacherData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleForceLeaveAttendance = async (sessionId: string, studentId: string) => {
    try {
      const res = await fetch('/api/attendance/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, studentId })
      });
      if (res.ok) {
        showToast('تم إنهاء حضور الطالب بنجاح وتثبيت وقت المغادرة 🔔', 'success');
        fetchTeacherData();
      } else {
        const err = await res.json();
        showToast(err.error || 'فشل في إنهاء حضور الطالب', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('حدث خطأ في الشبكة أثناء محاولة إنهاء حضور الطالب', 'error');
    }
  };

  const handleDeleteAttendance = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف سجل حضور هذا الطالب نهائياً؟ لا يمكن التراجع عن هذا الإجراء.')) return;
    try {
      const res = await fetch(`/api/attendance/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        showToast('تم حذف سجل الحضور بنجاح 🗑️', 'success');
        fetchTeacherData();
      } else {
        const err = await res.json();
        showToast(err.error || 'فشل في حذف السجل', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('حدث خطأ في الشبكة أثناء محاولة حذف السجل', 'error');
    }
  };

  const handleAddStudentToCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addStudentCourseId || !addStudentId) {
      showToast('يرجى اختيار الدورة والطالب', 'warning');
      return;
    }
    try {
      const res = await fetch('/api/enrollments/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: addStudentId,
          courseId: addStudentCourseId,
          teacherId: currentUser.id
        })
      });
      if (res.ok) {
        showToast('تم إضافة الطالب إلى الدورة بنجاح', 'success');
        setAddStudentId('');
        fetchTeacherData();
      } else {
        const err = await res.json();
        showToast(err.error || 'خطأ في إضافة الطالب', 'error');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseName) {
      showToast('يرجى تحديد اسم المقرر', 'warning');
      return;
    }

    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCourseName,
          description: newCourseDesc,
          teacherId: currentUser.id,
          startDate: newCourseStart || new Date().toISOString().split('T')[0],
          endDate: newCourseEnd || new Date(Date.now() + 90 * 24 * 3600000).toISOString().split('T')[0],
          adminId: currentUser.id
        })
      });
      if (res.ok) {
        showToast('تم إنشاء المنهج التعليمي الجديد وإسناده لك بنجاح! 🎓', 'success');
        setNewCourseName('');
        setNewCourseDesc('');
        setNewCourseStart('');
        setNewCourseEnd('');
        fetchTeacherData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionCourse || !newSessionTitle || !newSessionDate || !newSessionStart || !newSessionEnd) {
      showToast('يرجى استيفاء كافة حقول الحصة', 'warning');
      return;
    }

    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: newSessionCourse,
          title: newSessionTitle,
          date: newSessionDate,
          startTime: newSessionStart,
          endTime: newSessionEnd,
          teacherId: currentUser.id
        })
      });
      if (res.ok) {
        showToast('تم جدولة وبث الحصة المباشرة الجديدة بنجاح! 🎙️', 'success');
        setNewSessionCourse('');
        setNewSessionTitle('');
        setNewSessionDate('');
        setNewSessionStart('');
        setNewSessionEnd('');
        fetchTeacherData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartSession = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/sessions/start/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId: currentUser.id })
      });
      if (res.ok) {
        onLaunchClassroom(sessionId);
      }
    } catch (err) {
      console.error('Error starting session:', err);
    }
  };

  const handleUploadLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonTitle) {
      alert('يرجى كتابة عنوان المادة');
      return;
    }

    try {
      const res = await fetch('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: lessonTitle,
          description: lessonDesc,
          videoLink: lessonVideo,
          pdfFile: lessonPdf || 'lesson_attachment.pdf',
          teacherId: currentUser.id
        })
      });

      if (res.ok) {
        setMessage('تم رفع وتعميم الدرس والمادة التعليمية بنجاح!');
        setLessonTitle('');
        setLessonDesc('');
        setLessonVideo('');
        setLessonPdf('');
        fetchTeacherData();
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evalStudent || !evalSession) {
      alert('يرجى تحديد الطالب والحصة الدراسية لتقييمها');
      return;
    }

    try {
      const res = await fetch('/api/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: evalStudent,
          sessionId: evalSession,
          readingAccuracy: evalReading,
          tajweedAccuracy: evalTajweed,
          fluency: evalFluency,
          notes: evalNotes,
          teacherId: currentUser.id
        })
      });

      if (res.ok) {
        showToast('🎯 تم رصد وحفظ تقييم التلاوة والسرعة بنجاح وإرساله للطالب!', 'success');
        setMessage('تم رصد وحفظ تقييم التلاوة وإرسال التنبيه للطالب!');
        setEvalStudent('');
        setEvalSession('');
        setEvalReading(80);
        setEvalTajweed(80);
        setEvalFluency(80);
        setEvalNotes('');
        fetchTeacherData();
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={`min-h-screen text-right font-sans transition-colors duration-300 ${isDark ? 'bg-[#0B0F19] text-slate-100' : 'bg-slate-50 text-slate-800'}`} dir="rtl" id="teacher-dashboard-container">
      {/* Top Banner */}
      <div className={`pb-24 pt-8 px-6 border-b transition-colors duration-300 ${isDark ? 'bg-[#121826] border-slate-850 text-slate-100 shadow-sm' : 'bg-white border-slate-100 text-slate-800 shadow-sm'}`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <span className={`text-xs px-3 py-1 rounded-full font-bold border ${isDark ? 'bg-emerald-950/45 text-emerald-400 border-emerald-800/60' : 'bg-emerald-50 border-emerald-100 text-emerald-800'}`}>هيئة التدريس والتعليم</span>
            <h1 className="text-3xl font-extrabold mt-1">{currentUser.fullName}</h1>
            <p className={`text-sm mt-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>أهلاً بك يا فضيلة الشيخ. تحكم في حصصك المباشرة، وقّم أداء طلابك لترقيتهم</p>
          </div>
          <button
            id="teacher-logout-btn"
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

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-6 -mt-16 pb-12">
        {/* Navigation Tabs */}
        <div className={`flex border mb-6 p-2 rounded-2xl shadow-sm gap-2 overflow-x-auto transition-colors ${isDark ? 'bg-[#121826] border-slate-850' : 'bg-white border-slate-100'}`}>
          <button
            id="tab-teacher-sessions"
            onClick={() => setActiveTab('sessions')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'sessions'
                ? 'bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-100/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span>حصصي الحالية والمباشرة</span>
          </button>

          <button
            id="tab-teacher-students-management"
            onClick={() => setActiveTab('students-management')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'students-management'
                ? 'bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-100/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>إدارة الطلاب والالتحاق</span>
          </button>

          <button
            id="tab-teacher-lessons"
            onClick={() => setActiveTab('lessons')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'lessons'
                ? 'bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-100/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FilePlus className="h-4 w-4" />
            <span>رفع دروس التجويد والمواد</span>
          </button>

          <button
            id="tab-teacher-grades"
            onClick={() => setActiveTab('grades')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'grades'
                ? 'bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-100/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <GraduationCap className="h-4 w-4" />
            <span>رصد تقييم الطلاب</span>
          </button>

          <button
            id="tab-teacher-audio-review"
            onClick={() => setActiveTab('audio-review')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'audio-review'
                ? 'bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-100/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mic className="h-4 w-4" />
            <span>🎤 تصحيح تلاوات الطلاب</span>
          </button>

          <button
            id="tab-teacher-search"
            onClick={() => setActiveTab('advanced-search')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'advanced-search'
                ? 'bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-100/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Search className="h-4 w-4" />
            <span>البحث القرآني المتقدم 🔍</span>
          </button>

          <button
            id="tab-teacher-profile"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-100/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserIcon className="h-4 w-4" />
            <span>تعديل الملف الشخصي</span>
          </button>
        </div>

        {message && (
          <div id="teacher-toast-message" className={`p-4 rounded-xl mb-6 shadow-sm font-medium text-sm flex items-center gap-2 border ${
            isDark 
              ? 'bg-emerald-950/40 border-emerald-900 text-emerald-400' 
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}>
            <span>📚</span>
            <div>{message}</div>
          </div>
        )}

        {/* Tab Contents */}
        {activeTab === 'sessions' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="teacher-sessions-tab">
            {/* Live/Scheduled Sessions */}
            <div className="lg:col-span-2 space-y-6">
              <MonthlyCalendar 
                sessions={mySessions} 
                isDark={isDark} 
                onAction={(sessId) => onLaunchClassroom(sessId)} 
                actionLabel="بدء البث والمقرأة"
              />

              <div className={`rounded-2xl border p-6 shadow-sm ${isDark ? 'bg-[#121826] border-slate-850' : 'bg-white border-slate-100'}`}>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
                  <h2 className={`text-lg font-bold font-sans ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>جدول الحلقات والمحاضرات الصوتية</h2>
                  
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
                  const filteredSessions = mySessions.filter(session => {
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
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <Calendar className="h-12 w-12 text-slate-300 mb-3" />
                      <p className="text-slate-500 font-medium">لم يتم العثور على حصص تطابق التصفية المحددة.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredSessions.map(session => (
                        <div key={session.id} className={`p-5 border rounded-2xl transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${isDark ? 'bg-[#172033] border-slate-800 hover:border-emerald-500' : 'bg-white border-slate-100 hover:border-emerald-200'}`}>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                              session.status === 'live' 
                                ? 'bg-rose-950/40 text-rose-400 border border-rose-900/60 animate-pulse' 
                                : isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {session.status === 'live' ? 'مباشر الآن 🔴' : 'مجدولة'}
                            </span>
                            <span className={`text-xs font-bold ${isDark ? 'text-indigo-400' : 'text-indigo-700'}`}>{session.courseName}</span>
                          </div>
                          <h3 className={`text-base font-extrabold mt-2 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{session.title}</h3>
                          <p className={`text-xs mt-1.5 flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>
                            <Clock className="h-3.5 w-3.5" />
                            <span>التاريخ: {session.date} | الوقت: {session.startTime} - {session.endTime}</span>
                          </p>
                        </div>

                        <div className="w-full md:w-auto">
                          {session.status === 'live' ? (
                            <button
                              id={`launch-session-btn-${session.id}`}
                              onClick={() => onLaunchClassroom(session.id)}
                              className="w-full md:w-auto bg-rose-600 hover:bg-rose-500 text-white font-bold px-5 py-2.5 rounded-xl shadow-md cursor-pointer text-sm flex items-center justify-center gap-1.5 transition-all"
                            >
                              <Play className="h-4 w-4" />
                              <span>دخول الغرفة الصوتية المباشرة</span>
                            </button>
                          ) : session.status === 'scheduled' ? (
                            <button
                              id={`start-session-btn-${session.id}`}
                              onClick={() => handleStartSession(session.id)}
                              className="w-full md:w-auto bg-emerald-700 hover:bg-emerald-600 text-white font-bold px-5 py-2.5 rounded-xl cursor-pointer text-sm flex items-center justify-center gap-1.5 transition-all"
                            >
                              <Mic className="h-4 w-4" />
                              <span>بدء البث الصوتي والحصة</span>
                            </button>
                          ) : (
                            <span className="text-slate-400 text-xs font-bold">مكتملة</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
                })()}
              </div>

              {/* Attendance Log for teacher */}
              <div className={`rounded-2xl border p-6 shadow-sm ${isDark ? 'bg-[#121826] border-slate-850' : 'bg-white border-slate-100'}`}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                  <h2 className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>سجل حضور طلاب حلقاتك</h2>
                  {attendance.length > 0 && (
                    <button
                      onClick={downloadAttendanceAndGradesReport}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                    >
                      <span>تحميل تقرير الحضور والدرجات (CSV) 📥</span>
                    </button>
                  )}
                </div>
                {attendance.length === 0 ? (
                  <p className="text-slate-400 text-sm py-4">لم يتسجل حضور طلاب في أي حصة بعد.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-sm">
                      <thead>
                        <tr className={`border-b font-medium ${isDark ? 'bg-[#172033]/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                          <th className="p-3">اسم الطالب</th>
                          <th className="p-3">الحصة</th>
                          <th className="p-3">تاريخ الدخول</th>
                          <th className="p-3">وقت المغادرة</th>
                          <th className="p-3">مدة البقاء</th>
                          <th className="p-3 text-center">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${isDark ? 'divide-slate-800 text-slate-200' : 'divide-slate-100 text-slate-700'}`}>
                        {attendance.map(att => (
                          <tr key={att.id} className={isDark ? 'hover:bg-slate-900/40' : 'hover:bg-slate-50/50'}>
                            <td className="p-3 font-bold">{att.studentName}</td>
                            <td className={`p-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{att.sessionTitle}</td>
                            <td className="p-3 font-mono text-xs">{new Date(att.joinTime).toLocaleTimeString('ar-SA')}</td>
                            <td className="p-3 font-mono text-xs">
                              {att.leaveTime ? new Date(att.leaveTime).toLocaleTimeString('ar-SA') : (
                                <span className="text-rose-500 animate-pulse font-bold">نشط بالبث 🔴</span>
                              )}
                            </td>
                            <td className="p-3 font-mono text-xs">
                              {att.duration ? `${Math.round(att.duration / 60)} دقيقة` : 'قيد المتابعة'}
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex gap-2 justify-center">
                                {!att.leaveTime && (
                                  <button
                                    onClick={() => handleForceLeaveAttendance(att.sessionId, att.studentId)}
                                    className="bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold px-2 py-1 rounded-lg transition-colors cursor-pointer shadow-sm"
                                    title="إنهاء حضور الطالب وتثبيت وقت مغادرته الآن"
                                  >
                                    إنهاء الحضور
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteAttendance(att.id)}
                                  className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold px-2 py-1 rounded-lg transition-colors cursor-pointer shadow-sm"
                                  title="حذف هذا السجل نهائياً"
                                >
                                  حذف السجل
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Courses summary sidepanel */}
            <div className="space-y-6">
              <div className={`rounded-2xl border p-6 shadow-sm ${isDark ? 'bg-[#121826] border-slate-850' : 'bg-white border-slate-100'}`}>
                <h2 className={`text-lg font-bold mb-4 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>مناهجي المقررة</h2>
                <div className="space-y-4">
                  {myCourses.length === 0 ? (
                    <p className="text-slate-400 text-xs">لا يوجد مناهج تعليمية مسندة إليك حالياً. يمكنك إنشاء واحد أدناه.</p>
                  ) : (
                    myCourses.map(course => (
                      <div key={course.id} className={`p-4 rounded-xl border ${isDark ? 'bg-[#172033] border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                        <h4 className={`font-bold text-sm ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{course.name}</h4>
                        <p className={`text-[11px] mt-1 line-clamp-2 ${isDark ? 'text-slate-400' : 'text-slate-405'}`}>{course.description}</p>
                        <div className="mt-3 flex justify-between items-center text-[10px] text-slate-500">
                          <span>المدة: {course.startDate} إلى {course.endDate}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Schedule Classroom Session Form */}
              <div className={`rounded-2xl border p-6 shadow-sm text-right ${isDark ? 'bg-[#121826] border-slate-850' : 'bg-white border-slate-100'}`}>
                <h2 className={`text-base font-bold mb-4 flex items-center gap-1.5 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                  <PlusCircle className="h-5 w-5 text-emerald-500" />
                  <span>جدولة حلقة مباشرة جديدة</span>
                </h2>
                <form onSubmit={handleCreateSession} className="space-y-4">
                  <div>
                    <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>اختر المنهج/الدورة المقررة *</label>
                    <select
                      value={newSessionCourse}
                      onChange={(e) => setNewSessionCourse(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg outline-none text-sm text-right focus:ring-2 focus:ring-emerald-500 ${isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'}`}
                      required
                    >
                      <option value="">-- اختر الدورة --</option>
                      {myCourses.map(course => (
                        <option key={course.id} value={course.id}>{course.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-650'}`}>عنوان الحلقة/الدرس المباشر *</label>
                    <input
                      type="text"
                      value={newSessionTitle}
                      onChange={(e) => setNewSessionTitle(e.target.value)}
                      placeholder="مثال: تصحيح مخارج الحروف الشفوية"
                      className={`w-full px-3 py-2 border rounded-lg outline-none text-sm text-right focus:ring-2 focus:ring-emerald-500 ${isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'}`}
                      required
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-650'}`}>تاريخ الجلسة *</label>
                    <input
                      type="date"
                      value={newSessionDate}
                      onChange={(e) => setNewSessionDate(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg outline-none text-xs text-right focus:ring-2 focus:ring-emerald-500 ${isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'}`}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-650'}`}>وقت البدء *</label>
                      <input
                        type="time"
                        value={newSessionStart}
                        onChange={(e) => setNewSessionStart(e.target.value)}
                        className={`w-full px-2 py-2 border rounded-lg outline-none text-xs text-right focus:ring-2 focus:ring-emerald-500 ${isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'}`}
                        required
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-650'}`}>وقت الانتهاء *</label>
                      <input
                        type="time"
                        value={newSessionEnd}
                        onChange={(e) => setNewSessionEnd(e.target.value)}
                        className={`w-full px-2 py-2 border rounded-lg outline-none text-xs text-right focus:ring-2 focus:ring-emerald-500 ${isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'}`}
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl cursor-pointer transition-all text-xs mt-2"
                  >
                    جدولة الحلقة ونشرها 🗓️
                  </button>
                </form>
              </div>

              {/* Create Course Form for Teacher */}
              <div className={`rounded-2xl border p-6 shadow-sm text-right ${isDark ? 'bg-[#121826] border-slate-850' : 'bg-white border-slate-100'}`}>
                <h2 className={`text-base font-bold mb-4 flex items-center gap-1.5 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                  <BookOpen className="h-5 w-5 text-emerald-500" />
                  <span>إنشاء صف/دورة تعليمية جديدة</span>
                </h2>
                <form onSubmit={handleCreateCourse} className="space-y-4">
                  <div>
                    <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-650'}`}>اسم الدورة/المقرر الجديد *</label>
                    <input
                      type="text"
                      value={newCourseName}
                      onChange={(e) => setNewCourseName(e.target.value)}
                      placeholder="مثال: أحكام التجويد للمبتدئين"
                      className={`w-full px-3 py-2 border rounded-lg outline-none text-sm text-right focus:ring-2 focus:ring-emerald-500 ${isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'}`}
                      required
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-650'}`}>وصف موجز للمنهج</label>
                    <textarea
                      value={newCourseDesc}
                      onChange={(e) => setNewCourseDesc(e.target.value)}
                      placeholder="وصف تفصيلي للدورة التعليمية وأهدافها..."
                      rows={3}
                      className={`w-full px-3 py-2 border rounded-lg outline-none text-sm text-right focus:ring-2 focus:ring-emerald-500 ${isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'}`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-650'}`}>تاريخ البدء</label>
                      <input
                        type="date"
                        value={newCourseStart}
                        onChange={(e) => setNewCourseStart(e.target.value)}
                        className={`w-full px-2 py-2 border rounded-lg outline-none text-xs text-right ${isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'}`}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-650'}`}>تاريخ الانتهاء</label>
                      <input
                        type="date"
                        value={newCourseEnd}
                        onChange={(e) => setNewCourseEnd(e.target.value)}
                        className={`w-full px-2 py-2 border rounded-lg outline-none text-xs text-right ${isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'}`}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl cursor-pointer transition-all text-xs mt-2"
                  >
                    حفظ وإطلاق الدورة 🚀
                  </button>
                </form>
              </div>
            </div>

            {simulatedTelegramPreview && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[10000]" dir="rtl">
                <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 border border-slate-100 text-slate-800 relative">
                  <button onClick={() => setSimulatedTelegramPreview(null)} className="absolute top-4 left-4 text-slate-400 hover:text-slate-600 font-bold bg-slate-100 hover:bg-slate-200 rounded-full h-8 w-8 flex items-center justify-center transition-colors">✕</button>
                  <div className="flex items-center gap-2 mb-4 text-[#0088cc]">
                    <div className="h-8 w-8 bg-[#0088cc]/10 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.223-.548.223l.188-2.85 5.18-4.68c.223-.198-.054-.309-.346-.11l-6.4 4.02-2.76-.86c-.6-.188-.61-.6.126-.89L17.2 7.03c.69-.26 1.28.16 1.093 1.19z"/></svg>
                    </div>
                    <span className="font-bold text-sm">رسالة تيليجرام تفاعلية (محاكاة)</span>
                  </div>
                  <div className="bg-[#e6f2f8] p-4 rounded-xl text-sm leading-relaxed whitespace-pre-line text-[#004466] border border-[#b3d9eb] shadow-inner mb-2">
                    {simulatedTelegramPreview.message}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono text-left">Sent to: {simulatedTelegramPreview.to}</div>
                </div>
              </div>
            )}

          </div>
        )}

        {activeTab === 'lessons' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="teacher-lessons-tab">
            {/* Upload Lessons Form */}
            <div className={`rounded-2xl border p-6 shadow-sm lg:col-span-1 h-fit ${isDark ? 'bg-[#121826] border-slate-850' : 'bg-white border-slate-100'}`}>
              <h2 className={`text-lg font-bold mb-4 flex items-center gap-1.5 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                <PlusCircle className="h-5 w-5 text-emerald-500" />
                <span>إضافة مادة تجويد / ملف جديد</span>
              </h2>
              <form onSubmit={handleUploadLesson} className="space-y-4">
                <div>
                  <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>عنوان المادة التعليمية *</label>
                  <input
                    type="text"
                    value={lessonTitle}
                    onChange={(e) => setLessonTitle(e.target.value)}
                    placeholder="مثال: مخارج الحروف والصفات"
                    className={`w-full px-3 py-2 border rounded-lg outline-none text-sm text-right focus:ring-2 focus:ring-emerald-500 ${isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'}`}
                    required
                  />
                </div>

                <div>
                  <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>وصف موجز للمادة</label>
                  <textarea
                    value={lessonDesc}
                    onChange={(e) => setLessonDesc(e.target.value)}
                    placeholder="اكتب تفاصيل الدرس ومحاوره للطلاب..."
                    rows={4}
                    className={`w-full px-3 py-2 border rounded-lg outline-none text-sm text-right focus:ring-2 focus:ring-emerald-500 ${isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'}`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>رابط يوتيوب للشرح المرئي (اختياري)</label>
                  <input
                    type="url"
                    value={lessonVideo}
                    onChange={(e) => setLessonVideo(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className={`w-full px-3 py-2 border rounded-lg outline-none text-sm text-right focus:ring-2 focus:ring-emerald-500 ${isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'}`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>اسم ملف الـ PDF المرفق</label>
                  <input
                    type="text"
                    value={lessonPdf}
                    onChange={(e) => setLessonPdf(e.target.value)}
                    placeholder="مثال: ahkam_tajweed.pdf"
                    className={`w-full px-3 py-2 border rounded-lg outline-none text-sm text-right focus:ring-2 focus:ring-emerald-500 ${isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'}`}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-2.5 rounded-xl cursor-pointer transition-all text-sm mt-2"
                >
                  حفظ وتعميم الدرس للطلاب
                </button>
              </form>
            </div>

            {/* Lessons list uploaded by me */}
            <div className={`rounded-2xl border p-6 shadow-sm lg:col-span-2 ${isDark ? 'bg-[#121826] border-slate-850' : 'bg-white border-slate-100'}`}>
              <h2 className={`text-lg font-bold mb-4 font-sans ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>قائمة المواد ودروس التجويد التي قمت برفعها</h2>
              {myLessons.length === 0 ? (
                <p className="text-slate-400 text-sm py-4">لم تقم برفع أي ملفات تجويد أو مناهج علمية بعد.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myLessons.map(lesson => (
                    <div key={lesson.id} className={`p-4 border rounded-xl transition-all ${isDark ? 'bg-[#172033] border-slate-800' : 'bg-slate-50 border-slate-100 hover:border-emerald-100'}`}>
                      <div className="flex justify-between items-start">
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${isDark ? 'bg-indigo-950/60 text-indigo-400 border border-indigo-900/40' : 'bg-indigo-100 text-indigo-800'}`}>درس تجويد</span>
                        <span className="text-[10px] text-slate-400">{new Date(lesson.createdAt).toLocaleDateString('ar-SA')}</span>
                      </div>
                      <h4 className={`font-extrabold text-sm mt-2 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{lesson.title}</h4>
                      <p className={`text-xs mt-1 line-clamp-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{lesson.description}</p>
                      <div className={`mt-4 pt-3 border-t flex justify-between items-center text-xs font-bold ${isDark ? 'border-slate-800 text-emerald-400' : 'border-slate-200/60 text-emerald-800'}`}>
                        <span>المرفق: {lesson.pdfFile}</span>
                        {lesson.videoLink && <span className="text-rose-500 flex items-center gap-1">🎥 شرح مرئي</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'grades' && (
          <div className="space-y-6" id="teacher-grades-tab">
            {/* Sub-Tab Navigation Bar */}
            <div className={`flex border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              <button
                onClick={() => setGradesSubTab('individual')}
                className={`flex items-center gap-2 px-5 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  gradesSubTab === 'individual'
                    ? 'border-emerald-600 text-emerald-600'
                    : 'border-transparent text-slate-400 hover:text-slate-250'
                }`}
              >
                <FileText className="h-4 w-4" />
                <span>رصد التقييمات الفردية للحصص</span>
              </button>
              <button
                onClick={() => setGradesSubTab('weekly-reports')}
                className={`flex items-center gap-2 px-5 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  gradesSubTab === 'weekly-reports'
                    ? 'border-emerald-600 text-emerald-600'
                    : 'border-transparent text-slate-400 hover:text-slate-255'
                }`}
              >
                <Mail className="h-4 w-4" />
                <span>التقارير الأسبوعية والرسوم البيانية والبريد 📊📩</span>
              </button>
            </div>

            {gradesSubTab === 'individual' ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Grading evaluation form */}
                <div className={`rounded-2xl border p-6 shadow-sm lg:col-span-1 h-fit ${isDark ? 'bg-[#121826] border-slate-850' : 'bg-white border-slate-100'}`}>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className={`text-lg font-bold flex items-center gap-1.5 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                      <PlusCircle className="h-5 w-5 text-indigo-500" />
                      <span>رصد تقييم جديد</span>
                    </h2>
                    <button
                      type="button"
                      onClick={() => setIsQuickEvalOpen(true)}
                      className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-400 dark:border dark:border-indigo-900/40 text-xs font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                    >
                      <span>⚡ تقييم سريع</span>
                    </button>
                  </div>
                  <form onSubmit={handleAddEvaluation} className="space-y-4">
                    <div>
                      <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>حدد الطالب المراد تقييمه *</label>
                      <select
                        value={evalStudent}
                        onChange={(e) => setEvalStudent(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg outline-none text-sm text-right ${isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-850'}`}
                        required
                      >
                        <option value="">-- اختر طالب --</option>
                        {allStudents.map(st => (
                          <option key={st.id} value={st.id}>{st.fullName}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>حصة التلاوة المجرى تقييمها *</label>
                      <select
                        value={evalSession}
                        onChange={(e) => setEvalSession(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg outline-none text-sm text-right ${isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-850'}`}
                        required
                      >
                        <option value="">-- اختر الحصة --</option>
                        {mySessions.map(s => (
                          <option key={s.id} value={s.id}>{s.title}</option>
                        ))}
                      </select>
                    </div>

                    {/* Grade parameters */}
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between items-center text-xs font-bold mb-1">
                          <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>دقة مخارج الحروف وقراءتها:</span>
                          <span className="font-mono text-emerald-500">{evalReading}%</span>
                        </div>
                        <input
                          type="range"
                          min="50"
                          max="100"
                          value={evalReading}
                          onChange={(e) => setEvalReading(parseInt(e.target.value))}
                          className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-center text-xs font-bold mb-1">
                          <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>دقة أحكام التجويد المطبقة:</span>
                          <span className="font-mono text-emerald-500">{evalTajweed}%</span>
                        </div>
                        <input
                          type="range"
                          min="50"
                          max="100"
                          value={evalTajweed}
                          onChange={(e) => setEvalTajweed(parseInt(e.target.value))}
                          className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-center text-xs font-bold mb-1">
                          <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>الطلاقة والسرعة المناسبة:</span>
                          <span className="font-mono text-emerald-500">{evalFluency}%</span>
                        </div>
                        <input
                          type="range"
                          min="50"
                          max="100"
                          value={evalFluency}
                          onChange={(e) => setEvalFluency(parseInt(e.target.value))}
                          className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                        />
                      </div>
                    </div>

                    <div>
                      <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>الملاحظات، التنبيهات، والتوجيهات</label>
                      <textarea
                        value={evalNotes}
                        onChange={(e) => setEvalNotes(e.target.value)}
                        placeholder="اكتب نصيحة تصحيحية للطالب هنا..."
                        rows={4}
                        className={`w-full px-3 py-2 border rounded-lg outline-none text-sm text-right focus:ring-2 focus:ring-emerald-500 ${isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'}`}
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-indigo-700 hover:bg-indigo-600 text-white font-bold py-2.5 rounded-xl cursor-pointer transition-all text-sm mt-2 shadow-md shadow-indigo-500/10"
                    >
                      تأكيد ورصد التقييم للتاريخ
                    </button>
                  </form>
                </div>

                {/* Evaluations History list */}
                <div className={`rounded-2xl border p-6 shadow-sm lg:col-span-2 ${isDark ? 'bg-[#121826] border-slate-850' : 'bg-white border-slate-100'}`}>
                  <h2 className={`text-lg font-bold mb-4 font-sans ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>تاريخ التقييمات المرصودة للطلاب</h2>
                  {evaluations.length === 0 ? (
                    <p className="text-slate-400 text-sm py-4">لا توجد تقييمات مرصودة حتى الآن.</p>
                  ) : (
                    <div className="space-y-4">
                      {evaluations.map(grade => (
                        <div key={grade.id} className={`p-4 border rounded-xl ${isDark ? 'bg-[#172033] border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                          <div className="flex justify-between items-start flex-wrap gap-2">
                            <div>
                              <h4 className={`font-extrabold text-sm flex items-center gap-1.5 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                                <UserIcon className="h-4 w-4 text-emerald-500" />
                                <span>الطالب: {grade.studentName}</span>
                              </h4>
                              <p className="text-xs text-slate-400 mt-1">الحصة: {grade.sessionTitle}</p>
                            </div>
                            <div className="bg-emerald-850 text-white font-mono text-sm px-3 py-1 rounded-xl font-bold">
                              المعدل: {grade.score}%
                            </div>
                          </div>
                          <div className={`mt-3 grid grid-cols-3 gap-2 text-[10px] font-bold p-2 rounded-lg border ${isDark ? 'bg-slate-900/40 border-slate-800 text-slate-300' : 'bg-white border-slate-100 text-slate-600'}`}>
                            <div>التلاوة: {grade.readingAccuracy}%</div>
                            <div>التجويد: {grade.tajweedAccuracy}%</div>
                            <div>الطلاقة: {grade.fluency}%</div>
                          </div>
                          {grade.notes && (
                            <p className={`text-xs mt-3 p-2.5 rounded-lg border leading-relaxed ${isDark ? 'bg-indigo-950/20 border-indigo-900/40 text-slate-300' : 'bg-indigo-50/50 border-indigo-100/40 text-slate-600'}`}>
                              <strong>ملاحظات فضيلة الشيخ: </strong>
                              <span>{grade.notes}</span>
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Weekly Reports Tab Layout
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="weekly-reports-subtab">
                {/* Composer Form Column */}
                <div className={`rounded-2xl border p-6 shadow-sm lg:col-span-1 h-fit ${isDark ? 'bg-[#121826] border-slate-850' : 'bg-white border-slate-100'}`}>
                  <h3 className={`text-base font-extrabold mb-4 flex items-center gap-2 ${isDark ? 'text-slate-100' : 'text-slate-850'}`}>
                    <Mail className="h-5 w-5 text-emerald-500" />
                    <span>توليد التقرير الأسبوعي الجديد</span>
                  </h3>
                  <form onSubmit={handleSendWeeklyReport} className="space-y-4">
                    <div>
                      <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>اختر الطالب *</label>
                      <select
                        value={selectedReportStudentId}
                        onChange={(e) => setSelectedReportStudentId(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg outline-none text-sm text-right ${isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'}`}
                        required
                      >
                        <option value="">-- اختر الطالب --</option>
                        {allStudents.map(st => (
                          <option key={st.id} value={st.id}>{st.fullName}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>تاريخ البداية *</label>
                        <input
                          type="date"
                          value={reportWeekStart}
                          onChange={(e) => setReportWeekStart(e.target.value)}
                          className={`w-full px-3 py-1.5 border rounded-lg outline-none text-xs text-right ${isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'}`}
                          required
                        />
                      </div>
                      <div>
                        <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>تاريخ النهاية *</label>
                        <input
                          type="date"
                          value={reportWeekEnd}
                          onChange={(e) => setReportWeekEnd(e.target.value)}
                          className={`w-full px-3 py-1.5 border rounded-lg outline-none text-xs text-right ${isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'}`}
                          required
                        />
                      </div>
                    </div>

                    {/* Weekly Performance Scores slider */}
                    <div className="space-y-3.5 pt-2 border-t border-dashed border-slate-150 dark:border-slate-800">
                      <div>
                        <div className="flex justify-between items-center text-xs font-bold mb-1">
                          <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>مستوى تقدم الحفظ (Memorization):</span>
                          <span className="font-mono text-emerald-600 dark:text-emerald-400">{reportMemorizationScore}%</span>
                        </div>
                        <input
                          type="range"
                          min="30"
                          max="100"
                          value={reportMemorizationScore}
                          onChange={(e) => setReportMemorizationScore(parseInt(e.target.value))}
                          className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-center text-xs font-bold mb-1">
                          <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>مستوى جودة المراجعة (Revision):</span>
                          <span className="font-mono text-emerald-600 dark:text-emerald-400">{reportRevisionScore}%</span>
                        </div>
                        <input
                          type="range"
                          min="30"
                          max="100"
                          value={reportRevisionScore}
                          onChange={(e) => setReportRevisionScore(parseInt(e.target.value))}
                          className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-center text-xs font-bold mb-1">
                          <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>مستوى تطبيق أحكام التجويد (Tajweed):</span>
                          <span className="font-mono text-emerald-600 dark:text-emerald-400">{reportTajweedScore}%</span>
                        </div>
                        <input
                          type="range"
                          min="30"
                          max="100"
                          value={reportTajweedScore}
                          onChange={(e) => setReportTajweedScore(parseInt(e.target.value))}
                          className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-dashed border-slate-150 dark:border-slate-800">
                      <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>توجيهات وملاحظات المعلم للبريد الإلكتروني</label>
                      <textarea
                        value={reportNotes}
                        onChange={(e) => setReportNotes(e.target.value)}
                        placeholder="اكتب التقييم والملاحظات التشجيعية التي ستصل الطالب على صندوق بريده..."
                        rows={4}
                        className={`w-full px-3 py-2 border rounded-lg outline-none text-xs text-right focus:ring-2 focus:ring-emerald-500 ${isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'}`}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={sendingReport}
                      className="w-full bg-emerald-600 hover:bg-emerald-550 text-white font-bold py-2.5 rounded-xl cursor-pointer transition-all text-xs flex justify-center items-center gap-1.5 shadow-md shadow-emerald-500/10 disabled:opacity-50"
                    >
                      {sendingReport ? (
                        <>
                          <Loader className="h-3.5 w-3.5 animate-spin" />
                          <span>جاري توليد وإرسال التقرير...</span>
                        </>
                      ) : (
                        <>
                          <Mail className="h-3.5 w-3.5" />
                          <span>إرسال التقرير الأسبوعي عبر البريد الإلكتروني 📩</span>
                        </>
                      )}
                    </button>
                  </form>

                  {/* Automated Reports Card */}
                  <div className={`mt-5 rounded-2xl border p-5 shadow-xs ${isDark ? 'bg-[#182235]/60 border-slate-800' : 'bg-emerald-50/40 border-emerald-100/70'}`}>
                    <h4 className={`text-xs font-extrabold mb-1 flex items-center gap-1.5 ${isDark ? 'text-slate-200' : 'text-emerald-800'}`}>
                      <Sparkles className="h-4 w-4 text-emerald-500 animate-pulse" />
                      <span>الأتمتة والتقارير الدورية الآلية ⚙️</span>
                    </h4>
                    <p className="text-slate-400 text-[10px] leading-relaxed mb-4">
                      يقوم النظام دورياً كل أسبوع باحتساب متوسط تقييمات الطلاب تلقائياً وتوليد تقارير أداء شاملة مع تمثيل بياني وإرسالها عبر البريد الإلكتروني. يمكنك تشغيل هذه الوظيفة الدورية يدوياً الآن لتحديث التقارير فوراً.
                    </p>
                    <button
                      type="button"
                      disabled={isTriggeringAuto}
                      onClick={handleTriggerAutoReports}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white text-[11px] font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isTriggeringAuto ? (
                        <span>جاري توليد وإرسال التقارير الآلية...</span>
                      ) : (
                        <>
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>تشغيل وتوليد التقارير الآلية للجميع 🚀</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Right Column (Trends chart and logs) */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Performance chart */}
                  <div className={`rounded-2xl border p-6 shadow-sm ${isDark ? 'bg-[#121826] border-slate-850' : 'bg-white border-slate-100'}`}>
                    <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                      <div>
                        <h3 className={`text-base font-extrabold flex items-center gap-1.5 ${isDark ? 'text-slate-100' : 'text-slate-850'}`}>
                          <TrendingUp className="h-5 w-5 text-emerald-500 animate-pulse" />
                          <span>رصد المنحنى البياني الأسبوعي للطالب</span>
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">يعرض الرسم البياني تطور درجات الطالب عبر الأسابيع المتعاقبة.</p>
                      </div>
                      {selectedReportStudentId && (
                        <span className="text-xs bg-emerald-600/10 text-emerald-600 font-bold px-2.5 py-1 rounded-full">
                          الطالب: {allStudents.find(s => s.id === selectedReportStudentId)?.fullName}
                        </span>
                      )}
                    </div>

                    {selectedReportStudentId ? (
                      (() => {
                        const studentReports = weeklyReports
                          .filter(r => r.studentId === selectedReportStudentId)
                          .sort((a, b) => a.weekStartDate.localeCompare(b.weekStartDate));

                        if (studentReports.length === 0) {
                          return (
                            <div className="text-center py-14 border border-dashed border-slate-200/50 rounded-xl">
                              <BarChart2 className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                              <p className="text-xs text-slate-400 font-bold">لم يتم إصدار أي تقارير أسبوعية لهذا الطالب بعد.</p>
                              <p className="text-[11px] text-slate-500 mt-1">ابدأ بملء النموذج ورصد التقرير الأسبوعي الأول له الآن.</p>
                            </div>
                          );
                        }

                        const data = studentReports.map((r, idx) => ({
                          name: `أسبوع ${idx + 1}`,
                          'الحفظ': r.memorizationScore,
                          'المراجعة': r.revisionScore,
                          'التجويد': r.tajweedScore,
                          'المعدل': r.overallScore,
                          range: `${r.weekStartDate} ~ ${r.weekEndDate}`
                        }));

                        return (
                          <div className="space-y-4">
                            <div className="h-64 w-full" dir="ltr">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#f1f5f9'} />
                                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                                  <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} />
                                  <Tooltip 
                                    contentStyle={{ 
                                      backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                                      borderColor: isDark ? '#334155' : '#e2e8f0',
                                      borderRadius: '8px',
                                      textAlign: 'right'
                                    }} 
                                  />
                                  <Legend wrapperStyle={{ fontSize: 11 }} />
                                  <Line name="الحفظ" type="monotone" dataKey="الحفظ" stroke="#10b981" strokeWidth={2.5} activeDot={{ r: 6 }} />
                                  <Line name="المراجعة" type="monotone" dataKey="المراجعة" stroke="#6366f1" strokeWidth={2.5} />
                                  <Line name="التجويد" type="monotone" dataKey="التجويد" stroke="#f59e0b" strokeWidth={2.5} />
                                  <Line name="المعدل" type="monotone" dataKey="المعدل" stroke="#f43f5e" strokeWidth={3} strokeDasharray="5 5" />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>

                            <div className="grid grid-cols-4 gap-2 text-center text-xs font-bold mt-2">
                              <div className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-emerald-600">
                                <span className="block text-[10px] opacity-70">أعلى علامة حفظ</span>
                                <span className="text-sm font-mono">{Math.max(...studentReports.map(r => r.memorizationScore))}%</span>
                              </div>
                              <div className="p-2.5 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-indigo-600">
                                <span className="block text-[10px] opacity-70">أعلى مراجعة</span>
                                <span className="text-sm font-mono">{Math.max(...studentReports.map(r => r.revisionScore))}%</span>
                              </div>
                              <div className="p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/10 text-amber-600">
                                <span className="block text-[10px] opacity-70">أعلى تجويد</span>
                                <span className="text-sm font-mono">{Math.max(...studentReports.map(r => r.tajweedScore))}%</span>
                              </div>
                              <div className="p-2.5 rounded-xl bg-rose-500/5 border border-rose-500/10 text-rose-600">
                                <span className="block text-[10px] opacity-70">المعدل العام</span>
                                <span className="text-sm font-mono">
                                  {Math.round(studentReports.reduce((acc, r) => acc + r.overallScore, 0) / studentReports.length)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <div className="text-center py-14 border border-dashed border-slate-200/50 rounded-xl">
                        <Users className="h-10 w-10 text-slate-300 mx-auto mb-2 animate-bounce" />
                        <p className="text-xs text-slate-400 font-bold">يرجى اختيار طالب من القائمة الجانبية لعرض منحناه البياني الأسبوعي.</p>
                      </div>
                    )}
                  </div>

                  {/* Mail Delivery Simulation Live Panel */}
                  {lastSentEmailPreview && (
                    <div className={`rounded-2xl border p-5 shadow-sm border-emerald-500/30 animate-fade-in ${isDark ? 'bg-emerald-950/10' : 'bg-emerald-50/10'}`}>
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                          <span>المحاكاة الفورية للبريد الإلكتروني المرسل:</span>
                        </div>
                        <button
                          onClick={() => setLastSentEmailPreview(null)}
                          className="text-[10px] text-slate-400 hover:text-slate-650 font-bold cursor-pointer"
                        >
                          إغلاق المعاينة ×
                        </button>
                      </div>
                      <div className={`p-4 rounded-xl border max-h-72 overflow-y-auto bg-white ${isDark ? 'border-slate-800' : 'border-slate-150'}`}>
                        <div className="text-[11px] font-bold text-slate-500 mb-3 text-right pb-2 border-b border-slate-100" dir="rtl">
                          <div><strong>إلى بريد الطالب:</strong> {lastSentEmailPreview.to}</div>
                          <div className="mt-1"><strong>العنوان:</strong> {lastSentEmailPreview.subject}</div>
                        </div>
                        <div dangerouslySetInnerHTML={{ __html: lastSentEmailPreview.bodyHTML }} />
                      </div>
                    </div>
                  )}

                  {/* History List of reports */}
                  <div className={`rounded-2xl border p-6 shadow-sm ${isDark ? 'bg-[#121826] border-[#1f293d]' : 'bg-white border-slate-100'}`}>
                    <h3 className={`text-base font-extrabold mb-4 flex items-center gap-1.5 ${isDark ? 'text-slate-100' : 'text-slate-850'}`}>
                      <FileText className="h-5 w-5 text-indigo-500" />
                      <span>تقارير الأداء الأسبوعية التي تم إرسالها سابقاً</span>
                    </h3>
                    
                    {(() => {
                      const reportsToShow = selectedReportStudentId 
                        ? weeklyReports.filter(r => r.studentId === selectedReportStudentId)
                        : weeklyReports;

                      if (reportsToShow.length === 0) {
                        return (
                          <p className="text-slate-400 text-xs py-4">لا توجد تقارير أسبوعية صادرة في الأرشيف حالياً.</p>
                        );
                      }

                      return (
                        <div className="space-y-4">
                          {reportsToShow.map(r => (
                            <div key={r.id} className={`p-4 rounded-xl border ${isDark ? 'bg-[#172033] border-slate-800' : 'bg-slate-50 border-slate-150'}`}>
                              <div className="flex justify-between items-start flex-wrap gap-2">
                                <div>
                                  <h4 className={`font-bold text-xs ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                                    تقرير الطالب: {r.studentName}
                                  </h4>
                                  <p className="text-[10px] text-slate-400 mt-0.5">
                                    الفترة: من {r.weekStartDate} إلى {r.weekEndDate}
                                  </p>
                                </div>
                                <div className="text-xs bg-emerald-600/10 text-emerald-600 font-bold px-2 py-0.5 rounded">
                                  المعدل الأسبوعي: {r.overallScore}%
                                </div>
                              </div>
                              <div className="mt-3 text-[10px] text-slate-400 font-bold grid grid-cols-3 gap-2">
                                <span>الحفظ: {r.memorizationScore}%</span>
                                <span>المراجعة: {r.revisionScore}%</span>
                                <span>التجويد: {r.tajweedScore}%</span>
                              </div>
                              {r.notes && (
                                <p className={`text-[11px] mt-2.5 p-2 rounded-lg border italic ${isDark ? 'bg-indigo-950/20 border-indigo-900/40 text-slate-300' : 'bg-indigo-50/40 border-indigo-100/40 text-slate-600'}`}>
                                  " {r.notes} "
                                </p>
                              )}
                              <div className="mt-2.5 pt-2 border-t border-slate-150 dark:border-slate-800 flex justify-between items-center text-[9px] text-slate-400">
                                <span>بواسطة المعلم: {r.teacherName}</span>
                                <span className="text-emerald-500">✓ تم الإرسال لمحاكاة البريد الإلكتروني بنجاح ({r.studentEmail})</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <ProfileEditor currentUser={currentUser} onUpdateUser={onUpdateUser} isDark={isDark} />
        )}

        {activeTab === 'advanced-search' && (
          <AdvancedSearch lessons={myLessons} isDark={isDark} />
        )}

        {activeTab === 'audio-review' && (
          <div className="space-y-6 text-right animate-fade-in" id="teacher-audio-review-tab">
            <div className={`p-6 rounded-2xl border ${isDark ? 'bg-[#121826] border-slate-850' : 'bg-white border-slate-100 shadow-sm'}`}>
              <div className="flex items-center gap-2.5 mb-6">
                <div className="h-10 w-10 bg-emerald-600/10 text-emerald-600 rounded-xl flex items-center justify-center font-bold">
                  <Mic className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">مراجعة وتصحيح التلاوات الصوتية المسجلة</h3>
                  <p className="text-xs text-slate-400 mt-1">استمع لتلاوات الطلاب المرفوعة، وقم بتدوين التوجيهات لتصحيح مخارج الحروف وقواعد التجويد لديهم.</p>
                </div>
              </div>

              {practiceClips.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-100 dark:border-slate-850 rounded-2xl">
                  <p className="text-xs text-slate-400 font-bold">لا توجد أي تسجيلات صوتية مرفوعة من الطلاب حتى الآن.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {practiceClips.map((clip: any) => {
                    const isPending = clip.status !== 'reviewed';
                    return (
                      <div 
                        key={clip.id} 
                        className={`p-5 rounded-2xl border transition-all ${
                          isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50/50 border-slate-100 shadow-2xs'
                        }`}
                      >
                        <div className="flex justify-between items-start flex-wrap gap-3 mb-4">
                          <div>
                            <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-1.5 inline-block">
                              الطالب: {clip.studentName}
                            </span>
                            <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{clip.title}</h4>
                            <p className="text-[10px] text-slate-400 mt-1">📅 تم الرفع: {new Date(clip.createdAt).toLocaleString('ar-EG')}</p>
                          </div>

                          <div>
                            {isPending ? (
                              <span className="text-[10px] font-bold px-2.5 py-1 bg-amber-500/10 text-amber-500 rounded-full border border-amber-500/20 animate-pulse">
                                ⏳ بانتظار تصحيحك وتقييمك
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
                                ✓ تم التقييم والتصحيح
                              </span>
                            )}
                          </div>
                        </div>

                        {clip.notes && (
                          <div className="p-3 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-150 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                            <strong>💬 سؤال/ملاحظة الطالب:</strong> {clip.notes}
                          </div>
                        )}

                        <div className="mb-4 bg-slate-100 dark:bg-slate-850 p-3 rounded-xl max-w-md">
                          <audio src={clip.audioUrl} controls className="w-full h-8" />
                        </div>

                        {/* Evaluation Input */}
                        {isPending ? (
                          <div className="space-y-3 pt-2">
                            <label className="block text-xs font-bold text-slate-400">كتابة تقييم التلاوة والتوجيهات المصححة:</label>
                            <textarea
                              rows={3}
                              placeholder="مثال: قراءة جيدة جداً بارك الله فيك، انتبه فقط لمد صلة الهاء في كلمة (بهِ) ومقدار حركتين..."
                              value={reviewText[clip.id] || ''}
                              onChange={(e) => setReviewText(prev => ({ ...prev, [clip.id]: e.target.value }))}
                              className={`w-full p-3 rounded-xl text-xs border outline-none resize-none font-medium ${
                                isDark 
                                  ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-emerald-500' 
                                  : 'bg-white border-slate-250 text-slate-850 focus:border-emerald-600'
                              }`}
                            />
                            <div className="flex justify-end">
                              <button
                                onClick={() => handleSubmitReview(clip.id)}
                                disabled={isSubmittingReview[clip.id]}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-550 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                              >
                                {isSubmittingReview[clip.id] ? 'جاري الحفظ...' : 'حفظ وإرسال التوجيهات للطالب 🎯'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-xs text-right mt-3 space-y-1">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                ✨ تقييمك المرصود:
                              </span>
                              {clip.teacherName && (
                                <span className="text-[10px] text-slate-400 font-medium">الشيخ المعلم: {clip.teacherName}</span>
                              )}
                            </div>
                            <p className="text-slate-750 dark:text-slate-300 leading-relaxed text-[11px] font-medium pr-1 whitespace-pre-line">
                              {clip.feedback}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'students-management' && (
          <div className="space-y-6 text-right animate-fade-in" id="teacher-students-management-tab">
            {/* رابط دعوة الطلاب للدراسة */}
            <div className={`rounded-2xl border p-6 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 ${isDark ? 'bg-[#121826] border-slate-850' : 'bg-white border-slate-100'}`}>
              <div>
                <h2 className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-slate-850'}`}>رابط دعوة الطلاب للتسجيل والدراسة معك</h2>
                <p className="text-slate-400 text-xs mt-1">شارك هذا الرابط مع طلابك الجدد للتسجيل مباشرة في المنصة وسيتم إلحاقهم بجميع دوراتك المقررة قيد الانتظار فور اعتماد حساباتهم</p>
              </div>
              <button
                onClick={() => {
                  const link = `${window.location.origin}/?register=student&teacherId=${currentUser.id}`;
                  navigator.clipboard.writeText(link);
                  showToast('📋 تم نسخ رابط دعوة الطلاب بنجاح!', 'success');
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-sm"
              >
                <span>نسخ رابط دعوتك كمعلم 🔗</span>
              </button>
            </div>

            {/* Pending Students approvals */}
            <div className={`rounded-2xl border p-6 shadow-sm ${isDark ? 'bg-[#121826] border-slate-850' : 'bg-white border-slate-100'}`}>
              <h2 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                <UserIcon className="h-5 w-5 text-amber-500" />
                <span>طلبات تسجيل الطلاب الجدد قيد المراجعة</span>
              </h2>

              {allUsers.filter(u => u.role === 'student' && u.status === 'pending').length === 0 ? (
                <p className="text-slate-400 text-sm py-4">لا توجد طلبات تسجيل معلقة حالياً.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-sm">
                    <thead>
                      <tr className={`border-b font-medium ${isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                        <th className="p-3">اسم الطالب</th>
                        <th className="p-3">رقم الهاتف</th>
                        <th className="p-3">المدينة</th>
                        <th className="p-3 text-center">القرار</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-slate-800 text-slate-300' : 'divide-slate-100 text-slate-700'}`}>
                      {allUsers
                        .filter(u => u.role === 'student' && u.status === 'pending')
                        .map(student => (
                          <tr key={student.id} className={isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50/50'}>
                            <td className="p-3 font-bold">{student.fullName}</td>
                            <td className="p-3 font-mono">{student.phone}</td>
                            <td className="p-3">{student.city || 'غير محدد'}</td>
                            <td className="p-3 flex justify-center gap-2">
                              <button onClick={() => handleApproveUser(student.id, 'approved')} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1">
                                <CheckCircle className="h-3.5 w-3.5" /> قبول وتفعيل
                              </button>
                              <button onClick={() => handleApproveUser(student.id, 'rejected')} className="bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1">
                                رفض
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pending Course Enrollments */}
            <div className={`rounded-2xl border p-6 shadow-sm ${isDark ? 'bg-[#121826] border-slate-850' : 'bg-white border-slate-100'}`}>
              <h2 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                <BookOpen className="h-5 w-5 text-indigo-500" />
                <span>طلبات الالتحاق المعلقة في دوراتك</span>
              </h2>

              {allEnrollments.filter(e => e.status === 'pending' && myCourses.map(c => c.id).includes(e.courseId)).length === 0 ? (
                <p className="text-slate-400 text-sm py-4">لا توجد طلبات التحاق بالدورات معلقة حالياً.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-sm">
                    <thead>
                      <tr className={`border-b font-medium ${isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                        <th className="p-3">اسم الطالب</th>
                        <th className="p-3">الدورة المطلوبة</th>
                        <th className="p-3 text-center">القرار</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-slate-800 text-slate-300' : 'divide-slate-100 text-slate-700'}`}>
                      {allEnrollments
                        .filter(e => e.status === 'pending' && myCourses.map(c => c.id).includes(e.courseId))
                        .map(enroll => (
                          <tr key={enroll.id} className={isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50/50'}>
                            <td className="p-3 font-bold">{enroll.studentName}</td>
                            <td className="p-3 text-emerald-600 font-medium">{enroll.courseName}</td>
                            <td className="p-3 flex justify-center gap-2">
                              <button onClick={() => handleApproveEnrollment(enroll.id, 'approved')} className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1">
                                <CheckCircle className="h-3.5 w-3.5" /> قبول التحاق
                              </button>
                              <button onClick={() => handleApproveEnrollment(enroll.id, 'rejected')} className="bg-rose-50 hover:bg-rose-100 text-rose-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1">
                                رفض
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Add Student manually to Course */}
            <div className={`rounded-2xl border p-6 shadow-sm ${isDark ? 'bg-[#121826] border-slate-850' : 'bg-white border-slate-100'}`}>
              <h2 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                <PlusCircle className="h-5 w-5 text-emerald-500" />
                <span>إضافة طالب إلى دورة مباشرة</span>
              </h2>
              <form onSubmit={handleAddStudentToCourse} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>اختر الدورة</label>
                    <select
                      value={addStudentCourseId}
                      onChange={(e) => setAddStudentCourseId(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg text-sm ${isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'}`}
                      required
                    >
                      <option value="">-- الدورة --</option>
                      {myCourses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>اختر الطالب</label>
                    <select
                      value={addStudentId}
                      onChange={(e) => setAddStudentId(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg text-sm ${isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'}`}
                      required
                    >
                      <option value="">-- الطالب المعتمد --</option>
                      {allUsers.filter(u => u.role === 'student' && u.status === 'approved').map(s => <option key={s.id} value={s.id}>{s.fullName} ({s.phone})</option>)}
                    </select>
                  </div>
                </div>
                <button type="submit" className="bg-emerald-600 text-white font-bold py-2.5 px-4 rounded-xl text-xs w-full mt-2 transition-colors hover:bg-emerald-500">
                  تسجيل الطالب المختار في الدورة
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* QUICK EVALUATION SLIDE-OVER DRAWER PANEL */}
      {isQuickEvalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden" dir="rtl">
          <div className="absolute inset-0 overflow-hidden">
            {/* Backdrop */}
            <div 
              onClick={() => setIsQuickEvalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300" 
            />

            {/* Slide-over Container */}
            <div className="pointer-events-none absolute inset-y-0 left-0 flex max-w-full">
              <div className={`pointer-events-auto w-screen max-w-md transform transition-transform duration-350 ease-out p-6 shadow-2xl flex flex-col h-full ${
                isDark ? 'bg-[#121826] border-r border-slate-800 text-slate-100' : 'bg-white border-r border-slate-100 text-slate-800'
              }`}>
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">⚡</span>
                    <div>
                      <h3 className="text-base font-extrabold font-sans">قوالب التقييم السريع المعتمدة</h3>
                      <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>اختر قالباً للتعبئة بضغطة واحدة</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsQuickEvalOpen(false)}
                    className={`h-8 w-8 rounded-full flex items-center justify-center border text-xs font-bold transition-all cursor-pointer ${
                      isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    ✕
                  </button>
                </div>

                {/* Templates list scroll area */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                  <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    هذه القوالب مصممة للمساعدة في رصد تقييم التلاوة والتجويد والطلاقة تلقائياً مع تدوين الملاحظات التوجيهية للطلاب بسرعة فائقة بعد انتهاء الجلسات الصوتية.
                  </p>

                  <div className="space-y-3 pt-2">
                    {FEEDBACK_TEMPLATES.map((tpl, i) => (
                      <div 
                        key={i}
                        className={`p-4 rounded-2xl border text-right text-xs transition-all cursor-pointer hover:scale-[1.01] ${
                          isDark 
                            ? 'bg-[#172033] border-slate-800 hover:border-indigo-500 hover:bg-[#1C2840]' 
                            : 'bg-slate-50 border-slate-200 hover:border-indigo-400 hover:bg-slate-100/70 shadow-2xs'
                        }`}
                        onClick={() => handleApplyTemplate(tpl)}
                      >
                        <h4 className="font-extrabold text-sm text-indigo-500 dark:text-indigo-400 mb-1">{tpl.name}</h4>
                        <p className={`text-[11px] mb-3 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{tpl.description}</p>
                        
                        {/* Scores preview */}
                        <div className={`grid grid-cols-3 gap-1 p-2 rounded-lg text-[10px] text-center font-bold mb-3 ${isDark ? 'bg-slate-900/60' : 'bg-white border border-slate-150'}`}>
                          <div>مخارج: {tpl.reading}%</div>
                          <div>تجويد: {tpl.tajweed}%</div>
                          <div>طلاقة: {tpl.fluency}%</div>
                        </div>

                        {/* Notes preview */}
                        <div className={`p-2 rounded-lg text-[10px] leading-relaxed border italic ${isDark ? 'bg-slate-950/45 border-slate-800 text-slate-300' : 'bg-white border-slate-100 text-slate-500'}`}>
                          <strong>نص التوجيه:</strong> {tpl.notes}
                        </div>

                        <div className="mt-3 flex justify-end">
                          <span className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-1 rounded-lg text-[10px] transition-colors">
                            تطبيق القالب ⚡
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-4 border-t border-slate-250 dark:border-slate-800 text-center text-[10px] text-slate-400 font-medium">
                  منصة مقرأة التجويد والقرآن الكريم المعتمدة
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
