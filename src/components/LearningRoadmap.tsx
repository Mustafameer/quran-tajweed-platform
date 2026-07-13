import React, { useState } from 'react';
import { BookOpen, CheckCircle2, Circle, Star, Award, Lock, BookMarked, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Milestone {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  difficulty: 'مبتدئ' | 'متوسط' | 'متقدم';
  rules: string[];
  duration: string;
}

const QURAN_MILESTONES: Milestone[] = [
  {
    id: 'm1',
    title: 'مخارج الحروف الأساسية',
    subtitle: 'الجوف، الحلق، اللسان، الشفتان والخيشوم',
    description: 'معرفة الحيز الذي يخرج منه الحرف تحديداً لتمييزه عن غيره، وتعد الأساس لكل قارئ مبتدئ.',
    difficulty: 'مبتدئ',
    rules: ['مخرج الجوف (حروف المد الثلاثة)', 'مخرج الحلق (أقصى ووسط وأدنى الحلق)', 'مخرج اللسان والأسنان والشفتين'],
    duration: 'أسبوعان'
  },
  {
    id: 'm2',
    title: 'صفات الحروف ومستحقاتها',
    subtitle: 'الهمس والجهر، الشدة والرخاوة، القلقلة',
    description: 'الصفات الملازمة للحرف عند النطق به، منها ما له ضد كالجهر والهمس، ومنها ما لا ضد له كالصفير والقلقلة.',
    difficulty: 'مبتدئ',
    rules: ['الهمس والجهر (فحثه شخص سكت)', 'الشدة والتوسط والرخاوة', 'حروف القلقلة (قطب جد) وطرق أدائها'],
    duration: 'أسبوعان'
  },
  {
    id: 'm3',
    title: 'أحكام النون الساكنة والتنوين',
    subtitle: 'الإظهار، الإدغام، الإقلاب، والإخفاء',
    description: 'أهم أحكام علم التجويد وأكثرها تكراراً في القرآن الكريم، وتتعلق بطريقة النطق بالنون الساكنة والتنوين حسب الحرف التالي.',
    difficulty: 'متوسط',
    rules: ['الإظهار الحلقي عند حروف الحلق الستة', 'الإدغام بغنة وبغير غنة (يرملون)', 'الإقلاب ميماً مخفاة عند الباء', 'الإخفاء الحقيقي عند بقية الحروف'],
    duration: '3 أسابيع'
  },
  {
    id: 'm4',
    title: 'أحكام الميم الساكنة المشددة',
    subtitle: 'الإخفاء الشفوي، إدغام المثلين، الإظهار الشفوي',
    description: 'ثلاثة أحكام رئيسية تنظم نطق الميم الساكنة الخالية من الحركة لتفادي الخلط عند قراءتها متصلة.',
    difficulty: 'متوسط',
    rules: ['الإخفاء الشفوي عند حرف الباء فقط', 'إدغام المتماثلين الصغير بغنة كاملة عند الميم', 'الإظهار الشفوي عند بقية الحروف وبخاصة الواو والفاء'],
    duration: 'أسبوع واحد'
  },
  {
    id: 'm5',
    title: 'أحكام المدود وأقسامها',
    subtitle: 'المد الطبيعي، المتصل، المنفصل، والعارض',
    description: 'إطالة الصوت بحرف من حروف المد الثلاثة نتيجة وجود همز أو سكون، وهي من مكملات جمال الصوت وعذوبته.',
    difficulty: 'متقدم',
    rules: ['المد الطبيعي والفرعي بسبب الهمز (المتصل والمنفصل)', 'المد بسبب السكون (العارض للسكون واللازم بأقسامه)', 'مقادير حركات المد وطريقة ضبطها'],
    duration: '3 أسابيع'
  },
  {
    id: 'm6',
    title: 'الوقف والابتداء ومخارج الأداء',
    subtitle: 'الوقف التام، الكافي، الحسن، والقبيح',
    description: 'قواعد صون لسان القارئ عن ارتكاب الأخطاء اللفظية والمعنوية عبر اختيار مواضع الوقف المناسبة التي لا تخل بالمعنى الإلهي.',
    difficulty: 'متقدم',
    rules: ['معرفة علامات الوقف في المصحف الشريف', 'الفرق بين السكت والقطع والوقف', 'الابتداء الحسن وتجنب القبيح'],
    duration: 'أسبوعان'
  }
];

const HAWZA_MILESTONES: Milestone[] = [
  {
    id: 'h1',
    title: 'المقدمات التأسيسية (النحو واللغة)',
    subtitle: 'دراسة متن الآجرومية وشرح ابن عقيل',
    description: 'تأسيس الطالب في قواعد النحو والصرف وفهم بنية الجملة العربية، وهو الركن الأول لفهم النصوص الشرعية.',
    difficulty: 'مبتدئ',
    rules: ['أقسام الكلام وعلامات الإعراب وعملها', 'المرفوعات والمنصوبات والمجرورات من الأسماء', 'دراسة تطبيقات الصرف وتصريف الأفعال والاشتقاق'],
    duration: 'شهران'
  },
  {
    id: 'h2',
    title: 'علم المنطق ومناهج التفكير',
    subtitle: 'خلاصة المنطق للفضلي ونصاب المنطق',
    description: 'تمكين الطالب من القواعد العامة للتفكير السليم وصياغة التعريفات المنطقية الصحيحة وتجنب المغالطات العقلية واللفظية.',
    difficulty: 'مبتدئ',
    rules: ['مباحث التصور والتصديق وأقسام العلم', 'الكليات الخمس (الجنس، الفصل، النوع، الخاصة، العرض العام)', 'هيكلية الاستدلال وأشكال القياس المنطقي والبرهان'],
    duration: 'شهران'
  },
  {
    id: 'h3',
    title: 'علم العقائد والكلام الإسلامي',
    subtitle: 'بداية المعارف الإلهية والباب الحادي عشر',
    description: 'مراجعة منهجية لأدلة العقيدة الإسلامية الكبرى وإثبات الصانع والتوحيد والعدل والنبوة والإمامة والمعاد.',
    difficulty: 'مبتدئ',
    rules: ['أدلة التوحيد والصفات الإلهية الثبوتية والسلبية', 'فلسفة النبوة واللطف والوجوب العقلي لبعثة الرسل والأنبياء', 'أدلة الإمامة وحقيقة المعاد الجسماني والروحاني بالقرآن'],
    duration: 'شهران'
  },
  {
    id: 'h4',
    title: 'أصول الفقه (التمهيدي والمتوسط)',
    subtitle: 'الموجز للمظفر وحلقات الشهيد الصدر الأولى',
    description: 'فهم عملية استنباط الأحكام الشرعية من أدلتها العامة والتعريف بالأدلة اللفظية والعقلية والأصول العملية.',
    difficulty: 'متوسط',
    rules: ['مفهوم الاستنباط وعلاقة الفقه بالأصول والحاجة إليه', 'الأدلة الشرعية اللفظية وحجية الظواهر والألفاظ', 'الأصول العملية الأربعة (البراءة، الاحتياط، الاستصحاب، التخيير)'],
    duration: '3 أشهر'
  },
  {
    id: 'h5',
    title: 'الفقه الاستدلالي (السطوح)',
    subtitle: 'اللمعة الدمشقية وشرح الروضة البهية',
    description: 'دراسة الفقه الاستدلالي المقارن وتدريب الطالب على مناقشة الروايات وأدلة الأحكام في العبادات والمعاملات والحدود.',
    difficulty: 'متوسط',
    rules: ['كتاب الطهارة والصلاة بنظرة استدلالية وتطبيقية', 'أحكام المعاملات والبيع والخيارات وتطبيقاتها الشرعية', 'فقه الديات والقصاص والحدود والقضاء والشهادات'],
    duration: '4 أشهر'
  },
  {
    id: 'h6',
    title: 'مستوى السطوح العليا والبحث الخارج',
    subtitle: 'كفاية الأصول للآخوند والرسائل للأنصاري',
    description: 'المستوى الأرقى في التعليم الحوزوي حيث يدرس الطالب التعارض والترجيح والاجتهاد والتقليد تمهيداً لحضور البحث الخارج.',
    difficulty: 'متقدم',
    rules: ['الملازمات العقلية والتعارض والتعادل والترجيح بين الأدلة', 'مسألة الاجتهاد والتجزي وشروط التقليد والمرجعية', 'حضور حلقات المباحثة والبحث الاستدلالي الحر مع الفقهاء'],
    duration: '6 أشهر'
  }
];

interface LearningRoadmapProps {
  completedCount?: number; // number of completed milestones (0 to 6)
  isDark?: boolean;
}

export default function LearningRoadmap({ completedCount = 3, isDark = false }: LearningRoadmapProps) {
  const [activeMode, setActiveMode] = useState<'quran' | 'hawza'>('quran');
  
  const milestones = activeMode === 'quran' ? QURAN_MILESTONES : HAWZA_MILESTONES;

  const [localCompletedCountQuran, setLocalCompletedCountQuran] = useState<number>(completedCount);
  const [localCompletedCountHawza, setLocalCompletedCountHawza] = useState<number>(2); // Mock initial Hawza progress

  const currentCompletedCount = activeMode === 'quran' ? localCompletedCountQuran : localCompletedCountHawza;

  const [selectedQuranMilestone, setSelectedQuranMilestone] = useState<Milestone | null>(QURAN_MILESTONES[Math.min(completedCount, QURAN_MILESTONES.length - 1)] || QURAN_MILESTONES[0]);
  const [selectedHawzaMilestone, setSelectedHawzaMilestone] = useState<Milestone | null>(HAWZA_MILESTONES[0]);

  const selectedMilestone = activeMode === 'quran' ? selectedQuranMilestone : selectedHawzaMilestone;
  
  const setSelectedMilestone = (m: Milestone) => {
    if (activeMode === 'quran') {
      setSelectedQuranMilestone(m);
    } else {
      setSelectedHawzaMilestone(m);
    }
  };

  const handleToggleComplete = (index: number) => {
    if (activeMode === 'quran') {
      if (index === localCompletedCountQuran) {
        setLocalCompletedCountQuran(prev => prev + 1);
      } else if (index === localCompletedCountQuran - 1) {
        setLocalCompletedCountQuran(prev => Math.max(0, prev - 1));
      }
    } else {
      if (index === localCompletedCountHawza) {
        setLocalCompletedCountHawza(prev => prev + 1);
      } else if (index === localCompletedCountHawza - 1) {
        setLocalCompletedCountHawza(prev => Math.max(0, prev - 1));
      }
    }
  };

  return (
    <div className={`p-6 rounded-3xl border shadow-sm transition-all ${
      isDark ? 'bg-[#121826] border-slate-850' : 'bg-white border-slate-100'
    }`} id="learning-roadmap-root">
      
      {/* Header section */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4 text-right">
        <div>
          <h3 className={`text-base font-extrabold flex items-center gap-1.5 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
            <span>{activeMode === 'quran' ? 'خارطة طريق تجويد القرآن التفاعلية 🗺️' : 'خارطة طريق العلوم الحوزوية التفاعلية 🗺️'}</span>
          </h3>
          <p className="text-slate-400 text-xs mt-1">
            {activeMode === 'quran' 
              ? 'تتبع مسار تعلمك خطوة بخطوة من التأسيس إلى إتقان الأداء والقراءة المجودة.' 
              : 'تتبع مسار تحصيلك العلمي الحوزوي من المقدمات وتأسيس اللغة والمنطق إلى البحث الخارج.'}
          </p>
        </div>
        <div className={`px-4 py-2 rounded-2xl flex items-center gap-2 border text-xs font-bold ${
          isDark ? 'bg-emerald-950/20 border-emerald-900/60 text-emerald-400' : 'bg-emerald-50 border-emerald-100 text-emerald-800'
        }`}>
          <span>مستوى الإنجاز الحالي:</span>
          <span className="font-mono text-sm">{Math.round((currentCompletedCount / milestones.length) * 100)}%</span>
        </div>
      </div>

      {/* Category Toggle Tabs */}
      <div className="flex gap-2 mb-6 border-b pb-4 dark:border-slate-800/80">
        <button
          onClick={() => setActiveMode('quran')}
          className={`flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer transition-all border ${
            activeMode === 'quran'
              ? 'bg-emerald-600 border-emerald-500 text-white shadow-md'
              : isDark
                ? 'bg-slate-800 border-slate-700 text-slate-350 hover:bg-slate-750'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>مسار تجويد وعلوم القرآن 📖</span>
        </button>
        <button
          onClick={() => setActiveMode('hawza')}
          className={`flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer transition-all border ${
            activeMode === 'hawza'
              ? 'bg-emerald-600 border-emerald-500 text-white shadow-md'
              : isDark
                ? 'bg-slate-800 border-slate-700 text-slate-350 hover:bg-slate-750'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Award className="h-4 w-4" />
          <span>مسار العلوم والدروس الحوزوية 🎓</span>
        </button>
      </div>

      {/* Dynamic Animated Progress Bar */}
      <div className="mb-8 p-4 rounded-2xl border bg-slate-50/50 dark:bg-slate-900/20 border-slate-100 dark:border-slate-850/60" id="roadmap-progress-bar-container">
        <div className="flex justify-between items-center text-xs font-bold mb-2">
          <span className={isDark ? 'text-slate-450' : 'text-slate-650'}>مؤشر التقدم في الوحدات والمحاور التعليمية</span>
          <span className="text-emerald-500 font-mono text-xs">{Math.round((currentCompletedCount / milestones.length) * 100)}% ({currentCompletedCount} من {milestones.length} منجز)</span>
        </div>
        <div className={`w-full h-3 rounded-full overflow-hidden relative shadow-inner ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
          <motion.div
            id="roadmap-progress-bar-fill"
            className="h-full bg-gradient-to-l from-emerald-500 to-teal-400 rounded-full relative"
            initial={{ width: 0 }}
            animate={{ width: `${(currentCompletedCount / milestones.length) * 100}%` }}
            transition={{ type: 'spring', stiffness: 85, damping: 15 }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Interactive Linear Path Panel (7 cols) */}
        <div className="lg:col-span-7 space-y-6 relative">
          
          {/* Vertical connecting line for desktop & mobile */}
          <div className="absolute right-7.5 top-8 bottom-8 w-1 bg-slate-200 dark:bg-slate-850 rounded-full z-0" />

          {milestones.map((milestone, index) => {
            const isCompleted = index < currentCompletedCount;
            const isActive = index === currentCompletedCount;
            const isLocked = index > currentCompletedCount;
            const isSelected = selectedMilestone?.id === milestone.id;

            return (
              <div 
                key={milestone.id} 
                className="flex items-start gap-4 relative z-10 group"
              >
                {/* Visual Node Button */}
                <button
                  onClick={() => setSelectedMilestone(milestone)}
                  className={`h-15 w-15 rounded-2xl border-2 flex items-center justify-center cursor-pointer transition-all shrink-0 shadow-sm ${
                    isCompleted
                      ? 'bg-emerald-600 border-emerald-500 text-white hover:scale-105 shadow-emerald-500/10'
                      : isActive
                        ? 'bg-amber-500 border-amber-400 text-white animate-pulse shadow-lg hover:scale-105'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-650 hover:border-slate-350'
                  }`}
                  title={milestone.title}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-6 w-6" />
                  ) : isActive ? (
                    <Star className="h-6 w-6 fill-white" />
                  ) : (
                    <Lock className="h-5 w-5" />
                  )}
                </button>

                {/* Milestone Info Card */}
                <div 
                  onClick={() => setSelectedMilestone(milestone)}
                  className={`flex-1 p-4 border rounded-2xl cursor-pointer text-right transition-all duration-200 ${
                    isSelected
                      ? isDark ? 'bg-[#172033] border-emerald-500/50 shadow-md' : 'bg-emerald-50/20 border-emerald-500/30 shadow-md'
                      : isDark ? 'bg-[#121826]/30 border-slate-850 hover:border-slate-800' : 'bg-white border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className="flex justify-between items-center gap-2 flex-wrap">
                    <h4 className={`text-sm font-extrabold flex items-center gap-1.5 ${
                      isCompleted ? 'text-emerald-500' : isDark ? 'text-slate-150' : 'text-slate-800'
                    }`}>
                      <span>المرحلة {index + 1}: {milestone.title}</span>
                    </h4>
                    
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                        milestone.difficulty === 'مبتدئ'
                          ? 'bg-sky-500/10 border-sky-500/20 text-sky-500'
                          : milestone.difficulty === 'متوسط'
                            ? 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                            : 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                      }`}>
                        {milestone.difficulty}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                        isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
                      }`}>
                        ⏱️ {milestone.duration}
                      </span>
                    </div>
                  </div>
                  
                  <p className={`text-[11px] mt-1.5 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-550'}`}>
                    {milestone.subtitle}
                  </p>

                  {/* Quick toggle check box for local interactive demo */}
                  <div className="mt-3 flex justify-between items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                    <span className="text-[10px] text-slate-400">انقر لعرض قواعد ومحاور الموديول</span>
                    {(isActive || (index === currentCompletedCount - 1 && isCompleted)) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleComplete(index);
                        }}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border cursor-pointer transition-all ${
                          isCompleted
                            ? 'bg-amber-600/10 border-amber-500/30 text-amber-500 hover:bg-amber-600/20'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500'
                        }`}
                      >
                        {isCompleted ? '↩️ تعيين كغير مكتمل' : '✅ تم الاجتياز ودراسة الموديول'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detailed Milestone Inspector View (5 cols) */}
        <div className="lg:col-span-5">
          <AnimatePresence mode="wait">
            {selectedMilestone ? (
              <motion.div
                key={selectedMilestone.id}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                className={`p-5 rounded-2xl border text-right space-y-4 ${
                  isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50/50 border-slate-100'
                }`}
              >
                <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-serif font-black text-sm">
                    📖
                  </div>
                  <div>
                    <h4 className={`text-sm font-extrabold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                      تفاصيل موديول: {selectedMilestone.title}
                    </h4>
                    <p className="text-[10px] text-slate-400">{selectedMilestone.subtitle}</p>
                  </div>
                </div>

                <div>
                  <h5 className={`text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>وصف المرحلة:</h5>
                  <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-650'}`}>
                    {selectedMilestone.description}
                  </p>
                </div>

                <div className="space-y-2 pt-1">
                  <h5 className={`text-xs font-bold flex items-center gap-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    <BookMarked className="h-4 w-4 text-emerald-500" />
                    <span>المباحث والمطالب المدرجة:</span>
                  </h5>
                  <ul className="space-y-1.5 pr-2">
                    {selectedMilestone.rules.map((rule, rIdx) => (
                      <li key={rIdx} className="text-xs text-slate-500 flex items-start gap-1.5">
                        <span className="text-emerald-500 mt-0.5">•</span>
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs ${
                  isDark ? 'bg-[#121826]/80 border-slate-800 text-slate-300' : 'bg-emerald-50/30 border-emerald-100 text-emerald-950'
                }`}>
                  <span className="text-lg">🎓</span>
                  <div>
                    <p className="font-bold">ملاحظة التدريب والتقييم:</p>
                    <p className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-550'}`}>
                      {activeMode === 'quran'
                        ? 'يتطلب اجتياز هذا الموديول القراءة المباشرة أمام الشيخ المستمع في المقرأة بنسبة دقة لا تقل عن 85%.'
                        : 'يتطلب اجتياز هذا الموديول مناقشة المتن والمباحثة مع الأستاذ والمقرر بدرجة استيعاب لا تقل عن 85%.'}
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="p-6 text-center text-slate-400 text-xs border border-dashed rounded-2xl">
                اختر مرحلة من خارطة الطريق لعرض تفاصيلها وقواعدها المباشرة.
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
