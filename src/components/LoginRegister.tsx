/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, KeyRound, Phone, MapPin, UserCheck, Mail, Calendar, HelpCircle } from 'lucide-react';

interface LoginRegisterProps {
  onLoginSuccess: (user: any) => void;
}

export default function LoginRegister({ onLoginSuccess }: LoginRegisterProps) {
  const [isLogin, setIsLogin] = useState(true);

  // Login form state
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [password, setPassword] = useState('');

  // Registration state
  const [regFullName, setRegFullName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regCity, setRegCity] = useState('');
  const [regGender, setRegGender] = useState('Male');
  const [regAge, setRegAge] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // 2FA login verification states
  const [require2FA, setRequire2FA] = useState(false);
  const [twoFactorType, setTwoFactorType] = useState<'app' | 'email' | 'sms'>('email');
  const [twoFactorUserId, setTwoFactorUserId] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [simulatedCode, setSimulatedCode] = useState('');
  const [registeredUserId, setRegisteredUserId] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(`/start ${registeredUserId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Invited teacher & forced role states
  const [invitedTeacher, setInvitedTeacher] = useState<{ id: string; fullName: string } | null>(null);
  const [forcedRole, setForcedRole] = useState<'teacher' | 'student' | null>(null);
  const [botName, setBotName] = useState('StudyQuranbot');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const registerParam = params.get('register');
    const teacherIdParam = params.get('teacherId') || params.get('teacher');

    if (registerParam === 'teacher') {
      setForcedRole('teacher');
      setIsLogin(false);
    } else if (registerParam === 'student') {
      setForcedRole('student');
      setIsLogin(false);
    }

    if (teacherIdParam) {
      fetch(`/api/users/public-info/${teacherIdParam}`)
        .then(res => {
          if (res.ok) return res.json();
          throw new Error('Teacher not found');
        })
        .then(data => {
          if (data && data.role === 'teacher') {
            setInvitedTeacher(data);
            setForcedRole('student'); // Force student role if registering through a teacher invite
            setIsLogin(false);
          }
        })
        .catch(err => console.error(err));
    }
    fetch('/api/telegram/bot-info')
      .then(res => {
        if (res.ok) return res.json();
        throw new Error();
      })
      .then(data => {
        if (data && data.botName) {
          setBotName(data.botName);
        }
      })
      .catch(() => { });
  }, []);

  const handleLogin = async (e?: React.FormEvent, customPhone?: string, customPass?: string) => {
    if (e) e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    const targetPhone = customPhone || phoneOrEmail;
    const targetPass = customPass || password;

    if (!targetPhone || !targetPass) {
      setError('يرجى ملء جميع الحقول المطلوبة');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneOrEmail: targetPhone, password: targetPass })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'خطأ في عملية تسجيل الدخول');
      }

      if (data.require2FA) {
        setRequire2FA(true);
        setTwoFactorType(data.twoFactorType);
        setTwoFactorUserId(data.userId);
        setSimulatedCode(data.code || '');
        setMessage('يتطلب حسابك رمز تحقق ثنائي لتسجيل الدخول.');
        return;
      }

      onLoginSuccess(data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    if (!verificationCode) {
      setError('يرجى إدخال رمز التحقق');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: twoFactorUserId, code: verificationCode })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'رمز التحقق غير صحيح أو منتهي الصلاحية');
      }

      setMessage('تم تسجيل الدخول بنجاح!');
      onLoginSuccess(data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    if (!regFullName || !regPhone || !regPassword || !regGender) {
      setError('يرجى ملء جميع الحقول الأساسية المميزة بنجمة (*)');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: regFullName,
          phone: regPhone,
          email: regEmail,
          password: regPassword,
          city: regCity,
          gender: regGender,
          age: regAge,
          role: forcedRole || 'student',
          invitedByTeacherId: invitedTeacher?.id || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'خطأ أثناء عملية التسجيل');
      }

      setMessage(data.message);
      if (data.student && data.student.id) {
        setRegisteredUserId(data.student.id);
      }
      setIsLogin(true);
      // Pre-fill the login field
      setPhoneOrEmail(regPhone);
      setPassword(regPassword);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-[#121826] rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden text-right transition-colors duration-300" dir="rtl">
      {/* Accent Header */}
      <div className="bg-white dark:bg-[#121826] border-b border-slate-100 dark:border-slate-800/80 px-6 py-8 text-center transition-colors duration-300">
        <h2 className="text-2xl font-bold font-sans text-slate-800 dark:text-slate-105">بوابة القرآن الكريم والدروس الحوزوية</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5 font-medium">المنصة التعليمية الشاملة لتعليم التلاوة والتجويد والدروس الحوزوية</p>
      </div>

      <div className="p-6">
        {/* Toggle tabs */}
        {!require2FA && (
          <div className="flex border border-slate-100 dark:border-slate-800 mb-6 bg-slate-50 dark:bg-slate-900/35 p-1.5 rounded-2xl gap-2 transition-colors">
            <button
              id="tab-login"
              onClick={() => { setIsLogin(true); setError(''); setMessage(''); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${isLogin ? 'bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-400 shadow-sm border border-slate-100 dark:border-slate-700 font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-450'
                }`}
            >
              تسجيل دخول
            </button>
            <button
              id="tab-register"
              onClick={() => { setIsLogin(false); setError(''); setMessage(''); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${!isLogin ? 'bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-400 shadow-sm border border-slate-100 dark:border-slate-700 font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-450'
                }`}
            >
              إنشاء حساب جديد
            </button>
          </div>
        )}

        {error && (
          <div id="auth-error-alert" className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 text-sm p-4 rounded-xl mb-4 flex items-start gap-2 leading-relaxed">
            <span>⚠️</span>
            <div className="flex-1">{error}</div>
          </div>
        )}

        {message && (
          <div id="auth-message-alert" className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-400 text-sm p-4.5 rounded-xl mb-4 flex flex-col gap-3.5 leading-relaxed text-right">
            <div className="flex items-start gap-2">
              <span className="text-base">✅</span>
              <div className="flex-1 font-bold">{message}</div>
            </div>
            {registeredUserId && (
              <div className="space-y-3 pt-1">
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                  لإتمام عملية التسجيل وتلقي الإشعارات الفورية (مثل إشعار قبول حسابك وتنبيهات الحلقات)، يرجى ربط حسابك ببوت التيليجرام:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <a
                    href={`https://t.me/${botName}?start=${registeredUserId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 bg-[#0088cc] hover:bg-[#007ab8] text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-sm text-xs"
                  >
                    <span>🔗 الرابط الرئيسي (t.me)</span>
                  </a>
                  <a
                    href={`https://telegram.me/${botName}?start=${registeredUserId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-sm text-xs"
                  >
                    <span>🔗 رابط بديل (telegram.me)</span>
                  </a>
                </div>

                <div className="bg-white/45 dark:bg-slate-900/40 p-3.5 rounded-2xl border border-emerald-250/30 dark:border-emerald-800/20 text-xs text-slate-700 dark:text-slate-300 space-y-2 mt-2 leading-relaxed">
                  <div className="font-extrabold text-[11px] text-emerald-800 dark:text-emerald-450">💡 في حال عدم استجابة الروابط (أو حجب الخدمة في بلدك):</div>
                  <ol className="list-decimal list-inside text-[11px] space-y-1 pr-1">
                    <li>افتح تطبيق تيليجرام وابحث عن البوت: <strong className="select-all font-mono">@{botName}</strong></li>
                    <li>اضغط على زر **ابدأ / Start**</li>
                    <li>أرسل كود الربط التالي للبوت كرسالة عادية:</li>
                  </ol>
                  <div className="flex gap-2 items-center mt-2.5 bg-white dark:bg-slate-950 p-2 rounded-xl border border-slate-200 dark:border-slate-800 justify-between">
                    <code className="font-mono text-xs text-emerald-700 dark:text-emerald-400 select-all font-bold pr-1">/start {registeredUserId}</code>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer shadow-sm shrink-0"
                    >
                      {copied ? '✓ تم النسخ!' : 'نسخ الكود'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {require2FA ? (
          /* TWO FACTOR AUTHENTICATION FORM */
          <form id="verify-2fa-form" onSubmit={handleVerify2FA} className="space-y-5 text-right">
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 p-4 rounded-2xl text-center">
              <span className="text-2xl block mb-1">🛡️</span>
              <h3 className="text-xs font-bold text-emerald-800 dark:text-emerald-400">حماية إضافية لحسابك</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                تم تفعيل نظام التحقق ثنائي الأمان لزيادة أمان المنصة. تم إرسال رمز الأمان إلى قناتك المفضلة: <strong>{twoFactorType === 'app' ? 'تطبيق التوثيق (Google Authenticator)' : twoFactorType === 'email' ? 'البريد الإلكتروني' : 'رسائل الجوال SMS'}</strong>.
              </p>
              {simulatedCode && (
                <div className="mt-3 p-2 bg-emerald-600/10 dark:bg-emerald-400/10 border border-emerald-500/25 dark:border-emerald-500/20 rounded-xl text-xs inline-block">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block">رمز التحقق للتجربة السريعة والمحاكاة:</span>
                  <span className="font-mono text-lg font-extrabold text-emerald-700 dark:text-emerald-400 tracking-widest">{simulatedCode}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-slate-350 mb-1.5 text-right">أدخل رمز الأمان (6 أرقام) *</label>
              <input
                type="text"
                placeholder="------"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="w-full text-center tracking-widest font-mono text-xl py-2.5 rounded-xl border border-gray-250 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-555 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'جاري التحقق والمصادقة...' : 'تأكيد الرمز وتسجيل الدخول 🎯'}
            </button>

            <button
              type="button"
              onClick={() => {
                setRequire2FA(false);
                setError('');
                setMessage('');
                setVerificationCode('');
              }}
              className="w-full text-center text-xs text-slate-400 hover:text-slate-600 font-bold mt-1 block"
            >
              الرجوع للشاشة السابقة
            </button>
          </form>
        ) : isLogin ? (
          /* LOGIN FORM */
          <form id="login-form" onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">رقم الهاتف أو البريد الإلكتروني *</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="مثال: 07701234567"
                  value={phoneOrEmail}
                  onChange={(e) => setPhoneOrEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none pr-10 text-right text-sm transition-colors"
                  required
                />
                <Phone className="absolute right-3 top-3.5 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">كلمة المرور *</label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="أدخل كلمة المرور الخاصة بك"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none pr-10 text-right text-sm transition-colors"
                  required
                />
                <KeyRound className="absolute right-3 top-3.5 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <button
              type="submit"
              id="login-submit-btn"
              disabled={loading}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white font-bold rounded-xl shadow-lg shadow-emerald-100 dark:shadow-none transition-all cursor-pointer mt-2 text-sm"
            >
              {loading ? 'جاري التحقق...' : 'دخول للمنصة 📖'}
            </button>
          </form>
        ) : (
          /* REGISTRATION FORM */
          <form id="register-form" onSubmit={handleRegister} className="space-y-4">
            {forcedRole === 'teacher' && (
              <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-450 p-3.5 rounded-2xl text-xs font-semibold leading-relaxed mb-4">
                👨‍🏫 أنت الآن تسجل حساباً بصفة <strong>معلم / أستاذ حوزوي</strong>. سيخضع حسابك لمراجعة واعتماد الإدارة قبل التفعيل.
              </div>
            )}

            {invitedTeacher && (
              <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/50 text-indigo-850 dark:text-indigo-400 p-3.5 rounded-2xl text-xs font-semibold leading-relaxed mb-4">
                📖 أنت تسجل الآن للدراسة تحت إشراف فضيلة الشيخ/الأستاذ: <strong>{invitedTeacher.fullName}</strong>. سيتم ربط حسابك وطلبات التحاقك بحلقاته تلقائياً فور اعتماد حسابك.
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                {forcedRole === 'teacher' ? 'الاسم الكامل للمعلم *' : 'الاسم الكامل للطالب *'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="الاسم الرباعي الكامل"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none pr-10 text-right text-sm transition-colors"
                  required
                />
                <User className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">رقم الهاتف الجوال *</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="مثال: 07701234567"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-right text-sm transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">المحافظة والمنطقة</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="مثال: بغداد"
                    value={regCity}
                    onChange={(e) => setRegCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-right text-sm transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">الجنس *</label>
                <select
                  value={regGender}
                  onChange={(e) => setRegGender(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-right text-sm transition-colors"
                  required
                >
                  <option value="Male" className="dark:bg-slate-800">ذكر</option>
                  <option value="Female" className="dark:bg-slate-800">أنثى</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">العمر بالسنوات</label>
                <input
                  type="number"
                  placeholder="مثال: 22"
                  value={regAge}
                  onChange={(e) => setRegAge(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-right text-sm transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">البريد الإلكتروني (اختياري)</label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none pr-10 text-right text-sm transition-colors"
                />
                <Mail className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">كلمة مرور الحساب *</label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="يجب ألا تقل عن 6 رموز"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none pr-10 text-right text-sm transition-colors"
                  required
                />
                <KeyRound className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <button
              type="submit"
              id="register-submit-btn"
              disabled={loading}
              className="w-full py-3 px-4 bg-emerald-650 hover:bg-emerald-750 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white font-bold rounded-xl shadow-lg shadow-emerald-100 dark:shadow-none transition-all cursor-pointer text-sm mt-2"
            >
              {loading ? 'جاري تسجيل الطلب...' : 'تسجيل وإرسال الطلب للمراجعة ✨'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
