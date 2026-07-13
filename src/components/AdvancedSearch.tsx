import React, { useState, useEffect } from 'react';
import { Search, Book, FileText, Sparkles, HelpCircle, ArrowLeftRight, HelpCircle as HelpIcon, Check } from 'lucide-react';
import { QURAN_DATABASE, SURAH_LIST } from '../quranData';
import { Lesson, QuranVerse } from '../types';

interface AdvancedSearchProps {
  lessons: Lesson[];
  isDark?: boolean;
  onSelectQuranVerse?: (verse: QuranVerse) => void;
  onSelectLesson?: (lesson: Lesson) => void;
}

export default function AdvancedSearch({ lessons, isDark = false, onSelectQuranVerse, onSelectLesson }: AdvancedSearchProps) {
  const [query, setQuery] = useState('');
  const [searchTab, setSearchTab] = useState<'all' | 'quran' | 'lessons'>('all');
  
  // Offline state
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Parsed search states
  const [parsedSurah, setParsedSurah] = useState<string | null>(null);
  const [parsedAyah, setParsedAyah] = useState<number | null>(null);

  // Results
  const [quranResults, setQuranResults] = useState<QuranVerse[]>([]);
  const [lessonResults, setLessonResults] = useState<Lesson[]>([]);

  // Simple smart parsing helper
  // Checks if the user typed something like "الفاتحة 3" or "البقرة آية 5"
  const parseSmartQuery = (rawQuery: string) => {
    const trimmed = rawQuery.trim().replace(/\s+/g, ' ');
    if (!trimmed) {
      setParsedSurah(null);
      setParsedAyah(null);
      return;
    }

    // Try finding surah names in the query
    let foundSurahName: string | null = null;
    let foundAyahNum: number | null = null;

    // Check if any surah name in SURAH_LIST matches
    for (const surah of SURAH_LIST) {
      if (trimmed.includes(surah.name)) {
        foundSurahName = surah.name;
        break;
      }
    }

    // Look for numbers in the query
    const numberMatches = trimmed.match(/\d+/g);
    if (numberMatches && numberMatches.length > 0) {
      foundAyahNum = parseInt(numberMatches[0]);
    }

    setParsedSurah(foundSurahName);
    setParsedAyah(foundAyahNum);
  };

  // Premium Arabic diacritic-aware text highlighting function
  const highlightText = (text: string, searchWord: string) => {
    if (!searchWord || !searchWord.trim()) return <span>{text}</span>;

    // Normalization helper for accurate Arabic matching
    const normalize = (str: string) => {
      return str
        .replace(/[\u064B-\u065F]/g, '') // strip all Arabic diacritics
        .replace(/[أإآا]/g, 'ا')        // normalize Alef variants
        .replace(/ة/g, 'ه')            // normalize Teh Marbuta
        .replace(/ى/g, 'ي')            // normalize Alef Maksura
        .toLowerCase();
    };

    const normalizedText = normalize(text);
    const normalizedQuery = normalize(searchWord);

    if (!normalizedQuery || !normalizedText.includes(normalizedQuery)) {
      return <span>{text}</span>;
    }

    // Find the position of match in normalized string
    const matchIndex = normalizedText.indexOf(normalizedQuery);
    if (matchIndex === -1) return <span>{text}</span>;

    // Map normalized index back to original text with diacritics
    let normIdx = 0;
    let startOriginalIdx = -1;
    let endOriginalIdx = -1;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const isDiacritic = char.match(/[\u064B-\u065F]/);
      
      let normChar = char;
      if (!isDiacritic) {
        if (char === 'أ' || char === 'إ' || char === 'آ' || char === 'ا') normChar = 'ا';
        else if (char === 'ة') normChar = 'ه';
        else if (char === 'ى') normChar = 'ي';
        
        if (normIdx === matchIndex) {
          startOriginalIdx = i;
        }
        
        normIdx++;
        
        if (normIdx === matchIndex + normalizedQuery.length) {
          endOriginalIdx = i + 1;
          break;
        }
      }
    }

    // Keep trailing diacritics if present
    if (endOriginalIdx !== -1) {
      while (endOriginalIdx < text.length && text[endOriginalIdx].match(/[\u064B-\u065F]/)) {
        endOriginalIdx++;
      }
    }

    if (startOriginalIdx !== -1 && endOriginalIdx !== -1) {
      const prefix = text.slice(0, startOriginalIdx);
      const match = text.slice(startOriginalIdx, endOriginalIdx);
      const suffix = text.slice(endOriginalIdx);

      return (
        <span>
          {prefix}
          <mark className="bg-amber-100 dark:bg-emerald-500/20 text-emerald-900 dark:text-emerald-100 font-bold px-1 rounded border-b-2 border-emerald-500 shadow-xs inline-block">{match}</mark>
          {suffix}
        </span>
      );
    }

    return <span>{text}</span>;
  };

  useEffect(() => {
    parseSmartQuery(query);

    if (!query.trim()) {
      setQuranResults([]);
      setLessonResults([]);
      return;
    }

    const normQuery = query.toLowerCase().trim();

    // 1. Search Quran
    // If we have a parsed surah name and a parsed ayah, look for that exact coordinate
    let qResults: QuranVerse[] = [];
    if (parsedSurah && parsedAyah !== null) {
      qResults = QURAN_DATABASE.filter(v => 
        v.surahName === parsedSurah && v.ayahNumber === parsedAyah
      );
    }
    
    // If no exact coordinate matched, fallback to keyword search on text and surah name
    if (qResults.length === 0) {
      qResults = QURAN_DATABASE.filter(v => 
        v.text.replace(/[\u064B-\u065F]/g, '').toLowerCase().includes(normQuery) || // Search un-vowelled (simple)
        v.text.toLowerCase().includes(normQuery) ||                                 // Search with diacritics
        v.surahName.toLowerCase().includes(normQuery)
      );
    }
    setQuranResults(qResults);

    // 2. Search Lessons
    const lResults = lessons.filter(l => 
      l.title.toLowerCase().includes(normQuery) ||
      l.description.toLowerCase().includes(normQuery)
    );
    setLessonResults(lResults);

  }, [query, parsedSurah, parsedAyah, lessons]);

  // Quick suggestions trigger
  const handleQuickSearch = (text: string) => {
    setQuery(text);
  };

  return (
    <div className={`p-6 rounded-3xl border transition-all text-right ${
      isDark ? 'bg-[#121826] border-slate-850' : 'bg-white border-slate-100 shadow-sm'
    }`} id="advanced-search-component">
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 bg-emerald-600/10 text-emerald-600 rounded-xl flex items-center justify-center font-bold">
          <Search className="h-5 w-5" />
        </div>
        <div>
          <h3 className={`text-base font-extrabold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>محرك البحث القرآني والمنهجي المتقدم</h3>
          <p className="text-slate-400 text-xs mt-0.5">ابحث بالكلمات المفتاحية، أو باسم السورة ورقم الآية (مثال: الفاتحة 4 أو الناس 2)</p>
        </div>
      </div>

      {isOffline && (
        <div className="mb-5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-400 text-[10px] font-bold flex items-start gap-2 leading-relaxed" id="offline-search-banner">
          <span className="text-sm">📶</span>
          <div>
            <strong>تصفح غير متصل بالإنترنت نشط:</strong> يتم البحث الآن محلياً بنجاح في نصوص سور القرآن الكريم ومقالات تجويد المناهج المحملة والمحفوظة مسبقاً في قاعدة بيانات المتصفح الآمنة <strong>IndexedDB</strong>.
          </div>
        </div>
      )}

      {/* Main Search Input Form */}
      <div className="space-y-4">
        <div className="relative">
          <input
            type="text"
            placeholder="اكتب كلمة، آية، اسم السورة أو موضوعاً تجويدياً..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={`w-full px-4 py-3.5 pr-11 rounded-2xl text-xs font-bold border outline-none transition-all ${
              isDark 
                ? 'bg-slate-900 border-slate-800 text-slate-150 focus:border-emerald-500' 
                : 'bg-slate-50/50 border-slate-200 text-slate-800 focus:border-emerald-600 focus:bg-white shadow-2xs'
            }`}
          />
          <Search className="absolute right-4 top-3.5 h-4.5 w-4.5 text-slate-400" />
          
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="absolute left-4 top-3.5 text-xs text-slate-400 hover:text-rose-500 font-bold"
            >
              مسح
            </button>
          )}
        </div>

        {/* Smart Query Parsing Feedbacks */}
        {parsedSurah && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold w-fit">
            <Sparkles className="h-3.5 w-3.5 text-emerald-500 fill-current animate-pulse" />
            <span>نظام الذكاء التلقائي: تم التعرف على سورة <strong>{parsedSurah}</strong> {parsedAyah ? `الآية ${parsedAyah}` : ''}</span>
          </div>
        )}

        {/* Search Suggestion Pills */}
        <div className="flex items-center gap-2 flex-wrap text-xs text-slate-400">
          <span className="font-bold">مقترحات بحث سريعة:</span>
          <button 
            onClick={() => handleQuickSearch('الرحمن الرحيم')}
            className={`px-3 py-1 rounded-lg border text-[11px] font-bold transition-all ${
              isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200/70'
            }`}
          >
            الرحمن الرحيم 📖
          </button>
          <button 
            onClick={() => handleQuickSearch('الملك 1')}
            className={`px-3 py-1 rounded-lg border text-[11px] font-bold transition-all ${
              isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200/70'
            }`}
          >
            سورة الملك آية 1 🧭
          </button>
          <button 
            onClick={() => handleQuickSearch('تجويد')}
            className={`px-3 py-1 rounded-lg border text-[11px] font-bold transition-all ${
              isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200/70'
            }`}
          >
            دروس التجويد 📖
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex border-b border-slate-150 dark:border-slate-800/80 pt-2 gap-4">
          <button
            onClick={() => setSearchTab('all')}
            className={`pb-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              searchTab === 'all'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            الكل ({quranResults.length + lessonResults.length})
          </button>
          <button
            onClick={() => setSearchTab('quran')}
            className={`pb-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              searchTab === 'quran'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            في الآيات والقرآن ({quranResults.length})
          </button>
          <button
            onClick={() => setSearchTab('lessons')}
            className={`pb-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              searchTab === 'lessons'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            في الدروس والمناهج ({lessonResults.length})
          </button>
        </div>

        {/* Display Search Results */}
        <div className="space-y-4 pt-2">
          {/* 1. Quran Results */}
          {(searchTab === 'all' || searchTab === 'quran') && quranResults.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 tracking-wider">النتائج المطابقة من كتاب الله تعالى:</h4>
              <div className="grid grid-cols-1 gap-2.5">
                {quranResults.map((verse, index) => (
                  <div 
                    key={index} 
                    onClick={() => onSelectQuranVerse && onSelectQuranVerse(verse)}
                    className={`p-4 rounded-2xl border transition-all text-right cursor-pointer group ${
                      isDark 
                        ? 'bg-[#172033] border-slate-800 hover:border-slate-700 hover:bg-slate-900/50' 
                        : 'bg-slate-50/50 border-slate-100 hover:bg-white hover:border-slate-200 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        سورة {verse.surahName} (الآية {verse.ayahNumber})
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono font-bold">تطابق لفظي</span>
                    </div>
                    <p className="font-serif text-lg leading-relaxed text-slate-800 dark:text-slate-100 mt-1 pl-2 font-medium">
                      {highlightText(verse.text, query)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Lesson Results */}
          {(searchTab === 'all' || searchTab === 'lessons') && lessonResults.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-[10px] font-extrabold text-indigo-500 dark:text-indigo-400 tracking-wider">النتائج المطابقة من كتيبات ودروس التجويد:</h4>
              <div className="grid grid-cols-1 gap-2.5">
                {lessonResults.map((lesson, index) => (
                  <div 
                    key={index}
                    onClick={() => onSelectLesson && onSelectLesson(lesson)}
                    className={`p-4 rounded-2xl border transition-all text-right cursor-pointer group ${
                      isDark 
                        ? 'bg-[#172033] border-slate-800 hover:border-slate-700 hover:bg-slate-900/50' 
                        : 'bg-slate-50/50 border-slate-100 hover:bg-white hover:border-slate-200 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                        <FileText className="h-3 w-3" /> كتيب تجويد
                      </span>
                      <span className="text-[10px] text-slate-400 font-sans font-bold">المعلم: {lesson.teacherName || 'الشيخ'}</span>
                    </div>
                    <h5 className="font-extrabold text-xs text-slate-800 dark:text-slate-200">
                      {highlightText(lesson.title, query)}
                    </h5>
                    <p className="text-[11px] text-slate-550 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed font-medium">
                      {highlightText(lesson.description, query)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No results state */}
          {query.trim() !== '' && quranResults.length === 0 && lessonResults.length === 0 && (
            <div className="text-center py-10">
              <HelpIcon className="h-9 w-9 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
              <p className="text-xs text-slate-400 font-bold">لم نجد أي نتائج مطابقة لعبارة البحث: "{query}"</p>
              <p className="text-[10px] text-slate-500 mt-1">تأكد من كتابة الكلمات بشكل صحيح أو حاول استخدام كلمات مفتاحية أخرى.</p>
            </div>
          )}

          {/* Empty search state */}
          {!query.trim() && (
            <div className="text-center py-12 border border-dashed border-slate-150 dark:border-slate-800/80 rounded-2xl bg-slate-50/10">
              <Book className="h-8 w-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
              <p className="text-xs text-slate-400 font-bold">ابدأ بالكتابة أعلاه لعرض نتائج البحث الفوري.</p>
              <p className="text-[10px] text-slate-500 mt-1">محرك البحث يعرض النتائج فورا أثناء كتابتك.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
