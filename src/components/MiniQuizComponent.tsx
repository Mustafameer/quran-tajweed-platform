/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CheckCircle2, XCircle, ArrowLeft, ArrowRight, RotateCcw, Award, Check, BookOpen, AlertCircle } from 'lucide-react';
import { Lesson } from '../types';

interface Question {
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface MiniQuizComponentProps {
  lesson: Lesson;
  isDark?: boolean;
}

// Database of Tajweed quiz questions based on keywords in lesson titles
const QUIZ_DATABASE: Record<string, Question[]> = {
  noon: [
    {
      text: 'كم عدد أحكام النون الساكنة والتنوين؟',
      options: ['ثلاثة أحكام', 'أربعة أحكام', 'خمسة أحكام', 'ستة أحكام'],
      correctIndex: 1, // أربعة أحكام
      explanation: 'أحكام النون الساكنة والتنوين أربعة وهي: الإظهار الحلقي، الإدغام، الإقلاب، والإخفاء الحقيقي.',
    },
    {
      text: 'ما هو حكم النون الساكنة في كلمة "مَنْ يَقُولُ"؟',
      options: ['إظهار حلقي', 'إخفاء حقيقي', 'إدغام بغنة', 'إقلاب'],
      correctIndex: 2, // إدغام بغنة
      explanation: 'حكمها إدغام بغنة لأن الياء من حروف الإدغام بغنة المجمعة في كلمة (ينمو).',
    },
    {
      text: 'حرف الباء هو الحرف الوحيد لحكم:',
      options: ['الإظهار الحلقي', 'الإقلاب', 'الإدغام بغير غنة', 'الإخفاء الحقيقي'],
      correctIndex: 1, // الإقلاب
      explanation: 'حرف الباء هو حرف حكم الإقلاب الوحيد، حيث تُقلب النون الساكنة أو التنوين ميماً مخفاة بغنة عند الباء.',
    },
  ],
  meem: [
    {
      text: 'إذا وقعت ميم متحركة بعد الميم الساكنة، فما الحكم التجويدي؟',
      options: ['إظهار شفوي', 'إدغام متماثلين صغير (إدغام شفوي)', 'إخفاء شفوي', 'إقلاب'],
      correctIndex: 1, // إدغام متماثلين صغير
      explanation: 'الحكم هو إدغام متماثلين صغير (إدغام شفوي) مع الغنة الكاملة، مثل قوله تعالى: "أَمْ مَنْ".',
    },
    {
      text: 'كم عدد حروف الإظهار الشفوي للميم الساكنة؟',
      options: ['26 حرفاً', '6 حروف', 'حرف واحد وهو الباء', '15 حرفاً'],
      correctIndex: 0, // 26 حرفاً
      explanation: 'حروف الإظهار الشفوي هي جميع الحروف الهجائية ما عدا الباء (حرف الإخفاء) والميم (حرف الإدغام)، وعددها 26 حرفاً.',
    },
    {
      text: 'يجب الحذر الشديد من إخفاء الميم الساكنة إذا جاء بعدها حرفا:',
      options: ['الهمزة والعين', 'الواو والفاء', 'التاء والثاء', 'الكاف والقاف'],
      correctIndex: 1, // الواو والفاء
      explanation: 'يجب الحذر من إخفاء الميم الساكنة عند الواو والفاء لقرب الميم في المخرج من الفاء واتحادها مع الواو، فيجب إظهارها إظهاراً شفوياً شديداً.',
    },
  ],
  madd: [
    {
      text: 'ما هو مقدار مد "المد المتصل" عند حفص عن عاصم من طريق الشاطبية؟',
      options: ['حركتان فقط', 'حركتان أو أربع حركات', 'أربع أو خمس حركات', 'ست حركات وجوباً'],
      correctIndex: 2, // أربع أو خمس حركات
      explanation: 'يمد المد المتصل بمقدار 4 أو 5 حركات وجوباً، وهو أن يأتي حرف المد والهمزة في كلمة واحدة.',
    },
    {
      text: 'ما سبب تسمية المد اللازم بهذا الاسم؟',
      options: ['للزمومه في القراءة دائماً', 'للزوم مده ست حركات عند جميع القراء وصلاً ووقفاً', 'لأنه يجوز قصره حركتين', 'لأنه يأتي في كلمتين دائماً'],
      correctIndex: 1,
      explanation: 'سُمي مداً لازماً للزوم مده ست حركات وصلاً ووقفاً بالتساوي عند جميع القراء، وسببه سكون أصلي ثابت.',
    },
    {
      text: 'المد الفرعي هو المد الزائد على الطبيعي، وله سببان هما:',
      options: ['الكسرة والضمة', 'الفتح والتشديد', 'الهمز والسكون', 'التنوين والتشديد'],
      correctIndex: 2, // الهمز والسكون
      explanation: 'أسباب المد الفرعي اثنان: إما همز (كالمتصل والمنفصل والبدل) أو سكون (كاللازم والعارض للسكون).',
    },
  ],
  makharij: [
    {
      text: 'كم عدد المخارج العامة (الرئيسية) للحروف العربية؟',
      options: ['3 مخارج', '5 مخارج', '17 مخرجاً', '7 مخارج'],
      correctIndex: 1, // 5 مخارج
      explanation: 'المخارج العامة خمسة وهي: الجوف، الحلق، اللسان، الشفتان، والخيشوم.',
    },
    {
      text: 'من أين تخرج حروف المد الثلاثة (الألف، الواو، الياء الساكنة والمجانس لها ما قبلها)؟',
      options: ['مخرج الحلق', 'مخرج الجوف', 'مخرج اللسان', 'مخرج الشفتين'],
      correctIndex: 1, // مخرج الجوف
      explanation: 'تخرج حروف المد الثلاثة من الجوف، وهو الفراغ الممتد داخل الحلق والفم، ومخرجها مخرج مقدر.',
    },
    {
      text: 'حروف مخرج "وسط الحلق" هي:',
      options: ['الهمزة والهاء', 'العين والحاء', 'الغين والخاء', 'القاف والكاف'],
      correctIndex: 1, // العين والحاء
      explanation: 'أقسام الحلق ثلاثة: أقصى الحلق (الهمزة والهاء)، وسط الحلق (العين والحاء)، وأدنى الحلق (الغين والخاء).',
    },
  ],
  default: [
    {
      text: 'ما هو الفضل والمقصود بـ "علم التجويد"؟',
      options: ['إتقان مخارج الحروف وإعطاء كل حرف حقه ومستحقه وصون اللسان عن اللحن', 'حفظ القرآن كاملاً في شهرين', 'معرفة القراءات السبع فقط', 'معرفة مراد الله تعالى وإعراب الآيات'],
      correctIndex: 0,
      explanation: 'الغاية الأساسية لعلم التجويد هي صون اللسان عن الخطأ واللحن في كتاب الله تعالى بإعطاء الحروف حقوقها ومخارجها.',
    },
    {
      text: 'اللحن الجلي في القرآن الكريم هو خطأ يطرأ على اللفظ ويخل بالمعنى أو الإعراب، وحكمه عند القراء هو:',
      options: ['مكروه كراهة شديدة', 'محرم ومأثوم فاعله عمداً', 'جائز ومسامح فيه مطلقاً', 'مستحب لتسهيل القراءة'],
      correctIndex: 1, // محرم ومأثوم فاعله عمداً
      explanation: 'اللحن الجلي خطأ ظاهر يغير الكلمة أو يغير حركة بحركة، وحكمه التحريم باتفاق العلماء والقرّاء لمن تعمده أو قصر في تعلمه.',
    },
    {
      text: 'ما هي حروف القلقلة المجموعة في كلمة مشهورة؟',
      options: ['يرملون', 'حثه شخص سكت', 'قطب جد', 'ينمو'],
      correctIndex: 2, // قطب جد
      explanation: 'حروف القلقلة خمسة يجمعها لفظ (قطب جد)، وتقلقل إذا كانت ساكنة سكوناً أصلياً أو عارضاً للوقف.',
    },
  ],
  logic: [
    {
      text: 'ما هي الغاية الأساسية من دراسة علم المنطق؟',
      options: ['صيانة الفكر عن الخطأ في الاستدلال والبحث', 'معرفة مفردات اللغة العربية وإعرابها', 'حفظ المتون العقائدية والنصوص التاريخية', 'دراسة أحكام العبادات والمعاملات الفقهية'],
      correctIndex: 0,
      explanation: 'الغاية الأساسية لعلم المنطق هي صيانة القوة الفكرية للإنسان عن الوقوع في الخطأ عند التفكير وصياغة الاستدلال.'
    },
    {
      text: 'أي مما يلي يمثل أحد الكليات الخمس في علم المنطق؟',
      options: ['الاسم', 'الفصل', 'الفاعل', 'الخبر والإنشاء'],
      correctIndex: 1,
      explanation: 'الكليات الخمس في المنطق هي: الجنس، الفصل، النوع، الخاصة، والعرض العام.'
    },
    {
      text: 'ما هو التعريف المنطقي للجنس؟',
      options: ['كلي ذاتي يقال على كثيرين متفقين بالحقائق', 'كلي ذاتي يقال على كثيرين مختلفين بالحقائق في جواب ما هو', 'كلي عرضي يختص بحقيقة واحدة فقط دون غيرها', 'اللفظ المشترك اللغوي بين معنيين أو أكثر'],
      correctIndex: 1,
      explanation: 'الجنس هو كلي ذاتي يندرج تحته أنواع مختلفة بالحقائق، مثل (حيوان) الذي يندرج تحته الإنسان والفرس كأنواع مختلفة.'
    }
  ],
  fiqh: [
    {
      text: 'تنقسم الطهارة في الفقه الإسلامي من حيث المطهر إلى قسمين رئيسيين هما:',
      options: ['طهارة البدن وطهارة الثوب', 'طهارة مائية (وضوء وغسل) وطهارة ترابية (تيمم)', 'طهارة واجبة وطهارة مستحبة ومكروهة', 'طهارة الحدث وطهارة الخبث فقط دون البدل الترابي'],
      correctIndex: 1,
      explanation: 'تنقسم الطهارة من حيث المطهر إلى طهارة مائية (وهي الأصل كالوضوء والغسل) وطهارة ترابية (وهي البديل كالتيمم عند فقد الماء أو تعذر استعماله).'
    },
    {
      text: 'ما هو حكم الماء المضاف عند ملاقاة النجاسة؟',
      options: ['يطهر ويبقى مطهراً إذا بلغ كراً', 'ينجس بمجرد الملاقاة مطلقاً سواء كان قليلاً أو كثيراً', 'يبقى طاهراً ومطهراً في جميع الحالات', 'يجوز استعماله اختياراً في الوضوء والغسل'],
      correctIndex: 1,
      explanation: 'الماء المضاف ينجس بمجرد ملاقاة النجاسة مطلقاً سواء كان قليلاً أو كثيراً، بخلاف الماء المطلق الذي لا ينجس إلا بالتغير أو إذا كان دون الكر.'
    }
  ],
  usul: [
    {
      text: 'ما هو تعريف علم أصول الفقه؟',
      options: ['العلم بالقواعد الممهدة لاستنباط الأحكام الشرعية', 'العلم بالأحكام الشرعية الفرعية عن أدلتها التفصيلية مباشرة', 'حفظ متون الأحاديث والروايات وتصنيف الرجال', 'معرفة أصول الدين وعلم الكلام العقائدي وإثبات الصانع'],
      correctIndex: 0,
      explanation: 'علم أصول الفقه يبحث في القواعد العامة المنهجية التي يستخدمها الفقيه لاستنباط الحكم الشرعي من أدلته التفصيلية.'
    },
    {
      text: 'ما هي الأصول العملية الأربعة المشهورة عند الفقهاء عند الشك؟',
      options: ['الكتاب، السنة، الإجماع، العقل المبرهن', 'البراءة، الاحتياط (الاشتغال)، الاستصحاب، التخيير', 'القياس، الاستحسان، المصالح المرسلة، سد الذرائع', 'الوجوب، الحرمة، الاستحباب، الكراهة والإباحة'],
      correctIndex: 1,
      explanation: 'الأصول العملية التي يرجع إليها المجتهد عند الشك وفقد الدليل المحرز هي: أصالة البراءة، أصالة الاحتياط (الاشتغال)، الاستصحاب، والتخيير.'
    }
  ],
};

// Map lesson title to database category
function getCategoryFromLesson(lesson: Lesson): Question[] {
  const title = (lesson.title || '').toLowerCase();
  const desc = (lesson.description || '').toLowerCase();
  
  if (title.includes('منطق') || desc.includes('منطق')) {
    return QUIZ_DATABASE.logic;
  }
  if (title.includes('فقه') || title.includes('لمعة') || title.includes('طهارة') || desc.includes('فقه') || desc.includes('طهارة')) {
    return QUIZ_DATABASE.fiqh;
  }
  if (title.includes('أصول') || title.includes('صدر') || desc.includes('أصول')) {
    return QUIZ_DATABASE.usul;
  }
  if (title.includes('نون') || title.includes('ساكنة') || title.includes('تنوين') || desc.includes('نون') || desc.includes('تنوين')) {
    return QUIZ_DATABASE.noon;
  }
  if (title.includes('ميم') || title.includes('شفوي') || desc.includes('ميم') || desc.includes('شفوي')) {
    return QUIZ_DATABASE.meem;
  }
  if (title.includes('مد') || title.includes('متصل') || title.includes('لازم') || desc.includes('مد')) {
    return QUIZ_DATABASE.madd;
  }
  if (title.includes('مخرج') || title.includes('مخارج') || title.includes('حلق') || title.includes('لسان') || desc.includes('مخارج')) {
    return QUIZ_DATABASE.makharij;
  }
  return QUIZ_DATABASE.default;
}

export default function MiniQuizComponent({ lesson, isDark = false }: MiniQuizComponentProps) {
  const questions = getCategoryFromLesson(lesson);
  
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  const currentQuestion = questions[currentIdx];

  const handleStartQuiz = () => {
    setQuizStarted(true);
    setCurrentIdx(0);
    setSelectedOpt(null);
    setIsAnswerSubmitted(false);
    setScore(0);
    setQuizFinished(false);
  };

  const handleOptionSelect = (idx: number) => {
    if (isAnswerSubmitted) return;
    setSelectedOpt(idx);
  };

  const handleSubmitAnswer = () => {
    if (selectedOpt === null || isAnswerSubmitted) return;
    setIsAnswerSubmitted(true);
    if (selectedOpt === currentQuestion.correctIndex) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
      setSelectedOpt(null);
      setIsAnswerSubmitted(false);
    } else {
      setQuizFinished(true);
    }
  };

