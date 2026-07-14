/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BookOpen, BookText, FileText, Sparkles, Check, LogOut, HelpCircle, ShieldAlert, Sun, Moon, ChevronDown, ChevronUp, WifiOff, X, MessageSquareCode } from 'lucide-react';
import LoginRegister from './components/LoginRegister';
import AdminDashboard from './components/AdminDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import StudentDashboard from './components/StudentDashboard';
import VoiceClassroom from './components/VoiceClassroom';
import DocsViewer from './components/DocsViewer';
import { User } from './types';
import { useToast } from './components/Toast';

export default function App() {
  const { showToast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [showDocs, setShowDocs] = useState(false);
  const [systemNotifications, setSystemNotifications] = useState<any[]>([]);
  const [openFaq, setOpenFaq] = useState<Record<number, boolean>>({});
  const [adminViewMode, setAdminViewMode] = useState<'admin' | 'teacher'>('admin');

  // Internet connection status states
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [showOfflineBanner, setShowOfflineBanner] = useState<boolean>(true);

  // Feedback modal states
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);
  const [feedbackType, setFeedbackType] = useState<'bug' | 'feature' | 'other'>('bug');
  const [feedbackSubject, setFeedbackSubject] = useState<string>('');
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');
  const [submittingFeedback, setSubmittingFeedback] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineBanner(true);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Theme state (defaults to dark if not set)
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    return saved === null ? true : saved === 'dark';
  });

  useEffect(() => {
    if (isDark) {
      localStorage.setItem('theme', 'dark');
      document.documentElement.classList.add('dark');
    } else {
      localStorage.setItem('theme', 'light');
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Fetch in-app notifications if a user is logged in
  const fetchUserNotifications = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/notifications/${currentUser.id}`);
      if (res.ok) {
        const list = await res.json();
        setSystemNotifications(list);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUserNotifications();
    let interval: any;
    if (currentUser) {
      interval = setInterval(fetchUserNotifications, 5000);
    }
    return () => clearInterval(interval);
  }, [currentUser]);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setShowDocs(false); // return to dashboard view on login
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveSessionId(null);
    setShowDocs(false);
    setAdminViewMode('admin');
  };

  const markNotificationRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/read/${id}`, { method: 'PUT' });
      if (res.ok) {
        fetchUserNotifications();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackSubject.trim() || !feedbackMessage.trim()) {
      showToast('يرجى ملء جميع الحقول المطلوبة', 'warning');
      return;
    }
    setSubmittingFeedback(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id || 'anonymous',
          userName: currentUser?.fullName || 'زائر مجهول',
          userRole: currentUser?.role || 'student',
          type: feedbackType,
          subject: feedbackSubject,
          message: feedbackMessage
        })
      });
      if (res.ok) {
        showToast('🎯 تم إرسال ملاحظاتك بنجاح! شكراً لك على المساهمة في تطوير المقرأة.', 'success');
        setFeedbackSubject('');
        setFeedbackMessage('');
        setShowFeedbackModal(false);
      } else {
        const err = await res.json();
        showToast(err.error || 'فشل في إرسال الملاحظة', 'error');
      }
    } catch (err: any) {
      showToast('حدث خطأ في الشبكة أثناء إرسال الملاحظة', 'error');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  // If a live room is active, render the Voice Classroom view immediately
  if (activeSessionId && currentUser) {
    return (
      <VoiceClassroom
        sessionId={activeSessionId}
        currentUser={currentUser}
        onExit={() => setActiveSessionId(null)}
      />
    );
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900 transition-colors duration-300 ${isDark ? 'bg-[#0B0F19] text-slate-150' : 'bg-[#F9FBFC] text-slate-800'}`} dir="rtl" id="app-root-container">
      {/* Offline Banner */}
      {!isOnline && showOfflineBanner && (
        <div className="bg-rose-600 text-white px-4 py-3 text-sm flex justify-between items-center transition-all animate-in fade-in slide-in-from-top-4" id="offline-connection-banner">
          <div className="flex items-center gap-2.5 mx-auto max-w-7xl w-full">
            <WifiOff className="h-5 w-5 animate-pulse shrink-0" />
            <span className="text-right flex-1">
              <strong>تنبيه انقطاع الاتصال:</strong> تم اكتشاف انقطاع في الاتصال بالإنترنت. يرجى التحقق من الشبكة الخاصة بك. علمًا بأن ميزات المقرأة والحلقات الصوتية المباشرة غير متوفرة مؤقتًا حتى عودة الاتصال.
            </span>
            <button 
              onClick={() => setShowOfflineBanner(false)}
              className="p-1 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer shrink-0"
              aria-label="إغلاق التنبيه"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Global Arabic Navigation bar */}
      <header className={`border-b sticky top-0 z-50 px-6 py-4 shadow-sm transition-colors duration-300 ${isDark ? 'bg-[#121826] border-slate-850 text-slate-100' : 'bg-white border-slate-100 text-slate-800'}`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-4 flex-wrap text-right">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-100/20">
              <span className="text-white text-xl font-bold font-serif leading-none">📖</span>
            </div>
            <div>
              <h1 className={`text-base font-extrabold flex items-center gap-1 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                <span>منصة القرآن الكريم والدروس الحوزوية</span>
                <Sparkles className="h-4 w-4 text-emerald-500 animate-pulse" />
              </h1>
              <p className={`text-[10px] font-medium tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>تعليم التلاوة، قواعد التجويد، ومباحث الفقه والأصول والمنطق</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Send Feedback Button */}
            <button
              id="header-feedback-btn"
              onClick={() => setShowFeedbackModal(true)}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl cursor-pointer transition-all border ${
                isDark 
                  ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750' 
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
              }`}
              title="إرسال اقتراح أو الإبلاغ عن مشكلة"
            >
              <MessageSquareCode className="h-4 w-4 text-amber-600" />
              <span>إرسال ملاحظة/اقتراح</span>
            </button>

            {/* Theme Switcher Toggle */}
            <button
              id="theme-toggle-btn"
              onClick={() => setIsDark(!isDark)}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer shadow-sm flex items-center justify-center ${
                isDark 
                  ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700' 
                  : 'bg-slate-50 border-slate-200 text-indigo-750 hover:bg-slate-100'
              }`}
              title={isDark ? "تفعيل الوضع المضيء" : "تفعيل الوضع الليلي للقراءة الليلية 🌙"}
            >
              {isDark ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </button>

            {/* Global Deliverables Switch */}
            {currentUser && currentUser.role === 'admin' && (
              <button
                id="global-docs-toggle-btn"
                onClick={() => setShowDocs(!showDocs)}
                className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer transition-all border ${
                  showDocs
                    ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg'
                    : isDark 
                      ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' 
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                <FileText className="h-4 w-4" />
                <span>مخرجات المشروع البرمجية (MySQL/PHP MVC)</span>
              </button>
            )}

            {/* View Mode Toggle Switch */}
            {currentUser && currentUser.role === 'admin' && (
              <button
                id="admin-view-mode-toggle-btn"
                onClick={() => setAdminViewMode(adminViewMode === 'admin' ? 'teacher' : 'admin')}
                className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer transition-all border ${
                  adminViewMode === 'teacher'
                    ? 'bg-amber-600 border-amber-500 text-white shadow-lg'
                    : isDark
                      ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                <span>🔄 التبديل إلى لوحة {adminViewMode === 'admin' ? 'المعلم' : 'المدير'}</span>
              </button>
            )}

            {currentUser && (
              <div className="flex items-center gap-2">
                <span className={`text-xs hidden sm:inline ${isDark ? 'text-slate-400' : 'text-slate-650'}`}>مرحباً، <strong>{currentUser.fullName}</strong></span>
                <button
                  id="header-logout-btn"
                  onClick={handleLogout}
                  className={`p-2 rounded-xl transition-all border cursor-pointer shadow-sm ${
                    isDark 
                      ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' 
                      : 'bg-white hover:bg-slate-50 text-slate-650 border-slate-200'
                  }`}
                  title="تسجيل الخروج"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1">
        {/* Render Deliverables if Docs mode is active */}
        {showDocs && currentUser && currentUser.role === 'admin' ? (
          <div className="max-w-7xl mx-auto px-6 py-8" id="docs-viewer-wrapper">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
              <div>
                <h2 className={`text-2xl font-black ${isDark ? 'text-slate-105' : 'text-slate-800'}`}>الأكواد وملفات التثبيت والمستندات المطلوبة</h2>
                <p className="text-slate-500 text-xs mt-1">تضم الأكواد المصدرية والمخططات الكاملة لبيئة MySQL وبنية PHP MVC وبوت تليجرام</p>
              </div>
              <button
                onClick={() => setShowDocs(false)}
                className={`text-xs font-bold border px-4 py-2 rounded-xl transition-all cursor-pointer shadow-sm ${
                  isDark 
                    ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' 
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                العودة إلى التطبيق الرئيسي ↩️
              </button>
            </div>
            <DocsViewer />
          </div>
        ) : !currentUser ? (
          /* Landing page with auth forms */
          <div className="max-w-7xl mx-auto px-6 py-12" id="landing-page">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-6 text-slate-800 text-right pr-0 lg:pr-8">
                <span className={`text-xs font-bold px-3.5 py-1.5 rounded-full border ${isDark ? 'bg-emerald-950/45 border-emerald-900 text-emerald-400' : 'bg-emerald-50 border-emerald-100 text-emerald-800'}`}>القرآن الكريم والدروس الحوزوية لتعليم الأجيال ✨</span>
                <h2 className={`text-3xl md:text-5xl font-extrabold tracking-tight leading-tight font-sans ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                  المنصة الذكية لتدريس القرآن <br className="hidden md:inline" />
                  والتجويد والدروس الحوزوية
                </h2>
                <p className={`text-sm md:text-base leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  منظومة متكاملة لتعليم القرآن الكريم وقواعد التجويد برواياته بالإضافة إلى المباحث والدروس الحوزوية والفقهية بربط صوتي مباشر فوري، مع إمكانية التقييم التلقائي وتوجيه الشيوخ والأساتذة.
                </p>

                {/* Core capabilities list */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 text-right">
                  <div className={`p-5 border rounded-2xl shadow-sm flex gap-3 hover:shadow-md transition-shadow ${isDark ? 'bg-[#121826] border-slate-850' : 'bg-white border-slate-100'}`}>
                    <div className="h-10 w-10 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold flex-shrink-0">🎤</div>
                    <div>
                      <h4 className={`font-bold text-sm ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>مقرأة وفصول صوتية حية</h4>
                      <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>غرف WebRTC لتنظيم وتدريس التلاوة ومباحث الدروس الحوزوية مباشرة مع الأساتذة والشيوخ.</p>
                    </div>
                  </div>

                  <div className={`p-5 border rounded-2xl shadow-sm flex gap-3 hover:shadow-md transition-shadow ${isDark ? 'bg-[#121826] border-slate-850' : 'bg-white border-slate-100'}`}>
                    <div className="h-10 w-10 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold flex-shrink-0">🤖</div>
                    <div>
                      <h4 className={`font-bold text-sm ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>مساعد تعليمي ذكي</h4>
                      <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>مدعوم بـ Gemini AI لشرح وتبسيط أحكام التجويد والدروس والمسائل الحوزوية.</p>
                    </div>
                  </div>

                  <div className={`p-5 border rounded-2xl shadow-sm flex gap-3 hover:shadow-md transition-shadow ${isDark ? 'bg-[#121826] border-slate-850' : 'bg-white border-slate-100'}`}>
                    <div className="h-10 w-10 bg-amber-50 dark:bg-amber-950/40 rounded-xl flex items-center justify-center text-amber-700 dark:text-amber-400 font-bold flex-shrink-0">📝</div>
                    <div>
                      <h4 className={`font-bold text-sm ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>نظام رصد درجات وتقييم</h4>
                      <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>تتبع دقة التلاوة، طلاقة اللفظ وملاحظات الشيخ لكل آية مخصصة.</p>
                    </div>
                  </div>

                  <div className={`p-5 border rounded-2xl shadow-sm flex gap-3 hover:shadow-md transition-shadow ${isDark ? 'bg-[#121826] border-slate-850' : 'bg-white border-slate-100'}`}>
                    <div className="h-10 w-10 bg-teal-50 dark:bg-teal-950/40 rounded-xl flex items-center justify-center text-teal-700 dark:text-teal-400 font-bold flex-shrink-0">📂</div>
                    <div>
                      <h4 className={`font-bold text-sm ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>هيكلية API جاهزة للتليجرام</h4>
                      <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>هندسة برمجية متينة ومخرجات MySQL MVC لربطها ببوت تليجرام مستقبلاً.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5" id="auth-box-wrapper">
                <LoginRegister onLoginSuccess={handleLoginSuccess} />
              </div>
            </div>

            {/* ❓ Frequently Asked Questions Section */}
            <div className={`mt-20 border-t pt-14 ${isDark ? 'border-slate-850' : 'border-slate-200/60'}`} id="faq-section">
              <div className="text-center space-y-2 mb-10">
                <span className="text-[11px] font-bold px-3.5 py-1.5 rounded-full border bg-emerald-950/40 border-emerald-900/50 text-emerald-400">
                  الأسئلة الشائعة والاستفسارات ❓
                </span>
                <h3 className="text-2xl font-black text-slate-100">هل لديك استفسار عن المنصة؟</h3>
                <p className="text-xs text-slate-400 max-w-xl mx-auto">
                  جمعنا لكم أبرز الأسئلة المتكررة حول كيفية التسجيل واستخدام غرف المقارئ والتقييم لمساعدتكم في الانطلاق والتعليم.
                </p>
              </div>

              <div className="max-w-3xl mx-auto space-y-3.5">
                {[
                  {
                    q: "كيف يمكنني التسجيل كطالب في المنصة؟",
                    a: "يمكنك التسجيل بسهولة عبر اختيار 'حساب طالب جديد' في نموذج التسجيل، وملء البيانات الأساسية مثل الاسم، الهاتف، وكلمة المرور. بعد إتمام طلبك، سيقوم المعلمون أو الإدارة بمراجعة طلبك والموافقة عليه لتتمكن من الانضمام للحلقات."
                  },
                  {
                    q: "هل المنصة مجانية بالكامل؟",
                    a: "نعم، المنصة مجانية بالكامل ووقفية، وتهدف لخدمة كتاب الله وتسهيل تعليمه وقراءته بأحكام التجويد الصحيحة لكل راغب في التعلم."
                  },
                  {
                    q: "كيف يمكنني الدخول والمشاركة في المقرأة الصوتية؟",
                    a: "بمجرد قبول حسابك، ادخل للوحة التحكم لتجد الحلقات المجدولة. عندما يقوم الشيخ ببث الحلقة، سيظهر لك زر 'انضم للدرس واستمع الآن'. داخل الغرفة، يمكنك طلب إذن القراءة من المعلم لقراءة الآيات المخصصة بصوتك والحصول على تقييم فوري."
                  },
                  {
                    q: "ما هو المساعد الذكي وأحكام التجويد المتاحة؟",
                    a: "توفر المنصة مساعداً ذكياً مبنياً على تقنيات الذكاء الاصطناعي (Gemini AI). يمكنك سؤاله عن أي حكم من أحكام النون الساكنة والتنوين والمخارج والصفات، ليقدم لك شرحاً وافياً وأمثلة تطبيقية واضحة ومبسطة."
                  },
                  {
                    q: "كيف يتم تقييم أدائي وكيف أحصل على الأوسمة؟",
                    a: "خلال الحلقات الصوتية الحية، يقوم الشيخ برصد درجاتك في ثلاثة محاور رئيسية: دقة القراءة، إتقان التجويد، والطلاقة. وبناءً على معدل حضورك ودرجاتك، يقوم النظام تلقائياً بمنحك أوسمة تشجيعية تظهر بملفك الشخصي!"
                  }
                ].map((item, index) => {
                  const isExpanded = !!openFaq[index];
                  return (
                    <div 
                      key={index} 
                      className={`border rounded-2xl overflow-hidden transition-all duration-200 ${
                        isExpanded 
                          ? isDark ? 'bg-[#121826]/85 border-emerald-500/50' : 'bg-emerald-50/20 border-emerald-400/40 shadow-sm' 
                          : isDark ? 'bg-[#121826]/40 border-slate-800 hover:border-slate-700' : 'bg-white/10 border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <button
                        onClick={() => setOpenFaq(prev => ({ ...prev, [index]: !prev[index] }))}
                        className="w-full flex justify-between items-center p-4.5 text-right cursor-pointer gap-4 focus:outline-none"
                        style={{ color: '#ffffff' }}
                      >
                        <span className="text-sm font-extrabold">
                          {item.q}
                        </span>
                        <span className={`p-1.5 rounded-lg border transition-colors flex-shrink-0 ${
                          isExpanded 
                            ? 'bg-emerald-500 border-emerald-400 text-white' 
                            : 'bg-slate-800 border-slate-700 text-slate-400'
                        }`}>
                          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        </span>
                      </button>
                      
                      {isExpanded && (
                        <div className="px-4.5 pb-4.5 text-xs leading-relaxed border-t border-dashed border-slate-700" style={{ color: '#94a3b8' }}>
                          {item.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* Role-based logged in dashboards */
          <div id="dashboard-wrapper">
            {/* Real-time floating Notification system */}
            {systemNotifications.filter(n => !n.read).length > 0 && (
              <div className="max-w-7xl mx-auto px-6 pt-6" id="unread-notifications-scroller">
                <div className={`border p-4 rounded-xl text-xs flex justify-between items-center flex-wrap gap-2 ${isDark ? 'bg-emerald-950/30 border-emerald-900/65 text-emerald-400' : 'bg-emerald-900/10 border-emerald-900/30 text-emerald-850'}`}>
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className="h-2 w-2 bg-emerald-500 rounded-full animate-ping" />
                    <span>تنبيهات غير مقروءة بانتظارك:</span>
                    <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{systemNotifications.filter(n => !n.read)[0].title} - {systemNotifications.filter(n => !n.read)[0].message}</span>
                  </div>
                  <button
                    onClick={() => markNotificationRead(systemNotifications.filter(n => !n.read)[0].id)}
                    className="text-emerald-800 dark:text-emerald-400 hover:underline font-bold bg-white dark:bg-slate-800 px-2.5 py-1 rounded border border-emerald-200 dark:border-emerald-800 cursor-pointer"
                  >
                    تحديد كقروء
                  </button>
                </div>
              </div>
            )}

            {/* Dashboards Routing */}
            {currentUser.role === 'admin' && (
              adminViewMode === 'admin' ? (
                <AdminDashboard
                  currentUser={currentUser}
                  onLogout={handleLogout}
                />
              ) : (
                <TeacherDashboard
                  currentUser={currentUser}
                  onLogout={handleLogout}
                  onLaunchClassroom={(sessionId) => setActiveSessionId(sessionId)}
                  isDark={isDark}
                  onUpdateUser={setCurrentUser}
                />
              )
            )}

            {currentUser.role === 'teacher' && (
              <TeacherDashboard
                currentUser={currentUser}
                onLogout={handleLogout}
                onLaunchClassroom={(sessionId) => setActiveSessionId(sessionId)}
                isDark={isDark}
                onUpdateUser={setCurrentUser}
              />
            )}

            {currentUser.role === 'student' && (
              <StudentDashboard
                currentUser={currentUser}
                onLogout={handleLogout}
                onJoinClassroom={(sessionId) => setActiveSessionId(sessionId)}
                isDark={isDark}
                onUpdateUser={setCurrentUser}
              />
            )}
          </div>
        )}
      </main>

      {/* Global Footer */}
      <footer className={`py-6 text-center border-t text-xs mt-12 shadow-sm transition-colors duration-300 ${isDark ? 'bg-[#121826] border-slate-850 text-slate-400' : 'bg-white border-slate-100 text-slate-500'}`}>
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© {new Date().getFullYear()} منصة تعليم القرآن الكريم وتدريس العلوم الحوزوية. جميع الحقوق محفوظة.</p>
          <div className="flex gap-4">
            <button
              onClick={() => setShowDocs(true)}
              className={`transition-colors cursor-pointer font-medium ${isDark ? 'text-slate-400 hover:text-emerald-400' : 'text-slate-500 hover:text-emerald-700'}`}
            >
              مستندات المشروع و SQL Scripts
            </button>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="text-emerald-600 font-mono font-medium">بيئة Full-Stack (React 19 + Express 4 + Node 22)</span>
          </div>
        </div>
      </footer>

      {/* Quick Feedback Modal Dialog */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-250" id="quick-feedback-modal">
          <div className={`relative w-full max-w-lg rounded-2xl shadow-2xl p-6 border transition-all duration-300 scale-95 animate-in zoom-in-95 ${
            isDark ? 'bg-[#121826] border-slate-800 text-slate-100' : 'bg-white border-slate-150 text-slate-800'
          }`}>
            <button
              onClick={() => setShowFeedbackModal(false)}
              className="absolute top-4 left-4 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="إغلاق النافذة"
            >
              <X className="h-5 w-5 text-slate-400" />
            </button>

            <div className="mb-5 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-500">
                <MessageSquareCode className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-right">إرسال ملاحظة سريعة أو اقتراح</h3>
                <p className="text-xs text-slate-400 mt-0.5 text-right">ساعدنا في تحسين المنصة من خلال الإبلاغ عن المشاكل أو طلب الميزات الجديدة.</p>
              </div>
            </div>

            <form onSubmit={handleSubmitFeedback} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1.5 text-slate-400 text-right">نوع الملاحظة <span className="text-rose-500">*</span></label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 'bug', label: '🐛 مشكلة برمجية' },
                    { val: 'feature', label: '💡 اقتراح ميزة' },
                    { val: 'other', label: '❓ استفسار عام' }
                  ].map(t => (
                    <button
                      key={t.val}
                      type="button"
                      onClick={() => setFeedbackType(t.val as any)}
                      className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                        feedbackType === t.val
                          ? 'bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-500/10'
                          : isDark
                            ? 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="feedback-subject" className="block text-xs font-bold mb-1.5 text-slate-400 text-right">موضوع الرسالة <span className="text-rose-500">*</span></label>
                <input
                  id="feedback-subject"
                  type="text"
                  required
                  placeholder="مثال: مشكلة في البث الصوتي أو اقتراح قسم مراجعة"
                  value={feedbackSubject}
                  onChange={(e) => setFeedbackSubject(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium border outline-none text-right transition-all ${
                    isDark 
                      ? 'bg-slate-800/40 border-slate-700 focus:border-emerald-500 text-slate-100' 
                      : 'bg-white border-slate-200 focus:border-emerald-600 text-slate-850'
                  }`}
                />
              </div>

              <div>
                <label htmlFor="feedback-message" className="block text-xs font-bold mb-1.5 text-slate-400 text-right">التفاصيل والوصف <span className="text-rose-500">*</span></label>
                <textarea
                  id="feedback-message"
                  required
                  rows={4}
                  placeholder="يرجى كتابة تفاصيل المشكلة أو المقترح بوضوح..."
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium border outline-none text-right transition-all resize-none ${
                    isDark 
                      ? 'bg-slate-800/40 border-slate-700 focus:border-emerald-500 text-slate-100' 
                      : 'bg-white border-slate-200 focus:border-emerald-600 text-slate-850'
                  }`}
                />
              </div>

              <div className="flex gap-2.5 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowFeedbackModal(false)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                    isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submittingFeedback}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-550 text-white font-bold text-xs shadow-lg shadow-emerald-500/10 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {submittingFeedback ? 'جاري الإرسال...' : 'إرسال الملاحظة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
