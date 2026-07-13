import React, { useState, useRef } from 'react';
import { User as UserIcon, Mail, Phone, MapPin, Lock, Camera, Check, AlertCircle, Save, Shield } from 'lucide-react';
import { User } from '../types';
import { useToast } from './Toast';

interface ProfileEditorProps {
  currentUser: User;
  onUpdateUser: (user: User) => void;
  isDark?: boolean;
}

export default function ProfileEditor({ currentUser, onUpdateUser, isDark = false }: ProfileEditorProps) {
  const { showToast } = useToast();
  const [fullName, setFullName] = useState(currentUser.fullName);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(currentUser.email || '');
  const [city, setCity] = useState(currentUser.city || '');
  
  // 2FA States
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(currentUser.twoFactorEnabled || false);
  const [twoFactorType, setTwoFactorType] = useState<'app' | 'email' | 'sms'>(currentUser.twoFactorType || 'app');

  // Notification Channel Preferences States
  const [notifApp, setNotifApp] = useState(currentUser.notificationPreferences?.app ?? true);
  const [notifEmail, setNotifEmail] = useState(currentUser.notificationPreferences?.email ?? true);
  const [notifSms, setNotifSms] = useState(currentUser.notificationPreferences?.sms ?? false);

  // Per-Event Notification settings
  const [notifLiveSession, setNotifLiveSession] = useState({
    app: currentUser.notificationPreferences?.liveSession?.app ?? true,
    email: currentUser.notificationPreferences?.liveSession?.email ?? true,
    sms: currentUser.notificationPreferences?.liveSession?.sms ?? false,
  });

  const [notifEvaluation, setNotifEvaluation] = useState({
    app: currentUser.notificationPreferences?.evaluation?.app ?? true,
    email: currentUser.notificationPreferences?.evaluation?.email ?? true,
    sms: currentUser.notificationPreferences?.evaluation?.sms ?? false,
  });

  const [notifNewLesson, setNotifNewLesson] = useState({
    app: currentUser.notificationPreferences?.newLesson?.app ?? true,
    email: currentUser.notificationPreferences?.newLesson?.email ?? true,
    sms: currentUser.notificationPreferences?.newLesson?.sms ?? false,
  });

  const [notifWeeklyReport, setNotifWeeklyReport] = useState({
    app: currentUser.notificationPreferences?.weeklyReport?.app ?? true,
    email: currentUser.notificationPreferences?.weeklyReport?.email ?? true,
    sms: currentUser.notificationPreferences?.weeklyReport?.sms ?? false,
  });

  // Password fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Avatar / Photo state
  const [avatarBase64, setAvatarBase64] = useState<string | null>(currentUser.avatar || null);
  const [dragActive, setDragActive] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Read file as base64
  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('يرجى رفع ملف صورة فقط', 'error');
      return;
    }
    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      showToast('حجم الصورة يجب أن لا يتجاوز 2 ميجابايت', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarBase64(reader.result as string);
      showToast('تم تحميل الصورة بنجاح! يرجى الضغط على حفظ لحفظ التعديلات.', 'success');
    };
    reader.readAsDataURL(file);
  };

  // Drag and drop events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  // Submit profile edits
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Form validation
    if (!fullName || !phone) {
      setError('الاسم ورقم الهاتف حقول مطلوبة.');
      showToast('يرجى ملء الحقول الإلزامية', 'error');
      return;
    }

    // Password validation
    if (newPassword) {
      if (newPassword.length < 4) {
        setError('يجب أن تتكون كلمة المرور الجديدة من 4 خانات على الأقل.');
        showToast('كلمة مرور ضعيفة', 'warning');
        return;
      }
      if (newPassword !== confirmPassword) {
        setError('كلمة المرور الجديدة وتأكيدها غير متطابقين.');
        showToast('كلمتا المرور غير متطابقتين', 'error');
        return;
      }
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/users/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: currentUser.id,
          phone,
          email: email || undefined,
          city: city || undefined,
          avatar: avatarBase64 || undefined,
          password: newPassword || undefined,
          twoFactorEnabled,
          twoFactorType,
          notificationPreferences: {
            app: notifApp,
            email: notifEmail,
            sms: notifSms,
            liveSession: notifLiveSession,
            evaluation: notifEvaluation,
            newLesson: notifNewLesson,
            weeklyReport: notifWeeklyReport
          }
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'فشل تحديث البيانات الشخصية');
      }

      const data = await res.json();
      onUpdateUser(data.user);
      
      // Clear password fields on success
      setNewPassword('');
      setConfirmPassword('');
      
      showToast('تم حفظ تعديلات الملف الشخصي بنجاح!', 'success');
    } catch (err: any) {
      setError(err.message || 'حدث خطأ غير متوقع');
      showToast(err.message || 'حدث خطأ أثناء الحفظ', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={`p-6 rounded-3xl border shadow-sm transition-all text-right ${
      isDark ? 'bg-[#121826] border-slate-850' : 'bg-white border-slate-100'
    }`} id="profile-editor-root">
      
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
        <h3 className={`text-base font-extrabold flex items-center gap-2 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
          <UserIcon className="h-5 w-5 text-emerald-500" />
          <span>تحديث بيانات الملف الشخصي والاتصال ⚙️</span>
        </h3>
        <p className="text-slate-400 text-xs mt-1">تعديل بياناتك المسجلة وحفظ صورة رمزية لتظهر في الحلقات الصوتية والتقييمات.</p>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-700 p-4 rounded-xl mb-6 text-xs flex items-center gap-2 font-bold" id="profile-error">
          <AlertCircle className="h-4.5 w-4.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Photo Uploader Column (4 cols) */}
        <div className="lg:col-span-4 flex flex-col items-center space-y-4">
          <h4 className={`text-xs font-bold text-center w-full ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>الصورة الرمزية (اختياري)</h4>
          
          {/* Avatar frame */}
          <div className="relative group">
            {avatarBase64 ? (
              <img 
                src={avatarBase64} 
                alt="Profile" 
                className="h-32 w-32 rounded-full object-cover border-4 border-emerald-600 shadow-md referrerPolicy='no-referrer'" 
              />
            ) : (
              <div className="h-32 w-32 rounded-full bg-slate-100 dark:bg-slate-850 border-4 border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400">
                <UserIcon className="h-16 w-16" />
              </div>
            )}
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full shadow-lg transition-transform hover:scale-105 cursor-pointer"
              title="تغيير الصورة الرمزية"
            >
              <Camera className="h-4 w-4" />
            </button>
          </div>

          {/* Drag & Drop zone */}
          <div 
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`w-full p-4 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-colors ${
              dragActive 
                ? 'bg-emerald-50/20 border-emerald-500' 
                : isDark ? 'bg-slate-900/40 border-slate-800 hover:border-slate-750' : 'bg-slate-50/30 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span className="text-[10px] text-slate-400 block leading-relaxed">
              اسحب وأفلت صورتك هنا، أو <strong className="text-emerald-500 hover:underline">انقر لتحديد ملف</strong>
            </span>
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*"
              className="hidden" 
              onChange={handleFileChange}
            />
          </div>

          {avatarBase64 && (
            <button
              type="button"
              onClick={() => {
                setAvatarBase64(null);
                showToast('تمت إزالة الصورة الرمزية المؤقتة.', 'info');
              }}
              className="text-[10px] text-rose-500 hover:underline font-bold"
            >
              حذف الصورة الحالية
            </button>
          )}
        </div>

        {/* Inputs Column (8 cols) */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>الاسم الكامل (ثلاثي) *</label>
            <div className="relative">
              <span className="absolute right-3 top-3.5 text-slate-400">
                <UserIcon className="h-4 w-4" />
              </span>
              <input
                type="text"
                disabled
                value={fullName}
                className={`w-full text-xs font-bold px-3 py-3 pr-10 rounded-xl border cursor-not-allowed ${
                  isDark ? 'bg-slate-850 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-500'
                }`}
                title="لا يمكن تعديل الاسم، تواصل مع الإدارة لتعديله"
              />
            </div>
            <span className="text-[9px] text-slate-400 mt-1 block">تواصل مع المعلم أو الإدارة لتحديث الاسم.</span>
          </div>

          <div>
            <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>رقم الهاتف</label>
            <div className="relative">
              <span className="absolute right-3 top-3.5 text-slate-400">
                <Phone className="h-4 w-4" />
              </span>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={`w-full text-xs font-bold px-3 py-3 pr-10 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                  isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
                }`}
                placeholder="مثال: 07701234567"
              />
            </div>
          </div>

          <div>
            <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>البريد الإلكتروني</label>
            <div className="relative">
              <span className="absolute right-3 top-3.5 text-slate-400">
                <Mail className="h-4 w-4" />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full text-xs font-bold px-3 py-3 pr-10 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                  isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
                }`}
                placeholder="example@quran.com"
              />
            </div>
          </div>

          <div>
            <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>المحافظة / السكن</label>
            <div className="relative">
              <span className="absolute right-3 top-3.5 text-slate-400">
                <MapPin className="h-4 w-4" />
              </span>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className={`w-full text-xs font-bold px-3 py-3 pr-10 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                  isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
                }`}
                placeholder="مثال: بغداد، البصرة"
              />
            </div>
          </div>

          {/* Change Password Sub-Section */}
          <div className="sm:col-span-2 border-t border-slate-150 dark:border-slate-800/80 pt-4 mt-2">
            <h5 className={`text-xs font-extrabold flex items-center gap-1.5 mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <Lock className="h-4 w-4 text-emerald-500" />
              <span>تغيير كلمة المرور (اختياري)</span>
            </h5>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`block text-[11px] text-slate-400 mb-1.5`}>كلمة المرور الجديدة</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`w-full text-xs font-bold px-3 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                    isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
                  }`}
                  placeholder="اتركها فارغة لعدم التغيير"
                />
              </div>

              <div>
                <label className={`block text-[11px] text-slate-400 mb-1.5`}>تأكيد كلمة المرور الجديدة</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full text-xs font-bold px-3 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                    isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
                  }`}
                  placeholder="تأكيد كلمة المرور"
                />
              </div>
            </div>
          </div>

          {/* Notification Channel Preferences Sub-Section */}
          <div className="sm:col-span-2 border-t border-slate-150 dark:border-slate-800/80 pt-5 mt-2">
            <h5 className={`text-xs font-extrabold flex items-center gap-1.5 mb-2.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <span>🔔 إدارة وتخصيص قنوات التنبيهات والأحداث</span>
            </h5>
            <p className="text-slate-400 text-[10px] mb-4">
              قم بتخصيص قنوات الإشعارات (داخل التطبيق، البريد الإلكتروني، أو رسائل SMS) المفضلة لديك لكل نوع من الأحداث والأنشطة بشكل منفصل:
            </p>

            {/* Event-specific channel selection matrix */}
            <div className={`overflow-hidden rounded-2xl border ${isDark ? 'bg-[#182235]/30 border-slate-800' : 'bg-slate-50/45 border-slate-100'}`}>
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className={`border-b ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-100/50 border-slate-200/60'}`}>
                      <th className="p-3 font-extrabold text-slate-700 dark:text-slate-200">نوع الحدث / النشاط الأكاديمي</th>
                      <th className="p-3 text-center font-extrabold text-slate-700 dark:text-slate-200">إشعارات داخل التطبيق (In-App)</th>
                      <th className="p-3 text-center font-extrabold text-slate-700 dark:text-slate-200">البريد الإلكتروني (Email)</th>
                      <th className="p-3 text-center font-extrabold text-slate-700 dark:text-slate-200">رسائل الجوال (SMS)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 dark:divide-slate-800">
                    {/* Event 1: Live Sessions */}
                    <tr>
                      <td className="p-3 font-bold text-slate-800 dark:text-slate-300">
                        <span className="block">📅 حلقات التلاوة المباشرة</span>
                        <span className="text-[9px] text-slate-400 font-normal">عند جدولة حلقة صوتية تفاعلية جديدة أو بدئها</span>
                      </td>
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={notifLiveSession.app}
                          onChange={(e) => setNotifLiveSession(prev => ({ ...prev, app: e.target.checked }))}
                          className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={notifLiveSession.email}
                          onChange={(e) => setNotifLiveSession(prev => ({ ...prev, email: e.target.checked }))}
                          className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={notifLiveSession.sms}
                          onChange={(e) => setNotifLiveSession(prev => ({ ...prev, sms: e.target.checked }))}
                          className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                        />
                      </td>
                    </tr>

                    {/* Event 2: Evaluations */}
                    <tr>
                      <td className="p-3 font-bold text-slate-800 dark:text-slate-300">
                        <span className="block">📝 درجات التقييمات الفردية</span>
                        <span className="text-[9px] text-slate-400 font-normal">عند رصد الشيخ لدرجات الحفظ والتجويد ومخارج الحروف</span>
                      </td>
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={notifEvaluation.app}
                          onChange={(e) => setNotifEvaluation(prev => ({ ...prev, app: e.target.checked }))}
                          className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={notifEvaluation.email}
                          onChange={(e) => setNotifEvaluation(prev => ({ ...prev, email: e.target.checked }))}
                          className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={notifEvaluation.sms}
                          onChange={(e) => setNotifEvaluation(prev => ({ ...prev, sms: e.target.checked }))}
                          className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                        />
                      </td>
                    </tr>

                    {/* Event 3: New Lessons */}
                    <tr>
                      <td className="p-3 font-bold text-slate-800 dark:text-slate-300">
                        <span className="block">📖 المناهج والدروس التعليمية</span>
                        <span className="text-[9px] text-slate-400 font-normal">عند قيام الإدارة بإضافة مواد تجويد أو مقاطع شرح جديدة</span>
                      </td>
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={notifNewLesson.app}
                          onChange={(e) => setNotifNewLesson(prev => ({ ...prev, app: e.target.checked }))}
                          className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={notifNewLesson.email}
                          onChange={(e) => setNotifNewLesson(prev => ({ ...prev, email: e.target.checked }))}
                          className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={notifNewLesson.sms}
                          onChange={(e) => setNotifNewLesson(prev => ({ ...prev, sms: e.target.checked }))}
                          className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                        />
                      </td>
                    </tr>

                    {/* Event 4: Weekly Performance Reports */}
                    <tr>
                      <td className="p-3 font-bold text-slate-800 dark:text-slate-300">
                        <span className="block">📊 التقارير الأسبوعية الدورية</span>
                        <span className="text-[9px] text-slate-400 font-normal">عند إصدار الملخصات البيانية الشاملة للأداء التراكمي</span>
                      </td>
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={notifWeeklyReport.app}
                          onChange={(e) => setNotifWeeklyReport(prev => ({ ...prev, app: e.target.checked }))}
                          className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={notifWeeklyReport.email}
                          onChange={(e) => setNotifWeeklyReport(prev => ({ ...prev, email: e.target.checked }))}
                          className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={notifWeeklyReport.sms}
                          onChange={(e) => setNotifWeeklyReport(prev => ({ ...prev, sms: e.target.checked }))}
                          className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 2FA Settings Sub-Section */}
          <div className="sm:col-span-2 border-t border-slate-150 dark:border-slate-800/80 pt-5 mt-2">
            <h5 className={`text-xs font-extrabold flex items-center gap-1.5 mb-2.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <Shield className="h-4.5 w-4.5 text-emerald-500" />
              <span>🔐 نظام التوثيق الثنائي (2FA) لزيادة الأمان</span>
            </h5>
            <p className="text-slate-400 text-[10px] mb-3">تأمين حسابك بشكل كامل عبر تفعيل التوثيق الثنائي لفرض إدخال رمز أمان عشوائي مؤقت عند كل عملية تسجيل دخول.</p>
            <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className={`text-xs font-bold block ${isDark ? 'text-slate-200' : 'text-slate-850'}`}>حالة المصادقة الثنائية (2FA Status)</span>
                  <span className="text-[10px] text-slate-400">عند التفعيل، سيُطلب رمز تحقق إضافي في الخطوة الثانية للتسجيل الدخول</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !twoFactorEnabled;
                    setTwoFactorEnabled(nextVal);
                    showToast(nextVal ? 'تم تفعيل التوثيق الثنائي! يرجى اختيار القناة والضغط على حفظ.' : 'تم إلغاء تفعيل المصادقة الثنائية.', nextVal ? 'success' : 'info');
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    twoFactorEnabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      twoFactorEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {twoFactorEnabled && (
                <div className="pt-3.5 border-t border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="block text-[11px] text-slate-400 font-bold">قناة إرسال رمز التحقق (Verification Channel):</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { id: 'app', label: 'تطبيق المصادقة (App TOTP)' },
                      { id: 'email', label: 'البريد الإلكتروني (Email)' },
                      { id: 'sms', label: 'رسائل الجوال القصيرة (SMS)' }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setTwoFactorType(opt.id as any);
                          showToast(`تم اختيار قناة: ${opt.label}`, 'info');
                        }}
                        className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                          twoFactorType === opt.id
                            ? 'bg-emerald-600/10 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                            : 'bg-white dark:bg-slate-850 border-slate-250 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-400'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="sm:col-span-2 pt-4 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="h-4.5 w-4.5" />
              <span>{isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات بالملف'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
