import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Calendar as CalendarIcon, Clock, Play, CheckCircle } from 'lucide-react';
import { Session } from '../types';

interface MonthlyCalendarProps {
  sessions: Session[];
  onAction?: (sessionId: string) => void;
  isDark?: boolean;
  actionLabel?: string;
}

const MONTHS_AR = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

const WEEKDAYS_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export default function MonthlyCalendar({ sessions, onAction, isDark = false, actionLabel = 'دخول' }: MonthlyCalendarProps) {
  // Initialize to the current real system date dynamically
  const [currentDate, setCurrentDate] = useState(new Date()); 
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  // Calculate days in the month
  const getDaysInMonth = (y: number, m: number) => {
    return new Date(y, m + 1, 0).getDate();
  };

  // Calculate first weekday of the month (0 = Sunday, 1 = Monday, ...)
  const getFirstDayOfMonth = (y: number, m: number) => {
    return new Date(y, m, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayOfMonth(year, month);

  // Navigate Months
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDay(1);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDay(1);
  };

  // Check if a session is scheduled on a specific day of the current navigated month
  const getSessionsForDay = (dayNum: number): Session[] => {
    const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    return sessions.filter(session => session.date === dayStr);
  };

  // Generate complete calendar grid array including padding
  const totalCells: (number | null)[] = [];
  
  // preceding empty slots
  for (let i = 0; i < firstDayIndex; i++) {
    totalCells.push(null);
  }
  
  // actual month days
  for (let d = 1; d <= daysInMonth; d++) {
    totalCells.push(d);
  }

  const selectedDaySessions = getSessionsForDay(selectedDay);

  return (
    <div className={`p-5 rounded-3xl border shadow-sm transition-all text-right ${
      isDark ? 'bg-[#121826] border-slate-850' : 'bg-white border-slate-100'
    }`} id="monthly-calendar-root" dir="rtl">
      
      {/* Calendar Header with Month/Year Navigation */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-emerald-600/10 text-emerald-500 flex items-center justify-center">
            <CalendarIcon className="h-4.5 w-4.5" />
          </div>
          <div>
            <h4 className={`text-sm font-extrabold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
              جدول الحلقات المنهجية المجدولة
            </h4>
            <p className="text-[10px] text-slate-400">تصفح الحلقات اليومية ومواعيد البث المباشر</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handlePrevMonth}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ChevronRight className="h-4.5 w-4.5" />
          </button>
          
          <span className={`text-xs font-extrabold px-3 py-1 rounded-lg border ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-slate-100 border-slate-200 text-slate-800'
          }`}>
            {MONTHS_AR[month]} {year}
          </span>

          <button
            onClick={handleNextMonth}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ChevronLeft className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Calendar Grid (8 Columns) */}
        <div className="md:col-span-8">
          {/* Weekday Names */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {WEEKDAYS_AR.map((day, idx) => (
              <span key={idx} className={`text-[10px] font-bold py-1.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                {day}
              </span>
            ))}
          </div>

          {/* Calendar Day Cells */}
          <div className="grid grid-cols-7 gap-1.5">
            {totalCells.map((day, index) => {
              if (day === null) {
                return (
                  <div 
                    key={`empty-${index}`} 
                    className="aspect-square rounded-xl bg-transparent" 
                  />
                );
              }

              const daySessions = getSessionsForDay(day);
              const isSelected = selectedDay === day;
              
              // Status of day based on sessions
              const hasLive = daySessions.some(s => s.status === 'live');
              const hasScheduled = daySessions.some(s => s.status === 'scheduled');
              const hasCompleted = daySessions.some(s => s.status === 'completed');

              let badgeColor = '';
              if (hasLive) badgeColor = 'bg-rose-500 ring-4 ring-rose-500/10';
              else if (hasScheduled) badgeColor = 'bg-amber-500';
              else if (hasCompleted) badgeColor = 'bg-slate-400';

              return (
                <button
                  key={`day-${day}`}
                  onClick={() => setSelectedDay(day)}
                  className={`aspect-square rounded-xl border flex flex-col items-center justify-between p-1.5 relative cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-500/10 font-bold scale-[1.03]'
                      : daySessions.length > 0
                        ? isDark ? 'bg-emerald-950/20 border-emerald-900/60 text-emerald-400 hover:bg-emerald-950/40' : 'bg-emerald-50/60 border-emerald-100 text-emerald-800 hover:bg-emerald-100/60'
                        : isDark ? 'bg-[#172033]/40 border-slate-800 text-slate-400 hover:border-slate-700' : 'bg-slate-50/30 border-slate-100 text-slate-600 hover:bg-slate-100/40'
                  }`}
                >
                  <span className="text-xs">{day}</span>
                  
                  {/* Status dot indicator */}
                  {daySessions.length > 0 && (
                    <div className="flex gap-0.5 justify-center mt-1">
                      {daySessions.slice(0, 3).map((sess, sIdx) => (
                        <span 
                          key={sess.id} 
                          className={`h-1 w-1 rounded-full ${
                            sess.status === 'live' 
                              ? 'bg-rose-500 animate-pulse' 
                              : sess.status === 'scheduled' 
                                ? 'bg-amber-500' 
                                : 'bg-slate-400'
                          }`} 
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Day Sessions Inspector (4 Columns) */}
        <div className="md:col-span-4">
          <div className={`p-4 rounded-2xl border text-right space-y-4 h-full flex flex-col justify-between ${
            isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50/50 border-slate-100'
          }`}>
            <div>
              <div className="border-b border-slate-200 dark:border-slate-800 pb-3 mb-3 flex justify-between items-center flex-wrap gap-2">
                <h5 className={`text-xs font-extrabold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                  حلقات يوم: {selectedDay} {MONTHS_AR[month]}
                </h5>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  selectedDaySessions.length > 0
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 border-emerald-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200'
                }`}>
                  {selectedDaySessions.length} حلقات
                </span>
              </div>

              {selectedDaySessions.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  <p className="font-bold">لا يوجد حلقات مجدولة في هذا اليوم.</p>
                  <p className="text-[10px] text-slate-500 mt-1">تصفح أياماً أخرى للتعلم.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                  {selectedDaySessions.map(session => (
                    <div 
                      key={session.id} 
                      className={`p-3 rounded-xl border text-xs text-right transition-colors space-y-2 ${
                        session.status === 'live'
                          ? isDark ? 'bg-rose-950/20 border-rose-900/40 text-rose-300' : 'bg-rose-50 border-rose-100 text-rose-900'
                          : isDark ? 'bg-[#121826]/80 border-slate-800 text-slate-300' : 'bg-white border-slate-150 text-slate-800'
                      }`}
                    >
                      <div className="flex justify-between items-center flex-wrap gap-1">
                        <span className="font-extrabold">{session.title}</span>
                        {session.status === 'live' ? (
                          <span className="bg-rose-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold animate-pulse">مباشر 🔴</span>
                        ) : session.status === 'completed' ? (
                          <span className="bg-slate-400 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">منتهية</span>
                        ) : (
                          <span className="bg-amber-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">مجدولة</span>
                        )}
                      </div>
                      
                      <p className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span>الوقت: {session.startTime} - {session.endTime}</span>
                      </p>

                      {session.courseName && (
                        <p className={`text-[10px] font-bold ${isDark ? 'text-indigo-400' : 'text-indigo-700'}`}>
                          المقرر: {session.courseName}
                        </p>
                      )}

                      {/* Quick join or action button */}
                      {onAction && (session.status === 'live' || session.status === 'scheduled') && (
                        <button
                          onClick={() => onAction(session.id)}
                          className={`w-full py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all ${
                            session.status === 'live'
                              ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-md'
                              : isDark ? 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-emerald-850'
                          }`}
                        >
                          <Play className="h-3 w-3" />
                          <span>{actionLabel}</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={`pt-3 mt-3 border-t text-[10px] text-slate-400 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              💡 يمكنك مراجعة مواعيدك وتنظيم خطط حفظك وتسميعك وفق الحلقات المذكورة.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
