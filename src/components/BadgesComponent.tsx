/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Award, Trophy, Star, Shield, Flame, Target, Lock, Crown } from 'lucide-react';
import { Evaluation, Attendance } from '../types';

interface BadgesComponentProps {
  totalAttended: number;
  averageScore: number;
  coursesInProgress: number;
  myEvaluations: Evaluation[];
  isDark?: boolean;
}

interface BadgeItem {
  id: string;
  title: string;
  description: string;
  requirement: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  unlockedColor: string;
  isUnlocked: boolean;
}

export default function BadgesComponent({
  totalAttended,
  averageScore,
  coursesInProgress,
  myEvaluations,
  isDark = false,
}: BadgesComponentProps) {
  // Check special achievements
  const hasPerfectScore = myEvaluations.some((ev) => ev.score === 100);
  const averageTajweed = myEvaluations.length > 0
    ? Math.round(myEvaluations.reduce((acc, ev) => acc + ev.tajweedAccuracy, 0) / myEvaluations.length)
    : 0;

  const badges: BadgeItem[] = [
    {
      id: 'starter',
      title: 'وسام الانضمام المبارك',
      description: 'تم التسجيل والالتحاق في حلقة قرآنية واحدة على الأقل بالمنصة.',
      requirement: 'الالتحاق بدورة تدريبية واحدة جارية',
      icon: Star,
      colorClass: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
      unlockedColor: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40',
      isUnlocked: coursesInProgress > 0,
    },
    {
      id: 'diligent',
      title: 'المثابر الحريص',
      description: 'أثبت التزاماً ممتازاً بحضور 3 حلقات قرآنية حية أو أكثر.',
      requirement: 'حضور 3 حلقات صوتية مباشرة أو أكثر',
      icon: Flame,
      colorClass: 'text-orange-500 bg-orange-500/10 border-orange-500/30',
      unlockedColor: 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900/40',
      isUnlocked: totalAttended >= 3,
    },
    {
      id: 'perfectionist',
      title: 'تاج الالتزام الكامل',
      description: 'التميز التام بحضور 5 حلقات قرآنية مباركة وتلقي العلم مباشرة من الشيوخ.',
      requirement: 'حضور 5 حلقات قرآنية أو أكثر',
      icon: Crown,
      colorClass: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30',
      unlockedColor: 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900/40',
      isUnlocked: totalAttended >= 5,
    },
    {
      id: 'master_reciter',
      title: 'القارئ المتقن',
      description: 'الحصول على معدل تقييم إجمالي ممتاز بنسبة 90% أو أعلى من الشيوخ.',
      requirement: 'معدل تقييم عام 90% فما فوق',
      icon: Trophy,
      colorClass: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30',
      unlockedColor: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40',
      isUnlocked: averageScore >= 90 && myEvaluations.length > 0,
    },
    {
      id: 'tajweed_genius',
      title: 'المجود الفذ',
      description: 'أداء صوتي مذهل بنسبة دقة في قواعد التجويد تتعدى 95% متوسطاً.',
      requirement: 'متوسط دقة تجويد 95% فما فوق',
      icon: Target,
      colorClass: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/30',
      unlockedColor: 'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900/40',
      isUnlocked: averageTajweed >= 95 && myEvaluations.length > 0,
    },
    {
      id: 'perfect_100',
      title: 'درع الإتقان الكامل',
      description: 'الحصول على درجة كاملة (100%) في تقييم حلقة واحدة على الأقل بنطق صحيح تام.',
      requirement: 'تحقيق درجة 100% في أي تقييم فردي',
      icon: Shield,
      colorClass: 'text-teal-500 bg-teal-500/10 border-teal-500/30',
      unlockedColor: 'bg-teal-50 dark:bg-teal-950/20 border-teal-200 dark:border-teal-900/40',
      isUnlocked: hasPerfectScore,
    },
  ];

  const unlockedCount = badges.filter((b) => b.isUnlocked).length;

  return (
    <div className={`p-6 rounded-3xl border transition-all duration-300 ${
      isDark ? 'bg-[#121826] border-slate-850 shadow-lg shadow-slate-950/20' : 'bg-white border-slate-100 shadow-sm'
    }`} id="badges-container-panel">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-md">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <h2 className={`text-lg font-bold font-sans ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
              أوسمة الإنجاز وتكريم الطالب 🏅
            </h2>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              استمر في تلاوة القرآن وتصحيح الأحكام والالتزام بالحلقات لتفوز بجميع الأوسمة الشرفية!
            </p>
          </div>
        </div>

        {/* Progress Pill */}
        <div className={`px-4 py-2 rounded-xl text-xs font-bold border flex items-center gap-2 self-start sm:self-auto ${
          isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'
        }`}>
          <span>الأوسمة المفتوحة:</span>
          <span className="text-emerald-500 text-sm font-mono font-black">
            {unlockedCount} / {badges.length}
          </span>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" id="badges-grid">
        {badges.map((badge) => {
          const IconComponent = badge.icon;
          return (
            <div
              key={badge.id}
              id={`badge-card-${badge.id}`}
              className={`p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
                badge.isUnlocked
                  ? `${badge.unlockedColor} hover:scale-[1.02] shadow-sm hover:shadow-md`
                  : 'bg-slate-500/5 border-slate-200/10 opacity-60 dark:opacity-40'
              }`}
            >
              {/* Locking layer indicator */}
              {!badge.isUnlocked && (
                <div className="absolute top-3 left-3 flex items-center justify-center text-slate-400 dark:text-slate-600 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <Lock className="h-3 w-3" />
                </div>
              )}

              {badge.isUnlocked && (
                <div className="absolute top-0 left-0 bg-emerald-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-br-lg shadow-sm">
                  تم التفعيل
                </div>
              )}

              <div className="flex gap-3 text-right">
                <div className={`h-11 w-11 rounded-xl flex items-center justify-center font-bold border shrink-0 ${
                  badge.isUnlocked ? badge.colorClass : 'text-slate-400 bg-slate-200/20 dark:bg-slate-800/40 border-slate-300/30'
                }`}>
                  <IconComponent className="h-5 w-5" />
                </div>

                <div className="space-y-1">
                  <h4 className={`text-sm font-extrabold ${
                    badge.isUnlocked
                      ? isDark ? 'text-slate-150' : 'text-slate-800'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}>
                    {badge.title}
                  </h4>
                  <p className={`text-[11px] leading-relaxed ${
                    badge.isUnlocked
                      ? isDark ? 'text-slate-400' : 'text-slate-500'
                      : 'text-slate-400 dark:text-slate-600'
                  }`}>
                    {badge.description}
                  </p>
                </div>
              </div>

              {/* Requirement Hint */}
              <div className={`mt-4 pt-2 border-t text-[10px] font-medium text-right flex justify-between items-center ${
                badge.isUnlocked
                  ? isDark ? 'border-slate-800/60 text-slate-450' : 'border-slate-200/50 text-slate-500'
                  : 'border-slate-300/10 text-slate-400 dark:text-slate-550'
              }`}>
                <span>طريقة الفوز:</span>
                <span className={badge.isUnlocked ? 'text-emerald-500 font-bold' : 'font-semibold'}>
                  {badge.requirement}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
