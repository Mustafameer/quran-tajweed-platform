/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  User,
  Users,
  Award,
  ArrowLeft,
  Volume2,
  Sparkles,
  BookOpen,
  Send,
  Loader,
  Search,
  HelpCircle,
  Eye,
  Minimize2
} from 'lucide-react';
import { User as UserType, ActiveSessionState, QuranVerse, Attendance, Book, BookChapter } from '../types';
import { SURAH_LIST, RECITERS_LIST, QURAN_DATABASE, getVersesRange, getGlobalAyahNumber } from '../quranData';
import { getCachedQuranVerses, cacheNewQuranVerses } from '../lib/indexedDbCache';
import { useToast } from './Toast';
import QuranFontController, { FontSettings } from './QuranFontController';

interface VoiceClassroomProps {
  sessionId: string;
  currentUser: UserType;
  onExit: () => void;
}

export default function VoiceClassroom({ sessionId, currentUser, onExit }: VoiceClassroomProps) {
  const { showToast } = useToast();
  
  // Quran reader font settings state
  const [fontSettings, setFontSettings] = useState<FontSettings>({
    fontSize: 1.75, // in rem
    fontFamily: 'font-serif'
  });

  // Focus Mode States
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [focusLineHeight, setFocusLineHeight] = useState(2.8); // line spacing in rem
  const [focusTheme, setFocusTheme] = useState<'cream' | 'dark' | 'light'>('cream');
  const [focusFontSize, setFocusFontSize] = useState(2.5); // larger default font size for focus mode

  // Session / state
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [classroomState, setClassroomState] = useState<ActiveSessionState | null>(null);
  const [classStudents, setClassStudents] = useState<UserType[]>([]);
  const [attendanceList, setAttendanceList] = useState<Attendance[]>([]);
  const [myAttendanceId, setMyAttendanceId] = useState<string | null>(null);

  // Quran dynamic loading and audio states
  const [currentVerses, setCurrentVerses] = useState<QuranVerse[]>([]);
  const [versesLoading, setVersesLoading] = useState<boolean>(false);
  const [selectedReciter, setSelectedReciter] = useState<string>('ar.husary');
  const [playingAyahKey, setPlayingAyahKey] = useState<string | null>(null); // e.g. "surah_ayah"
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
    };
  }, []);

  // Quran Selection Form (Teacher only)
  const [selectedSurah, setSelectedSurah] = useState(1);
  const [startAyah, setStartAyah] = useState(1);
  const [endAyah, setEndAyah] = useState(7);

  // Curriculum Books/Metns States
  const [assignmentType, setAssignmentType] = useState<'quran' | 'book'>('quran');
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<string>('');
  const [selectedChapterId, setSelectedChapterId] = useState<string>('');
  const [selectedPageNumber, setSelectedPageNumber] = useState<number>(1);
  const [playingBookLineIdx, setPlayingBookLineIdx] = useState<number | null>(null);

  // Gemini AI Assistant State
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Audio/Mic simulator state
  const [micActive, setMicActive] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0); // 0 to 100 for visualizer
  const animRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  // WebRTC state for real audio streaming
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const localAudioRef = useRef<HTMLAudioElement | null>(null);
  const signalingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sync state with server via polling
  const syncClassroom = async () => {
    try {
      const res = await fetch(`/api/active-session/${sessionId}`);
      const data = await res.json();
      if (data.status === 'live') {
        setClassroomState(data.state);
      } else {
        // Class ended
        alert('لقد أنهى المعلم الدرس أو تم إغلاق الحصة.');
        handleExit();
      }
    } catch (err) {
      console.error('Error syncing classroom:', err);
    }
  };

  const loadInitialState = async () => {
    try {
      // 1. Get session details
      const sRes = await fetch('/api/sessions');
      const sessions = await sRes.json();
      const sDetails = sessions.find((s: any) => s.id === sessionId);
      setSessionInfo(sDetails);

      // 2. Get students of course
      const uRes = await fetch('/api/users');
      const usersList = await uRes.json();
      const courseStudents = usersList.filter((u: UserType) => u.role === 'student' && u.status === 'approved');
      setClassStudents(courseStudents);

      // 3. Register my attendance log
      if (currentUser.role === 'student') {
        const attRes = await fetch('/api/attendance/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, studentId: currentUser.id })
        });
        const attLog = await attRes.json();
        setMyAttendanceId(attLog.id);
      }

      // 3.5 Fetch Books list
      const bRes = await fetch('/api/books');
      if (bRes.ok) {
        const booksData = await bRes.json();
        setAllBooks(booksData);
        if (booksData.length > 0) {
          setSelectedBookId(booksData[0].id);
          if (booksData[0].chapters.length > 0) {
            setSelectedChapterId(booksData[0].chapters[0].id);
          }
        }
      }
      
      // 4. Initial sync
      await syncClassroom();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadInitialState();

    // Start 2-seconds polling loop to simulate real-time socket coordinate changes
    const interval = setInterval(syncClassroom, 2000);
    return () => {
      clearInterval(interval);
    };
  }, [sessionId]);

  // Handle active audio permissions
  useEffect(() => {
    const shouldSpeak = 
      currentUser.role === 'teacher' || currentUser.role === 'admin' || 
      (classroomState && classroomState.speakingStudentId === currentUser.id);

    if (shouldSpeak) {
      setMicActive(true);
      startMicrophoneTracking();
      initializeWebRTC();
    } else {
      setMicActive(false);
      stopMicrophoneTracking();
      cleanupWebRTC();
    }
  }, [classroomState, currentUser]);

  // Microphone level analyzer (uses actual browser microphone if allowed)
  const startMicrophoneTracking = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => null);
        if (stream) {
          micStreamRef.current = stream;
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          const audioCtx = new AudioContextClass();
          audioCtxRef.current = audioCtx;
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);
          analyserRef.current = analyser;

          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);

          const checkVolume = () => {
            if (!analyserRef.current) return;
            analyserRef.current.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
              sum += dataArray[i];
            }
            const average = sum / bufferLength;
            setVolumeLevel(Math.min(100, Math.round(average * 1.5)));
            animRef.current = requestAnimationFrame(checkVolume);
          };
          checkVolume();
          return;
        }
      }
    } catch (err) {
      console.warn('Mic access denied or restricted in iframe, falling back to simulation.');
    }

    // Safe simulation fallback for visual feedback
    const simulateVolume = () => {
      setVolumeLevel(Math.round(20 + Math.random() * 50));
      animRef.current = requestAnimationFrame(simulateVolume);
    };
    simulateVolume();
  };

  const stopMicrophoneTracking = () => {
    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
    setVolumeLevel(0);
  };

  // WebRTC functions for real audio streaming
  const initializeWebRTC = async () => {
    try {
      console.log('[WebRTC] Initializing for user:', currentUser.id, currentUser.role);
      
      // Check if media devices are available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('المتصفح لا يدعم الوصول للميكروفون');
      }

      // STUN servers - can be configured via environment variable in production
      // Default to Google's free STUN servers
      const stunServers = [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ];

      const pc = new RTCPeerConnection({
        iceServers: stunServers
      });
      peerConnectionRef.current = pc;

      // Get local audio stream with better error handling
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        console.log('[WebRTC] Got audio stream successfully');
      } catch (mediaErr: any) {
        console.error('[WebRTC] Media access error:', mediaErr);
        if (mediaErr.name === 'NotAllowedError') {
          throw new Error('يرجى السماح بالوصول للميكروفون في إعدادات المتصفح');
        } else if (mediaErr.name === 'NotFoundError') {
          throw new Error('لم يتم العثور على ميكروفون. يرجى التأكد من توصيله');
        } else if (mediaErr.name === 'NotReadableError') {
          throw new Error('الميكروفون قيد الاستخدام من تطبيق آخر');
        } else {
          throw new Error(`خطأ في الوصول للميكروفون: ${mediaErr.message}`);
        }
      }
      
      micStreamRef.current = stream;

      // Add local audio tracks to peer connection
      stream.getAudioTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Handle incoming remote stream
      pc.ontrack = (event) => {
        console.log('[WebRTC] Received remote track');
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = event.streams[0];
          remoteAudioRef.current.play().catch(err => console.error('Error playing remote audio:', err));
        }
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('[WebRTC] Sending ICE candidate');
          fetch(`/api/active-session/${sessionId}/webrtc/ice-candidate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              candidate: event.candidate,
              userId: currentUser.id
            })
          }).catch(err => console.error('Error sending ICE candidate:', err));
        }
      };

      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        console.log('[WebRTC] Connection state:', pc.connectionState);
        if (pc.connectionState === 'failed') {
          console.error('[WebRTC] Connection failed');
          showToast('فشل الاتصال الصوتي. جاري إعادة المحاولة...', 'warning');
        }
      };

      // Start signaling based on role
      if (currentUser.role === 'teacher' || currentUser.role === 'admin') {
        // Teacher creates offer
        console.log('[WebRTC] Teacher creating offer');
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        
        await fetch(`/api/active-session/${sessionId}/webrtc/offer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            offer: pc.localDescription,
            userId: currentUser.id
          })
        });
      } else {
        console.log('[WebRTC] Student waiting for teacher offer');
      }

      // Start polling for signals
      startSignalingPolling();
      console.log('[WebRTC] Initialization complete');

    } catch (err: any) {
      console.error('[WebRTC] Error initializing:', err);
      showToast(err.message || 'فشل في تهيئة الصوت. يرجى التحقق من إعدادات الميكروفون.', 'error');
      cleanupWebRTC();
    }
  };

  const startSignalingPolling = () => {
    if (signalingIntervalRef.current) {
      clearInterval(signalingIntervalRef.current);
    }

    signalingIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/active-session/${sessionId}/webrtc/signals?userId=${currentUser.id}`);
        if (!res.ok) {
          console.error('[WebRTC] Failed to fetch signals:', res.status);
          return;
        }
        const signals = await res.json();
        const pc = peerConnectionRef.current;

        if (!pc) {
          console.warn('[WebRTC] No peer connection, skipping signaling');
          return;
        }

        // Handle offer (for student)
        if (signals.offer && currentUser.role === 'student') {
          console.log('[WebRTC] Student received offer, creating answer');
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(signals.offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            
            await fetch(`/api/active-session/${sessionId}/webrtc/answer`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                answer: pc.localDescription,
                userId: currentUser.id
              })
            });
            console.log('[WebRTC] Student sent answer');
          } catch (err) {
            console.error('[WebRTC] Error handling offer:', err);
          }
        }

        // Handle answer (for teacher)
        if (signals.answer && (currentUser.role === 'teacher' || currentUser.role === 'admin')) {
          console.log('[WebRTC] Teacher received answer');
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(signals.answer));
          } catch (err) {
            console.error('[WebRTC] Error handling answer:', err);
          }
        }

        // Handle ICE candidates
        for (const iceData of signals.iceCandidates || []) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(iceData.candidate));
            console.log('[WebRTC] Added ICE candidate');
          } catch (err) {
            console.error('Error adding ICE candidate:', err);
          }
        }
      } catch (err) {
        console.error('[WebRTC] Error in signaling polling:', err);
      }
    }, 2000);
  };

  const cleanupWebRTC = () => {
    if (signalingIntervalRef.current) {
      clearInterval(signalingIntervalRef.current);
      signalingIntervalRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
    if (localAudioRef.current) {
      localAudioRef.current.srcObject = null;
    }
  };

  // Student list sync
  const loadAttendance = async () => {
    try {
      const res = await fetch('/api/attendance');
      const list = await res.json();
      setAttendanceList(list.filter((l: Attendance) => l.sessionId === sessionId && !l.leaveTime));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadAttendance();
    const attInterval = setInterval(loadAttendance, 4000);
    return () => clearInterval(attInterval);
  }, [sessionId]);

  const handleExit = async () => {
    stopMicrophoneTracking();
    cleanupWebRTC();
    if (currentUser.role === 'student') {
      try {
        await fetch('/api/attendance/leave', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, studentId: currentUser.id })
        });
      } catch (err) {
        console.error(err);
      }
    }
    onExit();
  };

  // Teacher Classroom commands
  const grantSpeakingPermission = async (studentId: string) => {
    try {
      const res = await fetch(`/api/active-session/${sessionId}/grant-permission`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, teacherId: currentUser.id })
      });
      if (res.ok) {
        const data = await res.json();
        setClassroomState(data.state);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const revokeSpeakingPermission = async () => {
    try {
      const res = await fetch(`/api/active-session/${sessionId}/revoke-permission`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId: currentUser.id })
      });
      if (res.ok) {
        const data = await res.json();
        setClassroomState(data.state);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignPassage = async (e: React.FormEvent) => {
    e.preventDefault();
    const surahObj = SURAH_LIST.find(s => s.number === selectedSurah);
    try {
      const res = await fetch(`/api/active-session/${sessionId}/assign-passage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surahNumber: selectedSurah,
          surahName: surahObj ? surahObj.name : 'الفاتحة',
          startAyah,
          endAyah,
          teacherId: currentUser.id
        })
      });
      if (res.ok) {
        const data = await res.json();
        setClassroomState(data.state);
        alert('تم تعميم وتحديد مقطع القراءة الجديد بنجاح على شاشات الطلاب!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignBook = async (e: React.FormEvent) => {
    e.preventDefault();
    const bookObj = allBooks.find(b => b.id === selectedBookId);
    const chapterObj = bookObj?.chapters.find(c => c.id === selectedChapterId);
    const pageObj = chapterObj?.pages.find(p => p.pageNumber === selectedPageNumber);

    if (!bookObj || !chapterObj || !pageObj) {
      showToast('الرجاء التأكد من اختيار الكتاب والباب والصفحة بشكل صحيح.', 'warning');
      return;
    }

    try {
      const res = await fetch(`/api/active-session/${sessionId}/assign-book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: selectedBookId,
          bookTitle: bookObj.title,
          chapterTitle: chapterObj.title,
          pageNumber: selectedPageNumber,
          content: pageObj.content,
          teacherId: currentUser.id
        })
      });
      if (res.ok) {
        const data = await res.json();
        setClassroomState(data.state);
        alert('تم تعميم وتحديد صفحة الكتاب الجديد بنجاح على شاشات الطلاب!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEndClass = async () => {
    if (confirm('هل أنت متأكد من رغبتك في إنهاء هذه الحصة وحفظ السجلات بالكامل؟')) {
      try {
        const res = await fetch(`/api/sessions/end/${sessionId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ teacherId: currentUser.id })
        });
        if (res.ok) {
          handleExit();
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Invoke Gemini API for Tajweed Assistant
  const askGeminiTeacher = async (assignedText?: string) => {
    setAiLoading(true);
    setAiResponse('');
    try {
      const promptText = assignedText 
        ? `ما هي أحكام التجويد الواردة في الآيات التالية وكيف يمكن قراءتها قراءة صحيحة وصوت مخارج سليم؟`
        : aiQuery;

      const res = await fetch('/api/gemini/tajweed-help', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: promptText,
          ayahText: assignedText || undefined,
          surahName: classroomState?.assignment?.surahName
        })
      });

      const data = await res.json();
      setAiResponse(data.response);
    } catch (err) {
      setAiResponse('عذراً، تعذر الاتصال بـ الذكاء الاصطناعي في الوقت الحالي.');
    } finally {
      setAiLoading(false);
    }
  };

  const loadVersesRange = async (surahNumber: number, startAyah: number, endAyah: number): Promise<QuranVerse[]> => {
    // 1. Check QURAN_DATABASE (local fallback)
    const localMatches = QURAN_DATABASE.filter(
      v => v.surahNumber === surahNumber && v.ayahNumber >= startAyah && v.ayahNumber <= endAyah
    ).map(v => ({
      ...v,
      number: getGlobalAyahNumber(v.surahNumber, v.ayahNumber)
    }));

    const expectedCount = endAyah - startAyah + 1;
    if (localMatches.length === expectedCount) {
      return localMatches;
    }

    // 2. Check IndexedDB cache
    try {
      const cached = await getCachedQuranVerses();
      const cachedMatches = cached.filter(
        v => v.surahNumber === surahNumber && v.ayahNumber >= startAyah && v.ayahNumber <= endAyah
      ).map(v => ({
        ...v,
        number: v.number || getGlobalAyahNumber(v.surahNumber, v.ayahNumber)
      }));

      if (cachedMatches.length === expectedCount) {
        return cachedMatches.sort((a, b) => a.ayahNumber - b.ayahNumber);
      }
    } catch (err) {
      console.error('Failed to read Quran cache:', err);
    }

    // 3. Fetch from Al Quran API if online
    if (navigator.onLine) {
      try {
        const res = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}`);
        const data = await res.json();
        if (data && data.code === 200 && data.data && data.data.ayahs) {
          const surahName = data.data.name;
          const fetched: QuranVerse[] = data.data.ayahs.map((ayah: any) => ({
            surahNumber,
            surahName,
            ayahNumber: ayah.numberInSurah,
            text: ayah.text,
            number: ayah.number // global ayah number
          }));

          // Cache in IndexedDB
          await cacheNewQuranVerses(fetched);

          return fetched.filter(v => v.ayahNumber >= startAyah && v.ayahNumber <= endAyah);
        }
      } catch (err) {
        console.error('Failed to fetch Quran Surah from API:', err);
      }
    }

    return localMatches;
  };

  // Track last-loaded assignment to avoid re-fetching on every poll cycle
  const lastAssignmentRef = useRef<string>('');

  useEffect(() => {
    const a = classroomState?.assignment;
    if (a) {
      const key = `${a.surahNumber}_${a.startAyah}_${a.endAyah}`;
      if (key === lastAssignmentRef.current) return; // same assignment, skip
      lastAssignmentRef.current = key;

      setVersesLoading(true);
      loadVersesRange(a.surahNumber, a.startAyah, a.endAyah)
        .then((verses) => {
          setCurrentVerses(verses);
        })
        .catch((err) => {
          console.error(err);
          showToast('حدث خطأ أثناء جلب آيات التلاوة.', 'error');
        })
        .finally(() => {
          setVersesLoading(false);
        });
    } else if (lastAssignmentRef.current !== '') {
      lastAssignmentRef.current = '';
      setCurrentVerses([]);
    }
  }, [classroomState?.assignment?.surahNumber, classroomState?.assignment?.startAyah, classroomState?.assignment?.endAyah]);

  const playAyahAudio = (verse: QuranVerse) => {
    const globalNum = verse.number || getGlobalAyahNumber(verse.surahNumber, verse.ayahNumber);
    const ayahKey = `${verse.surahNumber}_${verse.ayahNumber}`;

    if (playingAyahKey === ayahKey) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      setPlayingAyahKey(null);
      return;
    }

    const audioUrl = `https://cdn.islamic.network/quran/audio/128/${selectedReciter}/${globalNum}.mp3`;
    
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }

    const audio = new Audio(audioUrl);
    audioPlayerRef.current = audio;
    setPlayingAyahKey(ayahKey);

    audio.play().catch((err) => {
      console.error('Audio playback failed:', err);
      showToast('تعذر تشغيل تلاوة الآية. يرجى التحقق من اتصال الإنترنت.', 'error');
      setPlayingAyahKey(null);
    });

    audio.onended = () => {
      setPlayingAyahKey(null);
    };
  };

  // Get current assigned verses
  const currentAssignedVerses: QuranVerse[] = currentVerses;

  if (isFocusMode) {
    const bgClass = focusTheme === 'cream' 
      ? 'bg-[#FCF6EC] text-[#2C2114]' 
      : focusTheme === 'dark' 
        ? 'bg-[#0E121A] text-[#E2E8F0]' 
        : 'bg-white text-slate-900';

    const cardBg = focusTheme === 'cream'
      ? 'bg-[#FAF0E1] border-[#EADABF]'
      : focusTheme === 'dark'
        ? 'bg-[#151B26] border-slate-800'
        : 'bg-slate-50 border-slate-100';

    const borderTheme = focusTheme === 'cream'
      ? 'border-[#EADABF]/50'
      : focusTheme === 'dark'
        ? 'border-slate-800/80'
        : 'border-slate-200';

    return (
      <div className={`min-h-screen flex flex-col transition-colors duration-300 ${bgClass} text-right`} dir="rtl" id="quran-focus-mode-container">
        {/* Top Control Bar */}
        <div className={`py-4 px-6 border-b flex flex-wrap justify-between items-center gap-4 ${borderTheme}`}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsFocusMode(false)}
              className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                focusTheme === 'cream'
                  ? 'bg-[#EADABF] text-[#4F3C24] border-[#D6C4A6] hover:bg-[#DECBAA]'
                  : focusTheme === 'dark'
                    ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
            >
              <Minimize2 className="h-4 w-4" />
              <span>إغلاق القراءة المركزة 🚪</span>
            </button>
            <div>
              <span className="text-[10px] bg-emerald-600/15 text-emerald-700 dark:text-emerald-400 font-bold px-2.5 py-0.5 rounded-full">وضع القراءة المركزة المريح 🧘‍♂️</span>
              <h1 className="text-sm font-extrabold mt-1 font-serif">
                {classroomState?.bookAssignment
                  ? `${classroomState.bookAssignment.bookTitle} - صفحة ${classroomState.bookAssignment.pageNumber}`
                  : classroomState?.assignment 
                    ? `سورة ${classroomState.assignment.surahName} (الآيات ${classroomState.assignment.startAyah} - ${classroomState.assignment.endAyah})` 
                    : 'مقرأة الذكر الحكيم'}
              </h1>
            </div>
          </div>

          {/* Settings in focus mode bar */}
          <div className="flex items-center gap-4 flex-wrap">
            {/* Theme selector */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] opacity-70 ml-1.5 font-bold">ورق القراءة:</span>
              <div className="flex gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-xl border border-slate-200/20">
                <button
                  onClick={() => setFocusTheme('cream')}
                  className={`px-3 py-1 text-[10px] font-bold rounded-lg cursor-pointer transition-all ${focusTheme === 'cream' ? 'bg-[#EADABF] text-[#2C2114] shadow-sm' : 'opacity-60 hover:opacity-100'}`}
                >
                  📜 ورق قديم
                </button>
                <button
                  onClick={() => setFocusTheme('dark')}
                  className={`px-3 py-1 text-[10px] font-bold rounded-lg cursor-pointer transition-all ${focusTheme === 'dark' ? 'bg-slate-800 text-slate-100 shadow-sm' : 'opacity-60 hover:opacity-100'}`}
                >
                  🌙 معتم ليلي
                </button>
                <button
                  onClick={() => setFocusTheme('light')}
                  className={`px-3 py-1 text-[10px] font-bold rounded-lg cursor-pointer transition-all ${focusTheme === 'light' ? 'bg-white text-slate-800 shadow-sm border border-slate-200' : 'opacity-60 hover:opacity-100'}`}
                >
                  ☀️ ناصع
                </button>
              </div>
            </div>

            {/* Reciter selector in Focus Mode */}
            {!classroomState?.bookAssignment && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] opacity-70 font-bold">القارئ:</span>
                <select
                  value={selectedReciter}
                  onChange={(e) => {
                    setSelectedReciter(e.target.value);
                    if (audioPlayerRef.current) {
                      audioPlayerRef.current.pause();
                      setPlayingAyahKey(null);
                    }
                  }}
                  className={`text-xs rounded-xl p-2 font-bold cursor-pointer outline-none border ${
                    focusTheme === 'cream'
                      ? 'bg-[#FAF0E1] border-[#EADABF] text-[#4F3C24]'
                      : focusTheme === 'dark'
                        ? 'bg-slate-800 border-slate-700 text-slate-200'
                        : 'bg-white border-slate-200 text-slate-800'
                  }`}
                >
                  {RECITERS_LIST.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Line spacing selector */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] opacity-70 font-bold">تباعد الأسطر:</span>
              <select
                value={focusLineHeight}
                onChange={(e) => setFocusLineHeight(parseFloat(e.target.value))}
                className={`text-xs rounded-xl p-2 font-bold cursor-pointer outline-none border ${
                  focusTheme === 'cream'
                    ? 'bg-[#FAF0E1] border-[#EADABF] text-[#4F3C24]'
                    : focusTheme === 'dark'
                      ? 'bg-slate-800 border-slate-700 text-slate-200'
                      : 'bg-white border-slate-200 text-slate-800'
                }`}
              >
                <option value="2.0">ضيق (2.0)</option>
                <option value="2.8">متوسط (2.8)</option>
                <option value="3.5">مريح (3.5)</option>
                <option value="4.2">متباعد جداً (4.2)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Immersive Quran Board */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 overflow-y-auto pb-28 relative">
          <div className="max-w-4xl w-full text-center space-y-8">
            {classroomState?.bookAssignment ? (
              <div className="space-y-6">
                <div className="inline-block bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 text-xs font-bold px-4 py-1.5 rounded-full font-sans">
                  كتاب: {classroomState.bookAssignment.bookTitle} • {classroomState.bookAssignment.chapterTitle} • صفحة {classroomState.bookAssignment.pageNumber}
                </div>
                <div className="space-y-4 max-w-2xl mx-auto py-4">
                  {classroomState.bookAssignment.content.map((line, idx) => {
                    const isPlaying = playingBookLineIdx === idx;
                    return (
                      <div
                        key={idx}
                        onClick={() => setPlayingBookLineIdx(playingBookLineIdx === idx ? null : idx)}
                        className={`p-5 rounded-2xl border transition-all cursor-pointer font-bold text-lg font-serif leading-relaxed text-center ${
                          isPlaying
                            ? focusTheme === 'cream'
                              ? 'bg-[#EADABF] border-[#C4B295] text-[#2C2114] shadow-sm scale-[1.01]'
                              : focusTheme === 'dark'
                                ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300 shadow-sm scale-[1.01]'
                                : 'bg-emerald-100 border-emerald-300 text-emerald-900 shadow-sm scale-[1.01]'
                            : focusTheme === 'cream'
                              ? 'bg-[#FAF0E1]/60 border-[#EADABF]/50 text-[#4F3C24] hover:bg-[#FAF0E1]'
                              : focusTheme === 'dark'
                                ? 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-900'
                                : 'bg-slate-50/80 border-slate-200/80 text-slate-700 hover:bg-slate-50'
                        }`}
                        title="انقر لتظليل هذا المقطع"
                      >
                        {line}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : classroomState?.assignment ? (
              <div className="space-y-6">
                <div className="inline-block bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 text-xs font-bold px-4 py-1.5 rounded-full">
                  سورة {classroomState.assignment.surahName} • آية {classroomState.assignment.startAyah} إلى {classroomState.assignment.endAyah}
                </div>
                <div 
                  style={{ 
                    fontSize: `${fontSettings.fontSize * 1.3}rem`, 
                    lineHeight: `${focusLineHeight}rem`,
                  }}
                  className={`font-medium transition-all ${fontSettings.fontFamily}`}
                >
                  {versesLoading ? (
                    <div className="py-8 flex flex-col items-center justify-center gap-2">
                      <Loader className="h-8 w-8 text-emerald-600 animate-spin" />
                      <p className="text-xs text-slate-400 font-sans">جاري جلب الآيات الكريمة من المصحف الشريف...</p>
                    </div>
                  ) : currentAssignedVerses.length === 0 ? (
                    <p className="text-slate-400 text-base italic">المعلم لم يعين أي آيات قرآنية لعرضها حالياً.</p>
                  ) : (
                    <div className="flex flex-wrap justify-center gap-x-4 gap-y-8 leading-loose">
                      {currentAssignedVerses.map(v => {
                        const isPlaying = playingAyahKey === `${v.surahNumber}_${v.ayahNumber}`;
                        return (
                          <span 
                            key={v.ayahNumber} 
                            onClick={() => playAyahAudio(v)}
                            className={`inline-block text-center select-none cursor-pointer transition-all duration-300 hover:text-emerald-600 ${
                              isPlaying 
                                ? focusTheme === 'cream'
                                  ? 'bg-[#EADABF]/40 text-emerald-950 rounded-xl px-3 py-1 shadow-sm border border-[#D6C4A6]/60'
                                  : focusTheme === 'dark'
                                    ? 'bg-emerald-950/40 text-emerald-400 rounded-xl px-3 py-1 shadow-sm border border-emerald-900/50'
                                    : 'bg-emerald-50 text-emerald-800 rounded-xl px-3 py-1 shadow-sm border border-emerald-200/60'
                                : ''
                            }`}
                            title="انقر لتشغيل تلاوة الآية"
                          >
                            <span className="relative">{v.text}</span>
                            <span className={`inline-flex items-center justify-center h-10 w-10 text-xs border rounded-full font-serif font-bold mr-2.5 leading-none align-middle select-none shadow-sm ${
                              isPlaying
                                ? 'border-emerald-500 bg-emerald-600 text-white shadow-md'
                                : focusTheme === 'cream' 
                                  ? 'bg-[#FAF0E1] border-[#EADABF] text-[#4F3C24]' 
                                  : focusTheme === 'dark' 
                                    ? 'bg-[#151B26] border-slate-800 text-slate-300' 
                                    : 'bg-slate-50 border-slate-200 text-slate-700'
                            }`}>
                              {v.ayahNumber}
                            </span>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className={`p-8 rounded-2xl border text-center max-w-md mx-auto ${cardBg}`}>
                <Sparkles className="h-10 w-10 text-emerald-600 mx-auto mb-3 animate-bounce" />
                <h3 className="font-extrabold text-sm mb-1.5">بانتظار تحديد مادة التلاوة</h3>
                <p className="text-xs text-slate-400">سيقوم المعلم بتعميم الآيات القرآنية أو صفحات الكتب هنا قريباً لعرضها بوضوح في هذا اللوح المريح للعين.</p>
              </div>
            )}
          </div>
        </div>

        {/* Fixed control bar at bottom of Focus Mode */}
        <div className={`sticky bottom-0 z-50 flex justify-center py-3 ${
          focusTheme === 'cream' ? 'bg-[#FDF6EC]/95' : focusTheme === 'dark' ? 'bg-[#0F1420]/95' : 'bg-white/95'
        } backdrop-blur-sm`}>
          <QuranFontController settings={fontSettings} onChange={setFontSettings} isDark={focusTheme === 'dark'} />
        </div>

        {/* Ambient Footer */}
        <div className={`py-3 px-6 border-t text-center text-[11px] opacity-60 ${borderTheme}`}>
          منصة ورش لتعليم التلاوة • وضع القراءة المركزة المريحة للعين مفعّل 🧘‍♂️📖
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F9FBFC] text-slate-800 min-h-screen pb-12 text-right" dir="rtl" id="classroom-interface">
      {/* Hidden audio elements for WebRTC */}
      <audio ref={remoteAudioRef} autoPlay playsInline style={{ display: 'none' }} />
      <audio ref={localAudioRef} autoPlay playsInline muted style={{ display: 'none' }} />
      
      {/* Top Header */}
      <div className="bg-white border-b border-slate-100 py-4 px-6 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              onClick={handleExit}
              className="bg-slate-50 hover:bg-slate-100 text-slate-600 p-2 rounded-xl border border-slate-200 transition-all cursor-pointer shadow-sm"
              title="مغادرة الحلقة"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <span className="text-[10px] bg-rose-50 border border-rose-200 text-rose-700 font-bold px-2.5 py-0.5 rounded-full animate-pulse font-mono">حلقة مباشرة 🔴</span>
              <h1 className="text-base font-extrabold text-slate-800 mt-1">{sessionInfo?.title || 'الحصة الصوتية'}</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-slate-50 border border-slate-200/60 px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-2 text-slate-700">
              <Users className="h-4 w-4 text-emerald-600" />
              <span>المتواجدون حالياً: <strong className="font-mono text-emerald-600">{attendanceList.length}</strong></span>
            </div>

            {(currentUser.role === 'teacher' || currentUser.role === 'admin') && (
              <button
                onClick={handleEndClass}
                className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/60 font-bold text-xs px-4 py-2 rounded-xl cursor-pointer transition-all"
              >
                إنهاء الحصة الكلي
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left pane: Active Speakers, Controls, Audio Visualizer */}
        <div className="lg:col-span-1 space-y-6">
          {/* Audio State / Visualizer */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm text-center flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-radial-gradient from-emerald-50/10 to-transparent opacity-50 pointer-events-none" />
            
            <span className="text-[11px] text-slate-400 font-bold mb-3">حالة ميكروفونك الشخصي</span>

            {micActive ? (
              <div className="flex flex-col items-center">
                <div 
                  className="h-20 w-20 rounded-full bg-emerald-50 border-2 border-emerald-500 flex items-center justify-center relative mb-4"
                  style={{ transform: `scale(${1 + volumeLevel / 400})` }}
                >
                  <Mic className="h-10 w-10 text-emerald-600 animate-pulse" />
                  <div className="absolute inset-0 rounded-full border border-emerald-400 animate-ping opacity-25" />
                </div>
                <span className="text-emerald-700 text-xs font-bold flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                  ميكروفونك مفعّل - يمكنك التحدث والقراءة الآن
                </span>

                {/* Level visualizer bar */}
                <div className="w-48 bg-slate-100 h-2 rounded-full overflow-hidden mt-4 border border-slate-200">
                  <div className="bg-emerald-500 h-full transition-all duration-75" style={{ width: `${volumeLevel}%` }} />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="h-20 w-20 rounded-full bg-slate-50 border-2 border-slate-200 flex items-center justify-center mb-4">
                  <MicOff className="h-10 w-10 text-slate-400" />
                </div>
                <span className="text-slate-400 text-xs font-bold">الميكروفون مغلق - أنت مستمع فقط حالياً</span>
                {currentUser.role === 'student' && (
                  <button
                    onClick={() => {
                      showToast('🙋‍♂️ تم إرسال طلب إذن القراءة بنجاح! يرجى انتظار سماح الشيخ المعلم بتفعيل ميكروفونك.', 'success');
                    }}
                    className="mt-4 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center gap-1.5"
                  >
                    <span>طلب إذن القراءة والمشاركة 🙋‍♂️</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Active Speaking Permission status card */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm text-slate-800">
            <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Volume2 className="h-4.5 w-4.5 text-indigo-500" />
              <span>الطالب المخوّل بالقراءة حالياً</span>
            </h3>

            {classroomState?.speakingStudentId ? (
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 p-4 rounded-xl">
                <div className="h-10 w-10 bg-emerald-600 rounded-full flex items-center justify-center font-bold text-white shadow-sm">
                  ع
                </div>
                <div className="flex-1 text-right">
                  <h4 className="font-extrabold text-slate-800 text-sm">{classroomState.speakingStudentName}</h4>
                  <p className="text-[10px] text-emerald-700 mt-0.5">يقوم بالقراءة المباشرة وتصحيح التلاوة مع الشيخ المعلم</p>
                </div>
                {(currentUser.role === 'teacher' || currentUser.role === 'admin') && (
                  <button
                    onClick={revokeSpeakingPermission}
                    className="bg-white hover:bg-rose-50 text-rose-600 text-xs font-bold px-2.5 py-1.5 rounded-lg border border-slate-200 cursor-pointer shadow-sm"
                  >
                    إغلاق المايك
                  </button>
                )}
              </div>
            ) : (
              <p className="text-slate-400 text-xs py-3 text-center">لا يوجد طالب مسجل يقرأ حالياً. الميكروفون تحت سيطرة المعلم.</p>
            )}
          </div>

          {/* Interactive Student roster (Teacher controls allow speaking permission) */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm text-slate-800">
            <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Users className="h-4.5 w-4.5 text-emerald-600" />
              <span>الحاضرون في البث الآن ({attendanceList.length})</span>
            </h3>

            <div className="space-y-2.5 max-h-60 overflow-y-auto scrollbar-thin">
              {attendanceList.map(st => {
                const isSpeaking = classroomState?.speakingStudentId === st.studentId;
                return (
                  <div key={st.id} className="flex justify-between items-center p-2 rounded-lg hover:bg-slate-50 transition-colors">
                    <span className="text-xs font-bold text-slate-700">{st.studentName}</span>
                    
                    {(currentUser.role === 'teacher' || currentUser.role === 'admin') ? (
                      isSpeaking ? (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] px-2.5 py-1 rounded-lg font-bold">يتكلم الآن</span>
                      ) : (
                        <button
                          onClick={() => grantSpeakingPermission(st.studentId)}
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100/60 text-[10px] px-2.5 py-1 rounded-lg cursor-pointer transition-all font-semibold"
                        >
                          تفعيل المايك والقراءة
                        </button>
                      )
                    ) : (
                      isSpeaking && <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg text-[10px] font-bold">🎤 يقرأ الآن</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Center/Right pane: Quran Text Display and Assignment */}
        <div className="lg:col-span-2 space-y-6">
          {/* Teacher Assignment controls */}
          {(currentUser.role === 'teacher' || currentUser.role === 'admin') && (
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm text-slate-800">
              <h3 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-1.5 font-sans">
                <BookOpen className="h-5 w-5 text-emerald-600" />
                <span>تعيين وتحديد مادة القراءة والمشاركة للطلاب</span>
              </h3>

              {/* Toggle Switch */}
              <div className="flex gap-2 mb-4 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                <button
                  onClick={() => setAssignmentType('quran')}
                  className={`flex-1 text-center py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${assignmentType === 'quran' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  📖 تلاوة من المصحف الشريف
                </button>
                <button
                  onClick={() => setAssignmentType('book')}
                  className={`flex-1 text-center py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${assignmentType === 'book' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  📚 كتاب تجويد / متن دراسي
                </button>
              </div>

              {assignmentType === 'quran' ? (
                <form onSubmit={handleAssignPassage} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">اختر السورة المنهجية</label>
                    <select
                      value={selectedSurah}
                      onChange={(e) => setSelectedSurah(parseInt(e.target.value))}
                      className="w-full bg-white border border-slate-200 text-slate-700 rounded-xl p-2.5 text-xs text-center outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      {SURAH_LIST.map(s => (
                        <option key={s.number} value={s.number}>{s.name} ({s.number})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">من الآية رقم</label>
                    <input
                      type="number"
                      min="1"
                      max={SURAH_LIST.find(s => s.number === selectedSurah)?.totalAyahs || 286}
                      value={startAyah}
                      onChange={(e) => setStartAyah(parseInt(e.target.value))}
                      className="w-full bg-white border border-slate-200 text-slate-700 rounded-xl p-2.5 text-xs text-center outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">إلى الآية رقم</label>
                    <input
                      type="number"
                      min="1"
                      max={SURAH_LIST.find(s => s.number === selectedSurah)?.totalAyahs || 286}
                      value={endAyah}
                      onChange={(e) => setEndAyah(parseInt(e.target.value))}
                      className="w-full bg-white border border-slate-200 text-slate-700 rounded-xl p-2.5 text-xs text-center outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold p-2.5 rounded-xl shadow-lg shadow-emerald-100 cursor-pointer transition-all w-full"
                  >
                    تعميم مقطع القراءة 📖
                  </button>
                </form>
              ) : (
                <form onSubmit={handleAssignBook} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">اختر الكتاب</label>
                    <select
                      value={selectedBookId}
                      onChange={(e) => {
                        const bId = e.target.value;
                        setSelectedBookId(bId);
                        const book = allBooks.find(b => b.id === bId);
                        if (book && book.chapters.length > 0) {
                          setSelectedChapterId(book.chapters[0].id);
                        }
                      }}
                      className="w-full bg-white border border-slate-200 text-slate-700 rounded-xl p-2.5 text-xs text-center outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      {allBooks.map(b => (
                        <option key={b.id} value={b.id}>{b.title}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">اختر الباب / الفصل</label>
                    <select
                      value={selectedChapterId}
                      onChange={(e) => setSelectedChapterId(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-slate-700 rounded-xl p-2.5 text-xs text-center outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      {allBooks.find(b => b.id === selectedBookId)?.chapters.map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">الصفحة رقم</label>
                    <select
                      value={selectedPageNumber}
                      onChange={(e) => setSelectedPageNumber(parseInt(e.target.value))}
                      className="w-full bg-white border border-slate-200 text-slate-700 rounded-xl p-2.5 text-xs text-center outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      {allBooks.find(b => b.id === selectedBookId)
                        ?.chapters.find(c => c.id === selectedChapterId)
                        ?.pages.map(p => (
                          <option key={p.pageNumber} value={p.pageNumber}>صفحة {p.pageNumber}</option>
                        ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold p-2.5 rounded-xl shadow-lg shadow-emerald-100 cursor-pointer transition-all w-full"
                  >
                    تعميم صفحة الكتاب 📚
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Core Quran Board Text Display (Beautiful diacritics, high contrast) */}
          <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-xl shadow-slate-200/50 relative text-center text-slate-800">
            {/* Elegant Islamic frame background */}
            <div className="absolute top-3 left-3 right-3 bottom-3 border border-emerald-100 rounded-2xl pointer-events-none" />
            
            <div className="mb-4 text-center flex flex-col sm:flex-row sm:justify-between items-center gap-3">
              <div className="flex-1 text-center">
                {classroomState?.bookAssignment ? (
                  <>
                    <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block">المنهج الدراسي - اللوح التعليمي المشترك</span>
                    <h2 className="text-base font-extrabold text-slate-800 mt-1 font-serif leading-relaxed">
                      {classroomState.bookAssignment.bookTitle} <span className="text-emerald-600">({classroomState.bookAssignment.chapterTitle})</span> - صفحة {classroomState.bookAssignment.pageNumber}
                    </h2>
                  </>
                ) : (
                  <>
                    <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block">القرآن الكريم - اللوح الدراسي المباشر</span>
                    {classroomState?.assignment ? (
                      <h2 className="text-xl font-extrabold text-slate-800 mt-1 font-serif">
                        سورة {classroomState.assignment.surahName} (الآيات {classroomState.assignment.startAyah} - {classroomState.assignment.endAyah})
                      </h2>
                    ) : (
                      <h2 className="text-sm font-bold text-slate-400 mt-1">بانتظار تحديد المعلم لمادة القراءة المطلوبة...</h2>
                    )}
                  </>
                )}
              </div>
              <div className="shrink-0 flex items-center gap-2">
                {!classroomState?.bookAssignment && (
                  <select
                    value={selectedReciter}
                    onChange={(e) => {
                      setSelectedReciter(e.target.value);
                      if (audioPlayerRef.current) {
                        audioPlayerRef.current.pause();
                        setPlayingAyahKey(null);
                      }
                    }}
                    className="bg-slate-50 border border-slate-205 text-slate-700 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer shadow-sm"
                  >
                    {RECITERS_LIST.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                )}

                <button
                  onClick={() => setIsFocusMode(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-indigo-600 hover:bg-indigo-550 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 transition-all duration-300 hover:scale-105 cursor-pointer"
                  title="تفعيل وضع القراءة المركزة المريح للعين"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>وضع القراءة المركزة 🧘‍♂️</span>
                </button>
              </div>
            </div>

            {/* Classical Arabic Quran Box */}
            <div>
              <div 
                style={{ fontSize: `${fontSettings.fontSize}rem` }}
                className={`py-8 px-6 bg-emerald-50/15 rounded-2xl border border-emerald-100/40 text-center leading-[3.2rem] max-h-[350px] overflow-y-auto scrollbar-thin ${fontSettings.fontFamily}`}
              >
                {classroomState?.bookAssignment ? (
                  <div className="text-slate-800 space-y-3.5 max-h-[350px] overflow-y-auto scrollbar-thin py-2">
                    {classroomState.bookAssignment.content.map((line, idx) => {
                      const isPlaying = playingBookLineIdx === idx;
                      return (
                        <div
                          key={idx}
                          onClick={() => setPlayingBookLineIdx(playingBookLineIdx === idx ? null : idx)}
                          className={`p-4 rounded-xl border transition-all cursor-pointer font-medium text-base font-serif leading-relaxed text-right ${
                            isPlaying
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-sm scale-[1.01]'
                              : 'bg-slate-50/50 border-slate-100 hover:bg-slate-50 hover:border-slate-200 text-slate-750'
                          }`}
                          title="انقر لتظليل هذا البيت أو السطر للقراءة"
                        >
                          {line}
                        </div>
                      );
                    })}
                  </div>
                ) : versesLoading ? (
                  <div className="py-8 flex flex-col items-center justify-center gap-2">
                    <Loader className="h-8 w-8 text-emerald-600 animate-spin" />
                    <p className="text-xs text-slate-400 font-sans">جاري جلب الآيات الكريمة من المصحف الشريف...</p>
                  </div>
                ) : currentAssignedVerses.length === 0 ? (
                  <p className="text-slate-400 text-sm italic font-sans py-8">المعلم لم يعين أي آيات قرآنية أو كتب لعرضها حالياً.</p>
                ) : (
                  <div className="text-slate-800 leading-[3.4rem] tracking-wide font-medium flex flex-wrap justify-center gap-x-2 gap-y-4">
                    {currentAssignedVerses.map(v => {
                      const isPlaying = playingAyahKey === `${v.surahNumber}_${v.ayahNumber}`;
                      return (
                        <span 
                          key={v.ayahNumber} 
                          onClick={() => playAyahAudio(v)}
                          className={`relative transition-all duration-300 hover:text-emerald-705 inline-block text-center cursor-pointer px-1 py-0.5 rounded-lg ${
                            isPlaying ? 'bg-indigo-50 border border-indigo-150 text-indigo-750 font-bold scale-105 shadow-sm' : ''
                          }`}
                          title="انقر لتشغيل تلاوة الآية"
                        >
                          <span>{v.text}</span>
                          <span className={`inline-block h-8 w-8 text-xs border rounded-full font-serif font-bold pt-1.5 mr-2 leading-none align-middle select-none shadow-sm ${
                            isPlaying
                              ? 'border-indigo-400 bg-indigo-500 text-white shadow-md'
                              : 'border-emerald-200 bg-white text-emerald-700'
                          }`}>
                            {v.ayahNumber}
                          </span>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Font controller below the text */}
              <div className="flex justify-center mt-4">
                <QuranFontController settings={fontSettings} onChange={setFontSettings} isDark={false} />
              </div>
            </div>

            {/* Quick action button for AI help on assigned verse or book line */}
            {(classroomState?.bookAssignment || currentAssignedVerses.length > 0) && (
              <button
                onClick={() => {
                  if (classroomState?.bookAssignment) {
                    const activeLine = playingBookLineIdx !== null 
                      ? classroomState.bookAssignment.content[playingBookLineIdx] 
                      : classroomState.bookAssignment.content.join('\n');
                    askGeminiTeacher(`أريد شرح هذا المقطع من ${classroomState.bookAssignment.bookTitle}:\n"${activeLine}"\n\nما هي الأحكام التجويدية أو النحوية أو الفقهية فيه؟`);
                  } else {
                    const fullText = currentAssignedVerses.map(v => v.text).join(' ');
                    askGeminiTeacher(fullText);
                  }
                }}
                className="mt-4 inline-flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer shadow-sm"
              >
                <Sparkles className="h-4 w-4 animate-pulse text-indigo-500" />
                <span>تحليل وتفسير هذا المقطع بالذكاء الاصطناعي (تجويد/نحو/فقه) 🤖</span>
              </button>
            )}
          </div>

          {/* AI Tajweed Assistant Explanations panel (using Gemini) */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm text-slate-800">
            <h3 className="text-base font-extrabold text-indigo-700 mb-3 flex items-center gap-1.5 font-sans">
              <Sparkles className="h-5 w-5 text-indigo-500" />
              <span>المساعد التعليمي الذكي للقرآن والدروس الحوزوية (AI Assistant)</span>
            </h3>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="اسأل المساعد الذكي عن التجويد، أو معاني الآيات، أو قواعد النحو والمنطق والأصول..."
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 rounded-xl px-4 py-2.5 text-xs text-right outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                onKeyDown={(e) => e.key === 'Enter' && askGeminiTeacher()}
              />
              <button
                onClick={() => askGeminiTeacher()}
                disabled={aiLoading}
                className="bg-indigo-600 hover:bg-indigo-750 disabled:bg-slate-100 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-all flex items-center justify-center cursor-pointer shadow-lg shadow-indigo-100"
              >
                {aiLoading ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* AI Explanation feedback box */}
            {aiLoading ? (
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 text-center py-8">
                <Loader className="h-8 w-8 text-indigo-500 animate-spin mx-auto mb-2" />
                <p className="text-slate-400 text-xs font-bold">جاري التحليل والتفسير الأكاديمي عبر Gemini...</p>
              </div>
            ) : aiResponse ? (
              <div className="bg-indigo-50/30 border border-indigo-100/60 p-5 rounded-xl text-slate-800 text-xs md:text-sm leading-relaxed text-right overflow-y-auto max-h-60 scrollbar-thin">
                <div className="flex items-center gap-1.5 mb-2.5 text-indigo-600 font-bold border-b border-indigo-100 pb-1.5">
                  <Sparkles className="h-4 w-4" />
                  <span>توضيح الشرح والتحليل المعتمد:</span>
                </div>
                <div className="whitespace-pre-line text-slate-800 font-sans">{aiResponse}</div>
              </div>
            ) : (
              <div className="bg-slate-50 p-4 rounded-xl text-center border border-slate-100 text-slate-500 text-xs flex items-center gap-2 justify-center">
                <HelpCircle className="h-4 w-4 text-slate-400" />
                <span>اسأل عن التجويد ومخارج الحروف، أو اطلب شرحاً للمسائل الأصولية والنحوية والفقهية للمتون لتلقي الإجابة فوراً.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
