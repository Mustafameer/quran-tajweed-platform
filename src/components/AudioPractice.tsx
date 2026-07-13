import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Play, Pause, Trash2, Send, Clock, CheckCircle, AlertCircle, FileAudio, Sparkles, Volume2 } from 'lucide-react';
import { User, PracticeClip, Lesson } from '../types';
import { useToast } from './Toast';

interface AudioPracticeProps {
  currentUser: User;
  isDark?: boolean;
  lessons: Lesson[];
}

export default function AudioPractice({ currentUser, isDark = false, lessons }: AudioPracticeProps) {
  const { showToast } = useToast();
  
  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string>('custom');
  const [customTitle, setCustomTitle] = useState<string>('');
  const [studentNotes, setStudentNotes] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  
  // History states
  const [clips, setClips] = useState<PracticeClip[]>([]);
  const [isLoadingClips, setIsLoadingClips] = useState(false);

  // References
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<any>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Load past practice clips for this student
  const fetchMyClips = async () => {
    setIsLoadingClips(true);
    try {
      const res = await fetch('/api/practice-clips');
      if (res.ok) {
        const data: PracticeClip[] = await res.json();
        // Filter for current student's clips
        setClips(data.filter(c => c.studentId === currentUser.id));
      }
    } catch (err) {
      console.error('Error fetching practice clips:', err);
    } finally {
      setIsLoadingClips(false);
    }
  };

  useEffect(() => {
    fetchMyClips();
  }, []);

  // Timer effect
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  // Start recording audio
  const startRecording = async () => {
    try {
      setAudioBlob(null);
      setAudioUrl(null);
      chunksRef.current = [];
      setRecordingDuration(0);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        showToast('⏹️ تم إيقاف التسجيل بنجاح! يمكنك الآن الاستماع وتأكيد الرفع.', 'info');
      };

      mediaRecorder.start();
      setIsRecording(true);
      showToast('🎤 جاري تسجيل تلاوتك الآن... تحدّث بوضوح بالقرب من الميكروفون', 'success');
    } catch (err: any) {
      console.error('Error starting recording:', err);
      showToast('❌ تعذر الوصول للميكروفون. يرجى السماح بالصلاحية والمحاولة مجدداً.', 'error');
    }
  };

  // Stop recording audio
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Stop all tracks in stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    }
  };

  // Format recording timer: mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Convert Blob to Base64 Data URI
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Upload recording clip
  const handleUpload = async () => {
    if (!audioBlob) {
      showToast('يرجى تسجيل مقطع صوتي أولاً', 'warning');
      return;
    }

    let title = customTitle.trim();
    if (selectedLessonId !== 'custom') {
      const selectedLesson = lessons.find(l => l.id === selectedLessonId);
      title = selectedLesson ? `تسميع: ${selectedLesson.title}` : 'تلاوة درس تجويد';
    }

    if (!title) {
      showToast('يرجى إدخال عنوان للتسجيل أو اختيار درس من القائمة', 'warning');
      return;
    }

    setIsUploading(true);
    try {
      const base64Audio = await blobToBase64(audioBlob);

      const res = await fetch('/api/practice-clips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: currentUser.id,
          studentName: currentUser.fullName,
          title: title,
          audioUrl: base64Audio,
          notes: studentNotes.trim()
        })
      });

      if (res.ok) {
        showToast('🎯 تم رفع مقطع تلاوتك بنجاح وسيكون متاحاً لمراجعة المعلم وتقييمه!', 'success');
        setAudioBlob(null);
        setAudioUrl(null);
        setCustomTitle('');
        setStudentNotes('');
        setSelectedLessonId('custom');
        fetchMyClips();
      } else {
        const err = await res.json();
        showToast(err.error || 'فشل في رفع الملف الصوتي', 'error');
      }
    } catch (err) {
      console.error('Error uploading practice clip:', err);
      showToast('حدث خطأ أثناء رفع الملف الصوتي', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6 text-right" id="audio-practice-container">
      <div className={`p-6 rounded-2xl border transition-all ${isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
        <div className="flex items-center gap-2.5 mb-6">
          <div className="h-10 w-10 bg-emerald-600/10 text-emerald-600 rounded-xl flex items-center justify-center font-bold">
            <Mic className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold">تسجيل مقطع صوتي وتسميع التلاوة</h3>
            <p className="text-xs text-slate-400 mt-1">سجل قراءتك للآيات المقررة، وسيرسل المقطع لشيخ الحلقة ليقوم بتصحيح مخارج حروفك وأحكام التجويد لديك.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Recorder Controls Panel (7 columns) */}
          <div className="md:col-span-7 space-y-5">
            {/* Main Recorder Interactive Box */}
            <div className={`p-8 rounded-2xl border flex flex-col items-center justify-center relative overflow-hidden transition-all text-center ${
              isRecording 
                ? 'bg-rose-500/5 border-rose-500/30' 
                : isDark 
                  ? 'bg-slate-900/60 border-slate-800' 
                  : 'bg-slate-50 border-slate-100'
            }`}>
              {/* Pulsing Visual Indicator during Recording */}
              {isRecording && (
                <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-rose-600 text-white px-2.5 py-1 rounded-full text-[10px] font-black animate-pulse">
                  <span className="h-2 w-2 bg-white rounded-full" />
                  <span>جاري التسجيل حياً</span>
                </div>
              )}

              {/* Dynamic Sound waves */}
              <div className="h-16 flex items-center justify-center gap-1 mb-4 w-full">
                {isRecording ? (
                  [...Array(12)].map((_, i) => (
                    <span 
                      key={i} 
                      className="w-1.5 bg-rose-500 rounded-full animate-bounce" 
                      style={{ 
                        height: `${Math.floor(Math.random() * 40) + 15}px`,
                        animationDelay: `${i * 0.1}s`,
                        animationDuration: `${0.6 + (i % 3) * 0.2}s`
                      }} 
                    />
                  ))
                ) : audioUrl ? (
                  <FileAudio className="h-14 w-14 text-emerald-500 animate-pulse" />
                ) : (
                  <Mic className="h-12 w-12 text-slate-350 dark:text-slate-700" />
                )}
              </div>

              {/* Duration Timer */}
              <div className="text-2xl font-mono font-bold tracking-wider mb-5">
                {formatTime(recordingDuration)}
              </div>

              {/* Controls triggers */}
              <div className="flex items-center gap-4">
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    id="start-rec-btn"
                    className="h-16 w-16 rounded-full bg-rose-600 hover:bg-rose-550 text-white flex items-center justify-center shadow-lg hover:scale-105 transition-all cursor-pointer"
                    title="بدء التسجيل"
                  >
                    <Mic className="h-7 w-7" />
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    id="stop-rec-btn"
                    className="h-16 w-16 rounded-full bg-slate-900 dark:bg-slate-800 border-2 border-rose-500 text-rose-500 flex items-center justify-center shadow-lg hover:scale-105 transition-all cursor-pointer animate-pulse"
                    title="إيقاف وحفظ التسجيل"
                  >
                    <Square className="h-6 w-6 fill-current" />
                  </button>
                )}
              </div>

              <p className="text-[10px] text-slate-400 mt-4 font-medium">
                {isRecording 
                  ? 'انقر على المربع الأحمر عند الانتهاء لحفظ مقطع التسميع.' 
                  : audioUrl 
                    ? 'تم حفظ التسجيل المؤقت! استمع بالأسفل ثم املأ البيانات لإرساله.' 
                    : 'انقر على زر الميكروفون للبدء في التسجيل الصوتي.'}
              </p>

              {/* Local Audio Player (if recorded) */}
              {audioUrl && (
                <div className={`mt-6 w-full p-3.5 rounded-xl border flex flex-col gap-2 ${
                  isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-100 shadow-sm'
                }`}>
                  <div className="flex justify-between items-center text-xs font-bold mb-1">
                    <span className="text-emerald-500 flex items-center gap-1.5">
                      <Volume2 className="h-4 w-4" /> استمع لتسجيلك قبل الرفع
                    </span>
                    <button
                      onClick={() => {
                        setAudioUrl(null);
                        setAudioBlob(null);
                      }}
                      className="text-rose-500 hover:text-rose-600 text-[10px] font-bold flex items-center gap-0.5"
                    >
                      <Trash2 className="h-3 w-3" /> حذف
                    </button>
                  </div>
                  <audio src={audioUrl} controls className="w-full h-10 accent-emerald-600" />
                </div>
              )}
            </div>
          </div>

          {/* Details & Submission Panel (5 columns) */}
          <div className="md:col-span-5 space-y-4">
            <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
              <h4 className="text-xs font-bold text-slate-400 mb-3.5">تفاصيل المقطع والدرس</h4>
              
              <div className="space-y-4">
                {/* Lesson / Module Selector */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1.5">الربط بدرس أو محور تجويدي <span className="text-rose-500">*</span></label>
                  <select
                    value={selectedLessonId}
                    onChange={(e) => setSelectedLessonId(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-xs border outline-none font-medium ${
                      isDark 
                        ? 'bg-slate-800 border-slate-700 text-slate-200' 
                        : 'bg-white border-slate-250 text-slate-800'
                    }`}
                  >
                    <option value="custom">📝 عنوان مخصص (خارج المنهج)</option>
                    {lessons.map(lesson => (
                      <option key={lesson.id} value={lesson.id}>📖 {lesson.title}</option>
                    ))}
                  </select>
                </div>

                {/* Custom Title Input */}
                {selectedLessonId === 'custom' && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1.5">عنوان التلاوة / الآيات <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      placeholder="مثال: تسميع سورة المطففين (الآيات 1-10)"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      className={`w-full px-3 py-2.5 rounded-xl text-xs border outline-none font-medium ${
                        isDark 
                          ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-emerald-500' 
                          : 'bg-white border-slate-250 text-slate-850 focus:border-emerald-600'
                      }`}
                    />
                  </div>
                )}

                {/* Student notes / queries */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1.5">ملاحظات أو استفسار للمعلم (اختياري)</label>
                  <textarea
                    rows={3}
                    placeholder="مثال: أرجو من الشيخ التركيز على المد المنفصل وتبيان صحة مدّي..."
                    value={studentNotes}
                    onChange={(e) => setStudentNotes(e.target.value)}
                    className={`w-full px-3 py-2.5 rounded-xl text-xs border outline-none resize-none font-medium ${
                      isDark 
                        ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-emerald-500' 
                        : 'bg-white border-slate-250 text-slate-850 focus:border-emerald-600'
                    }`}
                  />
                </div>

                {/* Submit to teacher button */}
                <button
                  onClick={handleUpload}
                  disabled={!audioBlob || isUploading}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-550 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                  <span>{isUploading ? 'جاري رفع تلاوتك...' : 'إرسال التسجيل لتقييم الشيخ المعلم'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* History of submissions */}
      <div className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-100'}`}>
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-base font-bold flex items-center gap-1.5">
            <Clock className="h-5 w-5 text-emerald-500" />
            <span>أرشيف التسميعات والمقاطع المرفوعة</span>
          </h3>
          <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full text-slate-500 dark:text-slate-450 font-bold">
            عدد المقاطع: {clips.length}
          </span>
        </div>

        {isLoadingClips ? (
          <div className="text-center py-8 text-xs text-slate-400">جاري تحميل سجل تلاواتك...</div>
        ) : clips.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-100 dark:border-slate-850 rounded-2xl">
            <FileAudio className="h-10 w-10 text-slate-350 dark:text-slate-750 mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-bold">لم تقم برفع أي تلاوات أو تسجيلات بعد.</p>
            <p className="text-[10px] text-slate-500 mt-1">ابدأ بالتسجيل أعلاه وسجل حضورك وتفاعل مع الشيوخ المعتمدين.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {clips.map(clip => (
              <div 
                key={clip.id} 
                className={`p-4 rounded-xl border transition-all ${
                  isDark ? 'bg-slate-800/30 border-slate-800' : 'bg-slate-50/50 border-slate-100'
                }`}
              >
                <div className="flex justify-between items-start flex-wrap gap-2 mb-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      {clip.title}
                    </h4>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      📅 تم الرفع في: {new Date(clip.createdAt).toLocaleString('ar-EG')}
                    </span>
                  </div>

                  <div>
                    {clip.status === 'reviewed' ? (
                      <span className="text-[10px] font-bold px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20 flex items-center gap-1">
                        <CheckCircle className="h-3.5 w-3.5" /> تم التقييم والتصحيح
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2.5 py-1 bg-amber-500/10 text-amber-500 rounded-full border border-amber-500/20 flex items-center gap-1 animate-pulse">
                        <Clock className="h-3.5 w-3.5" /> بانتظار تقييم الشيخ
                      </span>
                    )}
                  </div>
                </div>

                {clip.notes && (
                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 mb-3 text-[11px] text-slate-500 dark:text-slate-400">
                    <strong>📝 استفسارك للمعلم:</strong> {clip.notes}
                  </div>
                )}

                {/* Clip Audio Playback */}
                <div className="mb-3.5">
                  <audio src={clip.audioUrl} controls className="w-full h-8 max-w-md" />
                </div>

                {/* Teacher's written feedback review */}
                {clip.status === 'reviewed' && (
                  <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-xs text-right mt-3 space-y-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Sparkles className="h-3.5 w-3.5 animate-pulse" /> ملاحظات الشيخ المصحح:
                      </span>
                      {clip.teacherName && (
                        <span className="text-[10px] text-slate-400 font-medium">الشيخ المعلم: {clip.teacherName}</span>
                      )}
                    </div>
                    <p className="text-slate-750 dark:text-slate-300 leading-relaxed text-[11px] font-medium pr-1 whitespace-pre-line">
                      {clip.feedback || 'أحسنت تلاوةً وترتيلاً بارك الله فيك، قراءة سليمة خالية من الأخطاء واللحن.'}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
