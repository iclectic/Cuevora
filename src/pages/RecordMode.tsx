import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getScript, getSettings } from '@/lib/storage';
import { PLAYER_THEMES, PlayerTheme } from '@/types/script';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  ArrowLeft, Play, Pause, SkipBack, SkipForward, FlipHorizontal,
  Camera, SwitchCamera, Columns, Layers, Type, Circle, Square,
  Download,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const RecordMode = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const settings = getSettings();
  const script = id ? getScript(id) : null;

  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(settings.defaultSpeed);
  const [fontSize, setFontSize] = useState(Math.min(settings.defaultFontSize, 28));
  const [theme, setTheme] = useState<PlayerTheme>(settings.defaultTheme);
  const [mirrored, setMirrored] = useState(false);
  const [splitView, setSplitView] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Recording state
  const [recording, setRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const currentTheme = PLAYER_THEMES[theme];

  // Camera — request audio too so recordings have sound
  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
      setCameraError(null);
    } catch (err) {
      setCameraError('Camera access denied. Please allow camera and microphone permissions.');
      setCameraActive(false);
    }
  }, [facingMode]);

  useEffect(() => {
    startCamera();
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [startCamera]);

  // Keep screen awake
  useEffect(() => {
    let wakeLock: any = null;
    if ('wakeLock' in navigator) {
      (navigator as any).wakeLock.request('screen').then((lock: any) => {
        wakeLock = lock;
      }).catch(() => {});
    }
    return () => { wakeLock?.release(); };
  }, []);

  // Recording logic
  const startRecording = useCallback(() => {
    if (!streamRef.current) return;

    // Clean up previous recording
    if (recordedVideoUrl) {
      URL.revokeObjectURL(recordedVideoUrl);
      setRecordedVideoUrl(null);
      setRecordedBlob(null);
    }

    chunksRef.current = [];
    setRecordingDuration(0);

    // Pick a supported MIME type
    const mimeTypes = [
      'video/mp4',
      'video/mp4;codecs=avc1,mp4a.40.2',
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
    ];
    let mimeType = '';
    for (const mt of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mt)) { mimeType = mt; break; }
    }

    try {
      const recorder = new MediaRecorder(streamRef.current, {
        mimeType: mimeType || undefined,
        videoBitsPerSecond: 4_000_000,
      });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType || 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedVideoUrl(url);
        setRecordedBlob(blob);
        chunksRef.current = [];
      };

      recorder.start(1000); // collect data every second
      mediaRecorderRef.current = recorder;
      setRecording(true);

      // Start duration timer
      timerRef.current = setInterval(() => {
        setRecordingDuration(d => d + 1);
      }, 1000);

      // Also start the teleprompter scrolling
      setPlaying(true);
    } catch (err) {
      console.error('Failed to start recording:', err);
    }
  }, [recordedVideoUrl]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
    setRecording(false);
    setPlaying(false);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = undefined;
    }
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (timerRef.current) clearInterval(timerRef.current);
      if (recordedVideoUrl) URL.revokeObjectURL(recordedVideoUrl);
    };
  }, [recordedVideoUrl]);

  const [saving, setSaving] = useState(false);

  const downloadRecording = useCallback(async () => {
    if (!recordedBlob || saving) return;
    setSaving(true);

    const ext = recordedBlob.type.includes('mp4') ? 'mp4' : 'webm';
    const filename = `${(script?.title || 'recording').replace(/[^a-zA-Z0-9-_ ]/g, '')}-${Date.now()}.${ext}`;

    try {
      if (Capacitor.isNativePlatform()) {
        // Convert blob to base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            // Strip the data:video/...;base64, prefix
            const base64Data = result.split(',')[1];
            resolve(base64Data);
          };
          reader.onerror = reject;
          reader.readAsDataURL(recordedBlob);
        });

        // Write to device cache
        const writeResult = await Filesystem.writeFile({
          path: filename,
          data: base64,
          directory: Directory.Cache,
        });

        // Share the file (opens Android share sheet — user can save to Files, Drive, etc.)
        await Share.share({
          title: script?.title || 'Recording',
          url: writeResult.uri,
          dialogTitle: 'Save your recording',
        });
      } else {
        // Web fallback: standard download
        const url = URL.createObjectURL(recordedBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Failed to save recording:', err);
      alert('Failed to save recording. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [recordedBlob, script?.title, saving]);

  const dismissRecording = useCallback(() => {
    if (recordedVideoUrl) URL.revokeObjectURL(recordedVideoUrl);
    setRecordedVideoUrl(null);
    setRecordedBlob(null);
  }, [recordedVideoUrl]);

  // Scroll animation
  const scrollStep = useCallback((timestamp: number) => {
    if (!scrollRef.current) return;
    if (lastTimeRef.current === 0) lastTimeRef.current = timestamp;
    const delta = timestamp - lastTimeRef.current;
    lastTimeRef.current = timestamp;
    const pxPerSecond = speed * 20;
    scrollRef.current.scrollTop += (pxPerSecond * delta) / 1000;
    const el = scrollRef.current;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10) {
      setPlaying(false);
      // Auto-stop recording when script ends
      if (recording) stopRecording();
      return;
    }
    animRef.current = requestAnimationFrame(scrollStep);
  }, [speed, recording, stopRecording]);

  useEffect(() => {
    if (playing) {
      lastTimeRef.current = 0;
      animRef.current = requestAnimationFrame(scrollStep);
    } else {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    }
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [playing, scrollStep]);

  const toggleCamera = () => {
    if (recording) return; // Don't switch camera while recording
    setFacingMode(f => f === 'user' ? 'environment' : 'user');
  };

  if (!script) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Script not found</p>
      </div>
    );
  }

  const lines = script.content.split('\n');

  return (
    <div className="relative flex min-h-screen flex-col bg-black overflow-hidden">
      {/* Camera preview */}
      <div className={`${splitView ? 'h-1/2' : 'absolute inset-0'} bg-black`}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="h-full w-full object-cover"
          style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
        />
        {cameraError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-8">
            <div className="text-center">
              <Camera className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">{cameraError}</p>
              <Button className="mt-3" size="sm" onClick={startCamera}>Retry</Button>
            </div>
          </div>
        )}
      </div>

      {/* Recording indicator */}
      {recording && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-black/70 rounded-full px-4 py-1.5">
          <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
          <span className="text-white text-sm font-mono font-medium">
            REC {formatDuration(recordingDuration)}
          </span>
        </div>
      )}

      {/* Script overlay / split view */}
      <div
        ref={scrollRef}
        className={`${splitView ? 'h-1/2' : 'absolute inset-0'} overflow-y-auto`}
        style={{
          backgroundColor: splitView ? currentTheme.bg : `${currentTheme.bg}99`,
          color: currentTheme.fg,
          transform: mirrored ? 'scaleX(-1)' : 'none',
        }}
      >
        <div
          style={{
            fontSize: `${fontSize}px`,
            lineHeight: 1.5,
            padding: splitView ? '1rem 1.5rem' : '4rem 2rem 50vh 2rem',
            paddingTop: splitView ? '1rem' : '30vh',
            paddingBottom: '60vh',
          }}
        >
          {lines.map((line, i) => (
            <p key={i} className="mb-1">{line || '\u00A0'}</p>
          ))}
        </div>
      </div>

      {/* Recorded video preview overlay */}
      {recordedVideoUrl && (
        <div className="absolute inset-0 z-[60] bg-black/90 flex flex-col items-center justify-center p-6">
          <p className="text-white text-lg font-medium mb-4">Recording Complete</p>
          <video
            src={recordedVideoUrl}
            controls
            className="w-full max-w-sm rounded-lg mb-6"
            style={{ maxHeight: '50vh' }}
          />
          <div className="flex gap-3">
            <Button
              onClick={downloadRecording}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            >
              <Download className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Video'}
            </Button>
            <Button
              variant="outline"
              onClick={dismissRecording}
              className="text-white border-white/30 hover:bg-white/10"
            >
              Dismiss
            </Button>
          </div>
          <p className="text-white/50 text-xs mt-3">
            Duration: {formatDuration(recordingDuration)}
          </p>
        </div>
      )}

      {/* Top controls */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center gap-2 px-4 py-3 bg-black/50" style={{ paddingTop: 'calc(2rem + env(safe-area-inset-top, 0px))' }}>
        <Button variant="ghost" size="icon" className="touch-target text-white" onClick={() => {
          if (recording) stopRecording();
          navigate(-1);
        }}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <span className="flex-1 text-sm font-medium text-white truncate">{script.title}</span>
        <Button variant="ghost" size="icon" className={`touch-target ${recording ? 'text-white/30' : 'text-white'}`} onClick={toggleCamera} disabled={recording}>
          <SwitchCamera className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost" size="icon"
          className="touch-target"
          style={{ color: mirrored ? '#10b981' : 'white' }}
          onClick={() => setMirrored(!mirrored)}
        >
          <FlipHorizontal className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost" size="icon"
          className="touch-target"
          style={{ color: splitView ? '#10b981' : 'white' }}
          onClick={() => setSplitView(!splitView)}
        >
          {splitView ? <Layers className="h-5 w-5" /> : <Columns className="h-5 w-5" />}
        </Button>
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 z-50 bg-black/60 safe-area-padding">
        <div className="flex items-center gap-1 px-4 py-1">
          <Type className="h-3 w-3 text-white/60" />
          <Slider
            value={[fontSize]}
            onValueChange={([v]) => setFontSize(v)}
            min={14}
            max={48}
            step={2}
            className="flex-1"
          />
          <span className="text-xs text-white/60 w-8 text-right">{fontSize}</span>
        </div>
        <div className="flex items-center justify-center gap-4 px-6 py-3">
          <Button variant="ghost" size="icon" className="h-11 w-11 rounded-full text-white"
            onClick={() => { if (scrollRef.current) scrollRef.current.scrollTop = Math.max(0, scrollRef.current.scrollTop - speed * 100); }}>
            <SkipBack className="h-5 w-5" />
          </Button>

          {/* Teleprompter play/pause */}
          <Button
            size="icon"
            className="h-12 w-12 rounded-full bg-white/20 text-white"
            onClick={() => setPlaying(!playing)}
          >
            {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
          </Button>

          {/* Record button — big red circle */}
          <button
            onClick={recording ? stopRecording : startRecording}
            disabled={!cameraActive}
            className="h-16 w-16 rounded-full border-4 border-white flex items-center justify-center transition-all disabled:opacity-30"
            aria-label={recording ? 'Stop recording' : 'Start recording'}
          >
            {recording ? (
              <Square className="h-6 w-6 text-red-500 fill-red-500" />
            ) : (
              <Circle className="h-10 w-10 text-red-500 fill-red-500" />
            )}
          </button>

          <Button variant="ghost" size="icon" className="h-11 w-11 rounded-full text-white"
            onClick={() => { if (scrollRef.current) scrollRef.current.scrollTop += speed * 100; }}>
            <SkipForward className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RecordMode;