  const handleRetry = () => {
    handleStartQuiz();
  };

  return (
    <div className={`mt-4 p-5 rounded-2xl border transition-all duration-300 ${
      isDark ? 'bg-slate-900/60 border-emerald-950/45' : 'bg-emerald-50/20 border-emerald-100'
    }`} id={`quiz-container-${lesson.id}`}>
      {!quizStarted ? (
        <div className="text-center py-4 space-y-3">
          <div className="h-10 w-10 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
            <BookOpen className="h-5 w-5 animate-bounce" />
          </div>
          <div>
            <h5 className={`font-bold text-sm ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>اختبر فهمك لأحكام تجويد هذا الدرس! ✨</h5>
            <p className={`text-[11px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              بعد مشاهدة الشرح المرئي للدرس وقراءة الكتيّب، أجب على {questions.length} أسئلة تجويد تفاعلية لقياس استيعابك.
            </p>
          </div>
          <button
            onClick={handleStartQuiz}
            className="mt-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer transition-all shadow-sm"
          >
            ابدأ الاختبار التفاعلي السريع ⚡
          </button>
        </div>
      ) : quizFinished ? (
        <div className="text-center py-5 space-y-4">
          <div className="h-12 w-12 bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto shadow-md">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <h5 className={`font-black text-base ${isDark ? 'text-amber-400' : 'text-amber-800'}`}>
              {score === questions.length ? 'ما شاء الله! درجة كاملة وإتقان بارع 🏆' : 'أحسنت! إنجاز رائع ومحاولة طيبة 👏'}
            </h5>
            <p className={`text-xs mt-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              لقد أجبت بشكل صحيح على <span className="font-bold text-emerald-500 text-sm font-mono">{score}</span> من أصل <span className="font-bold font-mono text-sm">{questions.length}</span> أسئلة.
            </p>
            {score === questions.length ? (
              <p className="text-[10px] text-emerald-500 font-bold mt-2">🎖️ فزت بنقاط فخرية إضافية وتميزت في أحكام هذا الدرس!</p>
            ) : (
              <p className={`text-[10px] mt-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>يمكنك مراجعة المادة التعليمية وإعادة الاختبار لتحقيق درجة كاملة.</p>
            )}
          </div>
          <div className="flex justify-center gap-2 pt-2">
            <button
              onClick={handleRetry}
              className={`text-xs font-bold px-4 py-2 rounded-xl cursor-pointer transition-all border flex items-center gap-1.5 ${
                isDark 
                  ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' 
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>إعادة المحاولة</span>
            </button>
            <button
              onClick={() => setQuizStarted(false)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer transition-all"
            >
              موافق
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Progress Header */}
          <div className="flex justify-between items-center text-[11px] font-bold pb-2 border-b border-emerald-500/10">
            <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>
              السؤال {currentIdx + 1} من {questions.length}
            </span>
            <span className="text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full font-mono">
              الدرجة: {score} / {questions.length}
            </span>
          </div>

          {/* Question Text */}
          <h6 className={`font-extrabold text-sm leading-relaxed ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
            {currentQuestion.text}
          </h6>

          {/* Options Grid */}
          <div className="grid grid-cols-1 gap-2">
            {currentQuestion.options.map((opt, oIdx) => {
              const isSelected = selectedOpt === oIdx;
              const isCorrectOpt = oIdx === currentQuestion.correctIndex;
              
              let optStyles = '';
              if (isAnswerSubmitted) {
                if (isCorrectOpt) {
                  optStyles = 'bg-emerald-500/15 border-emerald-500 dark:border-emerald-500/80 text-emerald-600 dark:text-emerald-400 font-bold';
                } else if (isSelected) {
                  optStyles = 'bg-rose-500/15 border-rose-500 dark:border-rose-500/80 text-rose-600 dark:text-rose-400';
                } else {
                  optStyles = 'opacity-40 border-slate-200/45 dark:border-slate-800/40';
                }
              } else {
                optStyles = isSelected
                  ? 'bg-indigo-500/10 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-semibold shadow-sm'
                  : 'bg-white/40 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 hover:bg-white/90 dark:hover:bg-slate-850/60 text-slate-700 dark:text-slate-300';
              }

              return (
                <button
                  key={oIdx}
                  disabled={isAnswerSubmitted}
                  onClick={() => handleOptionSelect(oIdx)}
                  className={`p-3 text-right text-xs rounded-xl border cursor-pointer transition-all flex justify-between items-center gap-2 ${optStyles}`}
                >
                  <span>{opt}</span>
                  {isAnswerSubmitted && isCorrectOpt && (
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  )}
                  {isAnswerSubmitted && isSelected && !isCorrectOpt && (
                    <XCircle className="h-4 w-4 text-rose-500 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Answer explanation panel */}
          {isAnswerSubmitted && (
            <div className={`p-3 rounded-xl border text-[11px] leading-relaxed flex items-start gap-2 ${
              selectedOpt === currentQuestion.correctIndex
                ? 'bg-emerald-950/20 border-emerald-900/40 text-slate-300'
                : 'bg-indigo-950/20 border-indigo-900/40 text-slate-300'
            }`}>
              <AlertCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <strong>توضيح الشيخ وتوجيهه: </strong>
                <span>{currentQuestion.explanation}</span>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-end pt-2">
            {!isAnswerSubmitted ? (
              <button
                disabled={selectedOpt === null}
                onClick={handleSubmitAnswer}
                className={`text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer transition-all ${
                  selectedOpt === null
                    ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                }`}
              >
                تحقق من الإجابة ✓
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer transition-all flex items-center gap-1"
              >
                <span>{currentIdx < questions.length - 1 ? 'السؤال التالي' : 'عرض النتيجة النهائية'}</span>
                <ArrowLeft className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
