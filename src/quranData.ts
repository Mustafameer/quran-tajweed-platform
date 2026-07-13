/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { QuranVerse } from './types';

export const QURAN_DATABASE: QuranVerse[] = [
  // Surah Al-Fatihah (1)
  { surahNumber: 1, surahName: 'الفاتحة', ayahNumber: 1, text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ' },
  { surahNumber: 1, surahName: 'الفاتحة', ayahNumber: 2, text: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ' },
  { surahNumber: 1, surahName: 'الفاتحة', ayahNumber: 3, text: 'الرَّحْمَٰنِ الرَّحِيمِ' },
  { surahNumber: 1, surahName: 'الفاتحة', ayahNumber: 4, text: 'مَالِكِ يَوْمِ الدِّينِ' },
  { surahNumber: 1, surahName: 'الفاتحة', ayahNumber: 5, text: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ' },
  { surahNumber: 1, surahName: 'الفاتحة', ayahNumber: 6, text: 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ' },
  { surahNumber: 1, surahName: 'الفاتحة', ayahNumber: 7, text: 'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ' },

  // Surah Al-Baqarah (2) - Ayahs 1 to 10
  { surahNumber: 2, surahName: 'البقرة', ayahNumber: 1, text: 'الم' },
  { surahNumber: 2, surahName: 'البقرة', ayahNumber: 2, text: 'ذَٰلِكَ الْكِتَابُ لَا رَيْبَ ۛ فِيهِ ۛ هُدًى لِّلْمُتَّقِينَ' },
  { surahNumber: 2, surahName: 'البقرة', ayahNumber: 3, text: 'الَّذِينَ يُؤْمِنُونَ بِالْغَيْبِ وَيُقِيمُونَ الصَّلَاةَ وَمِمَّا رَزَقْنَاهُمْ يُنفِقُونَ' },
  { surahNumber: 2, surahName: 'البقرة', ayahNumber: 4, text: 'وَالَّذِينَ يُؤْمِنُونَ بِمَا أُنزِلَ إِلَيْكَ وَمَا أُنزِلَ مِن قَبْلِكَ وَبِالْآخِرَةِ هُمْ يُوقِنُونَ' },
  { surahNumber: 2, surahName: 'البقرة', ayahNumber: 5, text: 'أُولَٰئِكَ عَلَىٰ هُدًى مِّن رَّبِّهِمْ ۖ وَأُولَٰئِكَ هُمُ الْمُفْلِحُونَ' },
  { surahNumber: 2, surahName: 'البقرة', ayahNumber: 6, text: 'إِنَّ الَّذِينَ كَفَرُوا سَوَاءٌ عَلَيْهِمْ أَأَنذَرْتَهُمْ أَمْ لَمْ تُنذِرْهُمْ لَا يُؤْمِنُونَ' },
  { surahNumber: 2, surahName: 'البقرة', ayahNumber: 7, text: 'خَتَمَ اللَّهُ عَلَىٰ قُلُوبِهِمْ وَعَلَىٰ سَمْعِهِمْ ۖ وَعَلَىٰ أَبْصَارِهِمْ غِشَاوَةٌ ۖ وَلَهُمْ عَذَابٌ عَظِيمٌ' },
  { surahNumber: 2, surahName: 'البقرة', ayahNumber: 8, text: 'وَمِنَ النَّاسِ مَن يَقُولُ آمَنَّا بِاللَّهِ وَبِالْيَوْمِ الْآخِرِ وَمَا هُم بِمُؤْمِنِينَ' },
  { surahNumber: 2, surahName: 'البقرة', ayahNumber: 9, text: 'يُخَادِعُونَ اللَّهَ وَالَّذِينَ آمَنُوا وَمَا يَخْدَعُونَ إِلَّا أَنفُسَهُمْ وَمَا يَشْعُرُونَ' },
  { surahNumber: 2, surahName: 'البقرة', ayahNumber: 10, text: 'فِي قُلُوبِهِم مَّرَضٌ فَزَادَهُمُ اللَّهُ مَرَضًا ۖ وَلَهُمْ عَذَابٌ أَلِيمٌ بِمَا كَانُوا يَكْذِبُونَ' },

  // Surah Al-Mulk (67) - Ayahs 1 to 5
  { surahNumber: 67, surahName: 'الملك', ayahNumber: 1, text: 'تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ' },
  { surahNumber: 67, surahName: 'الملك', ayahNumber: 2, text: 'الَّذِي خَلَقَ الْمَوْتَ وَالْحَيَاةَ لِيَبْلُوَكُمْ أَيُّكُمْ أَحْسَنُ عَمَلًا ۚ وَهُوَ الْعَزِيزُ الْغَفُورُ' },
  { surahNumber: 67, surahName: 'الملك', ayahNumber: 3, text: 'الَّذِي خَلَقَ سَبْعَ سَمَاوَاتٍ طِبَاقًا ۖ مَّا تَرَىٰ فِي خَلْقِ الرَّحْمَٰنِ مِن تَفَاوُتٍ ۖ فَارْجِعِ الْبَصَرَ هَلْ تَرَىٰ مِن فُطُورٍ' },
  { surahNumber: 67, surahName: 'الملك', ayahNumber: 4, text: 'ثُمَّ ارْجِعِ الْبَصَرَ كَرَّتَيْنِ يَنقَلِبْ إِلَيْكَ الْبَصَرُ خَاسِئًا وَهُوَ حَسِيرٌ' },
  { surahNumber: 67, surahName: 'الملك', ayahNumber: 5, text: 'وَلَقَدْ زَيَّنَّا السَّمَاءَ الدُّنْيَا بِمَصَابِيحَ وَجَعَلْنَاهَا رُجُومًا لِّلشَّيَاطِينِ ۖ وَأَعْتَدْنَا لَهُمْ عَذَابَ السَّعِيرِ' },

  // Surah Al-Ikhlas (112)
  { surahNumber: 112, surahName: 'الإخلاص', ayahNumber: 1, text: 'قُلْ هُوَ اللَّهُ أَحَدٌ' },
  { surahNumber: 112, surahName: 'الإخلاص', ayahNumber: 2, text: 'اللَّهُ الصَّمَدُ' },
  { surahNumber: 112, surahName: 'الإخلاص', ayahNumber: 3, text: 'لَمْ يَلِدْ وَلَمْ يُولَدْ' },
  { surahNumber: 112, surahName: 'الإخلاص', ayahNumber: 4, text: 'وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ' },

  // Surah Al-Falaq (113)
  { surahNumber: 113, surahName: 'الفلق', ayahNumber: 1, text: 'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ' },
  { surahNumber: 113, surahName: 'الفلق', ayahNumber: 2, text: 'مِن شَرِّ مَا خَلَقَ' },
  { surahNumber: 113, surahName: 'الفلق', ayahNumber: 3, text: 'وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ' },
  { surahNumber: 113, surahName: 'الفلق', ayahNumber: 4, text: 'وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ' },
  { surahNumber: 113, surahName: 'الفلق', ayahNumber: 5, text: 'وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ' },

  // Surah An-Nas (114)
  { surahNumber: 114, surahName: 'الناس', ayahNumber: 1, text: 'قُلْ أَعُوذُ بِرَبِّ النَّاسِ' },
  { surahNumber: 114, surahName: 'الناس', ayahNumber: 2, text: 'مَلِكِ النَّاسِ' },
  { surahNumber: 114, surahName: 'الناس', ayahNumber: 3, text: 'إِلَٰهِ النَّاسِ' },
  { surahNumber: 114, surahName: 'الناس', ayahNumber: 4, text: 'مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ' },
  { surahNumber: 114, surahName: 'الناس', ayahNumber: 5, text: 'الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ' },
  { surahNumber: 114, surahName: 'الناس', ayahNumber: 6, text: 'مِنَ الْجِنَّةِ وَالنَّاسِ' }
];

export interface SurahMeta {
  number: number;
  name: string;
  totalAyahs: number;
}

export const SURAH_LIST: SurahMeta[] = [
  { number: 1, name: 'الفاتحة', totalAyahs: 7 },
  { number: 2, name: 'البقرة', totalAyahs: 286 },
  { number: 3, name: 'آل عمران', totalAyahs: 200 },
  { number: 4, name: 'النساء', totalAyahs: 176 },
  { number: 5, name: 'المائدة', totalAyahs: 120 },
  { number: 6, name: 'النعام', totalAyahs: 165 },
  { number: 7, name: 'الأعراف', totalAyahs: 206 },
  { number: 8, name: 'الأنفال', totalAyahs: 75 },
  { number: 9, name: 'التوبة', totalAyahs: 129 },
  { number: 10, name: 'يونس', totalAyahs: 109 },
  { number: 11, name: 'هود', totalAyahs: 123 },
  { number: 12, name: 'يوسف', totalAyahs: 111 },
  { number: 13, name: 'الرعد', totalAyahs: 43 },
  { number: 14, name: 'إبراهيم', totalAyahs: 52 },
  { number: 15, name: 'الحجر', totalAyahs: 99 },
  { number: 16, name: 'النحل', totalAyahs: 128 },
  { number: 17, name: 'الإسراء', totalAyahs: 111 },
  { number: 18, name: 'الكهف', totalAyahs: 110 },
  { number: 19, name: 'مريم', totalAyahs: 98 },
  { number: 20, name: 'طه', totalAyahs: 135 },
  { number: 21, name: 'الأنبياء', totalAyahs: 112 },
  { number: 22, name: 'الحج', totalAyahs: 78 },
  { number: 23, name: 'المؤمنون', totalAyahs: 118 },
  { number: 24, name: 'النور', totalAyahs: 64 },
  { number: 25, name: 'الفرقان', totalAyahs: 77 },
  { number: 26, name: 'الشعراء', totalAyahs: 227 },
  { number: 27, name: 'النمل', totalAyahs: 93 },
  { number: 28, name: 'القصص', totalAyahs: 88 },
  { number: 29, name: 'العنكبوت', totalAyahs: 69 },
  { number: 30, name: 'الروم', totalAyahs: 60 },
  { number: 31, name: 'لقمان', totalAyahs: 34 },
  { number: 32, name: 'السجدة', totalAyahs: 30 },
  { number: 33, name: 'الأحزاب', totalAyahs: 73 },
  { number: 34, name: 'سبأ', totalAyahs: 54 },
  { number: 35, name: 'فاطر', totalAyahs: 45 },
  { number: 36, name: 'يس', totalAyahs: 83 },
  { number: 37, name: 'الصافات', totalAyahs: 182 },
  { number: 38, name: 'ص', totalAyahs: 88 },
  { number: 39, name: 'الزمر', totalAyahs: 75 },
  { number: 40, name: 'غافر', totalAyahs: 85 },
  { number: 41, name: 'فصلت', totalAyahs: 54 },
  { number: 42, name: 'الشورى', totalAyahs: 53 },
  { number: 43, name: 'الزخرف', totalAyahs: 89 },
  { number: 44, name: 'الدخان', totalAyahs: 59 },
  { number: 45, name: 'الجاثية', totalAyahs: 37 },
  { number: 46, name: 'الأحقاف', totalAyahs: 35 },
  { number: 47, name: 'محمد', totalAyahs: 38 },
  { number: 48, name: 'الفتح', totalAyahs: 29 },
  { number: 49, name: 'الحجرات', totalAyahs: 18 },
  { number: 50, name: 'ق', totalAyahs: 45 },
  { number: 51, name: 'الذاريات', totalAyahs: 60 },
  { number: 52, name: 'الطور', totalAyahs: 49 },
  { number: 53, name: 'النجم', totalAyahs: 62 },
  { number: 54, name: 'القمر', totalAyahs: 55 },
  { number: 55, name: 'الرحمن', totalAyahs: 78 },
  { number: 56, name: 'الواقعة', totalAyahs: 96 },
  { number: 57, name: 'الحديد', totalAyahs: 29 },
  { number: 58, name: 'المجادلة', totalAyahs: 22 },
  { number: 59, name: 'الحشر', totalAyahs: 24 },
  { number: 60, name: 'الممتحنة', totalAyahs: 13 },
  { number: 61, name: 'الصف', totalAyahs: 14 },
  { number: 62, name: 'الجمعة', totalAyahs: 11 },
  { number: 63, name: 'المنافقون', totalAyahs: 11 },
  { number: 64, name: 'التغابن', totalAyahs: 18 },
  { number: 65, name: 'الطلاق', totalAyahs: 12 },
  { number: 66, name: 'التحريم', totalAyahs: 12 },
  { number: 67, name: 'الملك', totalAyahs: 30 },
  { number: 68, name: 'القلم', totalAyahs: 52 },
  { number: 69, name: 'الحاقة', totalAyahs: 52 },
  { number: 70, name: 'المعارج', totalAyahs: 44 },
  { number: 71, name: 'نوح', totalAyahs: 28 },
  { number: 72, name: 'الجن', totalAyahs: 28 },
  { number: 73, name: 'المزمل', totalAyahs: 20 },
  { number: 74, name: 'المدثر', totalAyahs: 56 },
  { number: 75, name: 'القيامة', totalAyahs: 40 },
  { number: 76, name: 'الإنسان', totalAyahs: 31 },
  { number: 77, name: 'المرسلات', totalAyahs: 50 },
  { number: 78, name: 'النبأ', totalAyahs: 40 },
  { number: 79, name: 'النازعات', totalAyahs: 46 },
  { number: 80, name: 'عبس', totalAyahs: 42 },
  { number: 81, name: 'التكوير', totalAyahs: 29 },
  { number: 82, name: 'الانفطار', totalAyahs: 19 },
  { number: 83, name: 'المطففين', totalAyahs: 36 },
  { number: 84, name: 'الانشقاق', totalAyahs: 25 },
  { number: 85, name: 'البروج', totalAyahs: 22 },
  { number: 86, name: 'الطارق', totalAyahs: 17 },
  { number: 87, name: 'الأعلى', totalAyahs: 19 },
  { number: 88, name: 'الغاشية', totalAyahs: 26 },
  { number: 89, name: 'الفجر', totalAyahs: 30 },
  { number: 90, name: 'البلد', totalAyahs: 20 },
  { number: 91, name: 'الشمس', totalAyahs: 15 },
  { number: 92, name: 'الليل', totalAyahs: 21 },
  { number: 93, name: 'الضحى', totalAyahs: 11 },
  { number: 94, name: 'الشرح', totalAyahs: 8 },
  { number: 95, name: 'التين', totalAyahs: 8 },
  { number: 96, name: 'العلق', totalAyahs: 19 },
  { number: 97, name: 'القدر', totalAyahs: 5 },
  { number: 98, name: 'البينة', totalAyahs: 8 },
  { number: 99, name: 'الزلزلة', totalAyahs: 8 },
  { number: 100, name: 'العاديات', totalAyahs: 11 },
  { number: 101, name: 'القارعة', totalAyahs: 11 },
  { number: 102, name: 'التكاثر', totalAyahs: 8 },
  { number: 103, name: 'العصر', totalAyahs: 3 },
  { number: 104, name: 'الهمزة', totalAyahs: 9 },
  { number: 105, name: 'الفيل', totalAyahs: 5 },
  { number: 106, name: 'قريش', totalAyahs: 4 },
  { number: 107, name: 'الماعون', totalAyahs: 7 },
  { number: 108, name: 'الكوثر', totalAyahs: 3 },
  { number: 109, name: 'الكافرون', totalAyahs: 6 },
  { number: 110, name: 'النصر', totalAyahs: 3 },
  { number: 111, name: 'المسد', totalAyahs: 5 },
  { number: 112, name: 'الإخلاص', totalAyahs: 4 },
  { number: 113, name: 'الفلق', totalAyahs: 5 },
  { number: 114, name: 'الناس', totalAyahs: 6 }
];

export interface Reciter {
  id: string;
  name: string;
}

export const RECITERS_LIST: Reciter[] = [
  { id: 'ar.husary', name: 'الشيخ محمود خليل الحصري' },
  { id: 'ar.minshawi', name: 'الشيخ محمد صديق المنشاوي' },
  { id: 'ar.abdulbasitmurattal', name: 'الشيخ عبد الباسط عبد الصمد' }
];

export function getVersesRange(surahNumber: number, startAyah: number, endAyah: number): QuranVerse[] {
  return QURAN_DATABASE.filter(
    v => v.surahNumber === surahNumber && v.ayahNumber >= startAyah && v.ayahNumber <= endAyah
  );
}

export function searchQuranText(query: string): QuranVerse[] {
  if (!query) return [];
  const normalizedQuery = query.toLowerCase().trim();
  return QURAN_DATABASE.filter(v => 
    v.text.toLowerCase().includes(normalizedQuery) ||
    v.surahName.includes(normalizedQuery)
  );
}

export function getGlobalAyahNumber(surahNum: number, ayahNum: number): number {
  let globalIndex = 0;
  for (let i = 1; i < surahNum; i++) {
    const surah = SURAH_LIST.find(s => s.number === i);
    if (surah) {
      globalIndex += surah.totalAyahs;
    }
  }
  return globalIndex + ayahNum;
}
