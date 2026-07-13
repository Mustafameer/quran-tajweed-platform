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
    <div className="max-w-md mx-auto bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden text-right" dir="rtl">
      {/* Accent Header */}
      <div className="bg-white border-b border-slate-100 px-6 py-8 text-center">
        <h2 className="text-2xl font-bold font-sans text-slate-800">بوابة القرآن الكريم والتجويد</h2>
        <p className="text-slate-500 text-sm mt-1.5 font-medium">المنصة التعليمية الشاملة لتعليم تلاوة وأحكام التجويد</p>
      </div>

      <div className="p-6">
        {/* Toggle tabs */}
        {!require2FA && (
          <div className="flex border border-slate-100 mb-6 bg-slate-50 p-1.5 rounded-2xl gap-2">
            <button
              id="tab-login"
              onClick={() => { setIsLogin(true); setError(''); setMessage(''); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${isLogin ? 'bg-white text-emerald-800 shadow-sm border border-slate-100 font-bold' : 'text-slate-500 hover:text-emerald-700'
                }`}
            >
              تسجيل دخول
            </button>
            <button
              id="tab-register"
              onClick={() => { setIsLogin(false); setError(''); setMessage(''); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${!isLogin ? 'bg-white text-emerald-800 shadow-sm border border-slate-100 font-bold' : 'text-slate-500 hover:text-emerald-700'
                }`}
            >
              إنشاء حساب جديد
            </button>
          </div>
        )}

        {error && (
          <div id="auth-error-alert" className="bg-rose-50 border border-rose-200 text-rose-700 text-sm p-4 rounded-xl mb-4 flex items-start gap-2 leading-relaxed">
            <span>⚠️</span>
            <div className="flex-1">{error}</div>
          </div>
        )}

        {message && (
          <div id="auth-message-alert" className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm p-4 rounded-xl mb-4 flex flex-col gap-3 leading-relaxed">
            <div className="flex items-start gap-2">
              <span>✅</span>
              <div className="flex-1">{message}</div>
            </div>
            {registeredUserId && (
              <a
                href={`https://t.me/${botName}?start=${registeredUserId}`}
                target="_blank"
                rel="noreferrer"
                className="w-full bg-[#0088cc] hover:bg-[#007ab8] text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-sm text-xs"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.223-.548.223l.188-2.85 5.18-4.68c.223-.198-.054-.309-.346-.11l-6.4 4.02-2.76-.86c-.6-.188-.61-.6.126-.89L17.2 7.03c.69-.26 1.28.16 1.093 1.19z" /></svg>
                اضغط هنا لربط حسابك بتيليجرام (إشعار فوري للقبول)
              </a>
            )}
          </div>
        )}

        {require2FA ? (
          /* TWO FACTOR AUTHENTICATION FORM */
          <form id="verify-2fa-form" onSubmit={handleVerify2FA} className="space-y-5 text-right">
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-center">
              <span className="text-2xl block mb-1">🛡️</span>
              <h3 className="text-xs font-bold text-emerald-800">حماية إضافية لحسابك</h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                تم تفعيل نظام التحقق ثنائي الأمان لزيادة أمان المنصة. تم إرسال رمز الأمان إلى قناتك المفضلة: <strong>{twoFactorType === 'app' ? 'تطبيق التوثيق (Google Authenticator)' : twoFactorType === 'email' ? 'البريد الإلكتروني' : 'رسائل الجوال SMS'}</strong>.
              </p>
              {simulatedCode && (
                <div className="mt-3 p-2 bg-emerald-600/10 border border-emerald-500/25 rounded-xl text-xs inline-block">
                  <span className="text-[10px] text-slate-500 font-bold block">رمز التحقق للتجربة السريعة والمحاكاة:</span>
                  <span className="font-mono text-lg font-extrabold text-emerald-700 tracking-widest">{simulatedCode}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 text-right">أدخل رمز الأمان (6 أرقام) *</label>
              <input
                type="text"
                placeholder="------"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="w-full text-center tracking-widest font-mono text-xl py-2.5 rounded-xl border border-gray-250 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
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
              <label className="block text-sm font-medium text-gray-700 mb-1.5">رقم الهاتف أو البريد الإلكتروني *</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="مثال: 07701234567"
                  value={phoneOrEmail}
                  onChange={(e) => setPhoneOrEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none pr-10 text-right text-sm"
                  required
                />
                <Phone className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">كلمة المرور *</label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="أدخل كلمة المرور الخاصة بك"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none pr-10 text-right text-sm"
                  required
                />
                <KeyRound className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <button
              type="submit"
              id="login-submit-btn"
              disabled={loading}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white font-bold rounded-xl shadow-lg shadow-emerald-100 transition-all cursor-pointer mt-2 text-sm"
            >
              {loading ? 'جاري التحقق...' : 'دخول للمنصة 📖'}
            </button>
          </form>
        ) : (
          /* REGISTRATION FORM */
          <form id="register-form" onSubmit={handleRegister} className="space-y-4">
            {forcedRole === 'teacher' && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-805 p-3.5 rounded-2xl text-xs font-semibold leading-relaxed mb-4">
                👨‍🏫 أنت الآن تسجل حساباً بصفة <strong>معلم / شيخ مقرأة</strong>. سيخضع حسابك لمراجعة واعتماد الإدارة قبل التفعيل.
              </div>
            )}

            {invitedTeacher && (
              <div className="bg-indigo-50 border border-indigo-200 text-indigo-850 p-3.5 rounded-2xl text-xs font-semibold leading-relaxed mb-4">
                📖 أنت تسجل الآن للدراسة تحت إشراف فضيلة الشيخ: <strong>{invitedTeacher.fullName}</strong>. سيتم ربط حسابك وطلبات التحاقك بحلقاته تلقائياً فور اعتماد حسابك.
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {forcedRole === 'teacher' ? 'الاسم الكامل للمعلم *' : 'الاسم الكامل للطالب *'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="الاسم الرباعي الكامل"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none pr-10 text-right text-sm"
                  required
                />
                <User className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف الجوال *</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="مثال: 07701234567"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-right text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المحافظة والمنطقة</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="مثال: بغداد"
                    value={regCity}
                    onChange={(e) => setRegCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-right text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الجنس *</label>
                <select
                  value={regGender}
                  onChange={(e) => setRegGender(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white text-right text-sm"
                  required
                >
                  <option value="Male">ذكر</option>
                  <option value="Female">أنثى</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">العمر بالسنوات</label>
                <input
                  type="number"
                  placeholder="مثال: 22"
                  value={regAge}
                  onChange={(e) => setRegAge(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-right text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني (اختياري)</label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none pr-10 text-right text-sm"
                />
                <Mail className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">كلمة مرور الحساب *</label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="يجب ألا تقل عن 6 رموز"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none pr-10 text-right text-sm"
                  required
                />
                <KeyRound className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <button
              type="submit"
              id="register-submit-btn"
              disabled={loading}
              className="w-full py-3 px-4 bg-emerald-650 hover:bg-emerald-750 disabled:bg-slate-200 text-white font-bold rounded-xl shadow-lg shadow-emerald-100 transition-all cursor-pointer text-sm mt-2"
            >
              {loading ? 'جاري تسجيل الطلب...' : 'تسجيل وإرسال الطلب للمراجعة ✨'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
