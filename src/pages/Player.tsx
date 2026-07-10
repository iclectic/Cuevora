import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getScript, getSettings, getWordCount } from '@/lib/storage';
import { haptic } from '@/lib/haptics';
import { PLAYER_THEMES, PlayerTheme } from '@/types/script';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  ArrowLeft, Play, Pause, SkipBack, SkipForward, FlipHorizontal,
  Type, AlignJustify, Palette, Timer, Video, Mic, MicOff,
  RotateCcw, Gauge, Hand, Camera, SwitchCamera,
  Home, RefreshCw, ChevronsDown, ChevronsUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVoiceControl, VoiceCommand } from '@/hooks/use-voice-control';
import { useGestureControls } from '@/hooks/use-gesture-controls';
import { usePromptPlayback } from '@/hooks/use-prompt-playback';
import { useAccessibleShortcuts } from '@/hooks/use-accessible-shortcuts';
import { computeAdaptiveScrollSpeed } from '@/lib/adaptive-scroll';
import { SpeechTranscriptEvent } from '@/types/studio';
import { applyProfileFontSize, applyProfileLineSpacing, getAccessibilityProfile } from '@/lib/accessibility-profiles';
import { AccessibleStatus } from '@/components/AccessibleStatus';
import { AccessibleControlsPanel } from '@/components/AccessibleControlsPanel';

const SPEED_PRESETS = [
  { label: 'Slow', value: 2 },
  { label: 'Medium', value: 4 },
  { label: 'Fast', value: 7 },
  { label: 'Turbo', value: 10 },
];

const Player = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const settings = getSettings();
  const script = id ? getScript(id) : null;

  const [speed, setSpeed] = useState(settings.defaultSpeed);
  const [manualOverrideUntil, setManualOverrideUntil] = useState(0);
  const [speechEvents, setSpeechEvents] = useState<SpeechTranscriptEvent[]>([]);
  const [fontSize, setFontSize] = useState(settings.defaultFontSize);
  const [lineSpacing, setLineSpacing] = useState(settings.defaultLineSpacing);
  const [theme, setTheme] = useState<PlayerTheme>(settings.defaultTheme);
  const [mirrored, setMirrored] = useState(settings.mirrorMode);
  const [showControls, setShowControls] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [focusLine, setFocusLine] = useState(settings.focusLineEnabled);
  const [showPanel, setShowPanel] = useState<'none' | 'speed' | 'font' | 'theme'>('none');
  const [voiceEnabled, setVoiceEnabled] = useState(settings.voiceControlsEnabled);
  const [gesturesEnabled, setGesturesEnabled] = useState(settings.gestureControlsEnabled);
  const [showGestureGuide, setShowGestureGuide] = useState(() => {
    try {
      return localStorage.getItem('cuevora_player_gesture_guide_seen') !== 'true';
    } catch {
      return true;
    }
  });

  // Camera state
  const [cameraOn, setCameraOn] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [cameraError, setCameraError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const currentTheme = PLAYER_THEMES[theme];
  const accessibilityProfile = getAccessibilityProfile(settings.accessibilityProfile);
  const displayFontSize = applyProfileFontSize(fontSize, accessibilityProfile);
  const displayLineSpacing = applyProfileLineSpacing(lineSpacing, accessibilityProfile);
  const reducedMotionEnabled = accessibilityProfile.reducedMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const controlsAlwaysVisible = accessibilityProfile.simplifiedControls || reducedMotionEnabled;
  const adaptiveScroll = useMemo(() => computeAdaptiveScrollSpeed({
    baseSpeed: speed,
    targetWpm: settings.wpm,
    transcriptEvents: speechEvents,
    now: Date.now(),
    manualOverrideUntil,
  }), [manualOverrideUntil, settings.wpm, speechEvents, speed]);
  const playback = usePromptPlayback({
    scrollRef,
    speed: settings.adaptiveScrollEnabled ? adaptiveScroll.speed : speed,
  });

  // Word count & estimated read time
  const wordCount = useMemo(() => script ? getWordCount(script.content) : 0, [script]);
  const totalReadTimeSec = useMemo(() => Math.ceil((wordCount / settings.wpm) * 60), [wordCount, settings.wpm]);

  const timeRemaining = useMemo(() => {
    const remaining = Math.max(0, Math.ceil(totalReadTimeSec * (1 - playback.scrollProgress)));
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  }, [totalReadTimeSec, playback.scrollProgress]);

  const formatElapsed = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const updateSpeed = useCallback((next: number | ((current: number) => number)) => {
    setManualOverrideUntil(Date.now() + 5000);
    setSpeed(current => typeof next === 'function' ? next(current) : next);
  }, []);

  // Keep screen awake
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;
    if (settings.keepScreenAwake && 'wakeLock' in navigator) {
      navigator.wakeLock.request('screen').then((lock) => {
        wakeLock = lock;
      }).catch(() => { /* noop */ });
    }
    return () => { wakeLock?.release(); };
  }, [settings.keepScreenAwake]);

  // Auto-hide controls after 4s of playback
  useEffect(() => {
    if (playback.playing && showControls && !controlsAlwaysVisible) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 4000);
    }
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [controlsAlwaysVisible, playback.playing, showControls]);

  // Countdown
  const startCountdown = (secs: number) => {
    setCountdown(secs);
  };

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      setCountdown(null);
      playback.play();
      return;
    }
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, playback]);

  const rewind = useCallback(() => {
    const pxPerSecond = speed * 20;
    playback.seekByPixels(-(pxPerSecond * 5));
    void haptic('light');
  }, [playback, speed]);

  const forward = useCallback(() => {
    const pxPerSecond = speed * 20;
    playback.seekByPixels(pxPerSecond * 5);
    void haptic('light');
  }, [playback, speed]);

  const resetScroll = useCallback(() => {
    playback.reset();
    void haptic('medium');
  }, [playback]);

  const jumpToEnd = useCallback(() => {
    playback.jumpToEnd();
    void haptic('selection');
  }, [playback]);

  const togglePlay = useCallback(() => {
    void haptic('medium');
    if (!playback.playing && scrollRef.current?.scrollTop === 0) {
      startCountdown(settings.countdownDuration);
    } else {
      playback.toggle();
    }
  }, [playback, settings.countdownDuration]);

  // Voice control
  const handleVoiceCommand = useCallback((cmd: VoiceCommand) => {
    switch (cmd) {
      case 'play': playback.play(); break;
      case 'pause': playback.pause(); break;
      case 'stop': playback.pause(); break;
      case 'faster': updateSpeed(s => Math.min(10, s + 1)); void haptic('selection'); break;
      case 'slower': updateSpeed(s => Math.max(1, s - 1)); void haptic('selection'); break;
      case 'reset': resetScroll(); break;
    }
  }, [playback, resetScroll, updateSpeed]);

  const handleTranscript = useCallback((event: SpeechTranscriptEvent) => {
    setSpeechEvents(events => [...events.slice(-24), event]);
  }, []);

  const voice = useVoiceControl({
    onCommand: handleVoiceCommand,
    enabled: voiceEnabled || settings.adaptiveScrollEnabled,
    onTranscript: handleTranscript,
  });
  const { start: startVoice, stop: stopVoice } = voice;

  const statusMessage = useMemo(() => {
    if (countdown !== null) return countdown === 0 ? 'Starting teleprompter' : `Starting in ${countdown}`;
    if (voice.listening) return voice.lastTranscript ? `Listening: ${voice.lastTranscript}` : 'Voice control listening';
    if (playback.playing) return `Teleprompter playing. ${Math.round(playback.scrollProgress * 100)} percent complete.`;
    return `Teleprompter paused. ${Math.round(playback.scrollProgress * 100)} percent complete.`;
  }, [countdown, playback.playing, playback.scrollProgress, voice.lastTranscript, voice.listening]);

  useEffect(() => {
    if (voiceEnabled || settings.adaptiveScrollEnabled) {
      startVoice();
    } else {
      stopVoice();
    }
  }, [settings.adaptiveScrollEnabled, startVoice, stopVoice, voiceEnabled]);

  const toggleVoice = useCallback(() => {
    if (voiceEnabled) {
      setVoiceEnabled(false);
    } else {
      setVoiceEnabled(true);
    }
  }, [voiceEnabled]);

  // Gesture controls
  useGestureControls({
    elementRef: containerRef,
    enabled: gesturesEnabled,
    onTapCenter: () => setShowControls(s => !s),
    onTapLeft: rewind,
    onTapRight: forward,
    onDoubleTap: togglePlay,
    onSwipeUp: () => { updateSpeed(s => Math.min(10, s + 0.5)); void haptic('selection'); },
    onSwipeDown: () => { updateSpeed(s => Math.max(1, s - 0.5)); void haptic('selection'); },
    onPinchOut: () => { setFontSize(s => Math.min(72, s + 2)); void haptic('selection'); },
    onPinchIn: () => { setFontSize(s => Math.max(16, s - 2)); void haptic('selection'); },
  });

  // Camera
  const startCamera = useCallback(async (facing: 'user' | 'environment') => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraError(null);
    } catch {
      setCameraError('Camera access denied.');
      setCameraOn(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const toggleCamera = useCallback(() => {
    if (cameraOn) {
      stopCamera();
      setCameraOn(false);
    } else {
      setCameraOn(true);
      startCamera(facingMode);
    }
  }, [cameraOn, facingMode, startCamera, stopCamera]);

  const switchCamera = useCallback(() => {
    const next = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(next);
    if (cameraOn) startCamera(next);
  }, [facingMode, cameraOn, startCamera]);

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const shortcuts = useMemo(() => ({
    ' ': togglePlay,
    ArrowUp: () => { updateSpeed(s => Math.min(10, s + 0.5)); void haptic('selection'); },
    ArrowDown: () => { updateSpeed(s => Math.max(1, s - 0.5)); void haptic('selection'); },
    ArrowLeft: rewind,
    ArrowRight: forward,
    m: () => { setMirrored(m => !m); void haptic('selection'); },
    f: () => { setFocusLine(f => !f); void haptic('selection'); },
    r: resetScroll,
    Escape: () => navigate(-1),
  }), [forward, navigate, resetScroll, rewind, togglePlay, updateSpeed]);
  useAccessibleShortcuts(shortcuts);

  const accessibleActions = useMemo(() => [
    { id: 'prompt-play', label: playback.playing ? 'Pause' : 'Play', description: 'Start or pause prompting', pressed: playback.playing, onAction: togglePlay },
    { id: 'prompt-rewind', label: 'Rewind', description: 'Move back five seconds', onAction: rewind },
    { id: 'prompt-forward', label: 'Forward', description: 'Move ahead five seconds', onAction: forward },
    { id: 'prompt-reset', label: 'Reset', description: 'Return to the start', onAction: resetScroll },
    { id: 'prompt-slower', label: 'Slower', description: 'Reduce scroll speed', onAction: () => { updateSpeed(s => Math.max(1, s - 0.5)); void haptic('selection'); } },
    { id: 'prompt-faster', label: 'Faster', description: 'Increase scroll speed', onAction: () => { updateSpeed(s => Math.min(10, s + 0.5)); void haptic('selection'); } },
    { id: 'prompt-font-up', label: 'Larger text', description: 'Increase prompt text size', onAction: () => { setFontSize(s => Math.min(72, s + 2)); void haptic('selection'); } },
    { id: 'prompt-focus', label: 'Focus line', description: 'Toggle reading guide', pressed: focusLine, onAction: () => { setFocusLine(!focusLine); void haptic('selection'); } },
    { id: 'prompt-mirror', label: 'Mirror', description: 'Toggle mirror mode', pressed: mirrored, onAction: () => { setMirrored(!mirrored); void haptic('selection'); } },
    { id: 'prompt-camera', label: 'Camera overlay', description: 'Toggle camera preview', pressed: cameraOn, onAction: toggleCamera },
  ], [cameraOn, focusLine, forward, mirrored, playback.playing, resetScroll, rewind, toggleCamera, togglePlay, updateSpeed]);

  if (!script) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Script not found</p>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/home')}>Go Home</Button>
            <Button variant="outline" onClick={() => window.location.reload()}>Reload</Button>
          </div>
        </div>
      </div>
    );
  }

  const lines = script.content.split('\n');

  return (
    <div
      ref={containerRef}
      className="relative flex min-h-screen flex-col overflow-hidden select-none"
      style={{ backgroundColor: currentTheme.bg, color: currentTheme.fg }}
      role="main"
      aria-label={`Teleprompter for ${script.title}`}
    >
      <AccessibleStatus message={statusMessage} />
      {/* Camera preview (behind everything) */}
      {cameraOn && (
        <div className="absolute inset-0 z-0 bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            aria-hidden="true"
            className="h-full w-full object-cover"
            style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
          />
          {cameraError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-8">
              <div className="text-center">
                <Camera className="h-10 w-10 text-white/50 mx-auto mb-3" />
                <p className="text-sm text-white/70">{cameraError}</p>
                <Button className="mt-3" size="sm" onClick={() => startCamera(facingMode)}>Retry</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Scroll progress bar */}
      <div
        className="absolute top-0 left-0 z-50 h-1 transition-all duration-150"
        aria-hidden="true"
        style={{
          width: `${playback.scrollProgress * 100}%`,
          backgroundColor: '#a78bfa',
        }}
      />

      {/* Countdown overlay */}
      <AnimatePresence>
        {countdown !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={reducedMotionEnabled ? { duration: 0 } : undefined}
            className="absolute inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: currentTheme.bg }}
          >
            <motion.span
              key={countdown}
              initial={reducedMotionEnabled ? false : { scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={reducedMotionEnabled ? undefined : { scale: 1.5, opacity: 0 }}
              className="text-8xl font-bold"
              style={{ color: currentTheme.fg }}
            >
              {countdown}
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top bar */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={reducedMotionEnabled ? { duration: 0 } : undefined}
            className="absolute top-0 left-0 right-0 z-40 flex items-center gap-2 px-4 py-3"
            style={{ backgroundColor: `${currentTheme.bg}ee`, paddingTop: 'calc(2rem + env(safe-area-inset-top, 0px))' }}
          >
            <Button
              variant="ghost"
              size="icon"
              className="touch-target"
              style={{ color: currentTheme.fg }}
              onClick={() => navigate(-1)}
              aria-label="Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="touch-target"
              style={{ color: currentTheme.fg }}
              onClick={() => navigate('/home')}
              aria-label="Home"
            >
              <Home className="h-5 w-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <span className="block text-sm font-medium truncate" style={{ color: currentTheme.fg }}>
                {script.title}
              </span>
              <div className="flex items-center gap-3 text-[10px]" style={{ color: `${currentTheme.fg}66` }}>
                <span>{formatElapsed(playback.elapsedSeconds)}</span>
                <span>{Math.round(playback.scrollProgress * 100)}%</span>
                <span>{timeRemaining} left</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="touch-target"
              style={{ color: mirrored ? '#a78bfa' : currentTheme.fg }}
              onClick={() => { setMirrored(!mirrored); void haptic('selection'); }}
              aria-label="Toggle mirror mode"
            >
              <FlipHorizontal className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="touch-target"
              style={{ color: cameraOn ? '#a78bfa' : currentTheme.fg }}
              onClick={toggleCamera}
              aria-label="Toggle camera overlay"
            >
              <Camera className="h-5 w-5" />
            </Button>
            {cameraOn && (
              <Button
                variant="ghost"
                size="icon"
                className="touch-target"
                style={{ color: currentTheme.fg }}
                onClick={switchCamera}
                aria-label="Switch camera"
              >
                <SwitchCamera className="h-5 w-5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="touch-target"
              style={{ color: currentTheme.fg }}
              onClick={() => navigate(`/record/${id}`)}
              aria-label="Open record mode"
            >
              <Video className="h-5 w-5" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice control indicator */}
      <AnimatePresence>
        {voice.listening && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-20 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{ backgroundColor: `${currentTheme.bg}dd`, border: '1px solid #a78bfa44' }}
          >
            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] font-medium" style={{ color: '#a78bfa' }}>
              Listening{voice.lastTranscript ? `: "${voice.lastTranscript}"` : '...'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Text area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6 pt-16 pb-40"
        role="region"
        aria-label="Prompt text"
        style={{
          transform: mirrored ? 'scaleX(-1)' : 'none',
          backgroundColor: cameraOn ? `${currentTheme.bg}cc` : 'transparent',
          position: 'relative',
          zIndex: 1,
        }}
        onScroll={playback.handleScroll}
      >
        {/* Focus line indicator */}
        {focusLine && (
          <div
            className="fixed left-0 right-0 pointer-events-none z-30"
            style={{
              top: '40%',
              height: `${displayFontSize * displayLineSpacing}px`,
              background: `linear-gradient(180deg, transparent, ${currentTheme.fg}08, transparent)`,
            }}
          />
        )}

        <div
          className={accessibilityProfile.className}
          style={{
            fontSize: `${displayFontSize}px`,
            lineHeight: displayLineSpacing,
            paddingTop: '30vh',
            paddingBottom: '60vh',
          }}
        >
          {lines.map((line, i) => (
            <p key={i} className="mb-1" style={{
              opacity: script.highlights.includes(i) ? 1 : 0.95,
              fontWeight: script.highlights.includes(i) ? 700 : 400,
            }}>
              {script.markers.includes(i) && (
                <span className="block w-12 h-0.5 mb-2 rounded" style={{ backgroundColor: `${currentTheme.fg}30` }} />
              )}
              {line || '\u00A0'}
            </p>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {showGestureGuide && (
          <motion.div
            initial={reducedMotionEnabled ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reducedMotionEnabled ? undefined : { opacity: 0 }}
            className="absolute inset-0 z-[70] flex items-center justify-center bg-black/75 p-6"
          >
            <div className="max-w-sm rounded-2xl border border-white/15 bg-black/90 p-5 text-white shadow-2xl">
              <h2 className="text-lg font-semibold">Gesture guide</h2>
              <ul className="mt-3 space-y-2 text-sm text-white/75">
                <li>Tap centre: show or hide controls</li>
                <li>Tap left or right: rewind or forward</li>
                <li>Double tap: play or pause</li>
                <li>Swipe up or down: adjust speed</li>
                <li>Pinch with two fingers: change font size</li>
                <li>Drag with one finger: manually scroll</li>
              </ul>
              <Button
                className="mt-5 w-full"
                onClick={() => {
                  localStorage.setItem('cuevora_player_gesture_guide_seen', 'true');
                  setShowGestureGuide(false);
                  void haptic('light');
                }}
              >
                Got it
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={reducedMotionEnabled ? { duration: 0 } : undefined}
            className="absolute bottom-0 left-0 right-0 z-40 safe-area-padding"
            style={{ backgroundColor: `${currentTheme.bg}ee` }}
          >
            {/* Expandable panels */}
            <AnimatePresence>
              {showPanel !== 'none' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden px-6 pt-3"
                >
                  {showPanel === 'speed' && (
                    <div className="space-y-3">
                      {/* Speed presets */}
                      <div className="flex gap-2">
                        {SPEED_PRESETS.map(preset => (
                          <button
                            key={preset.label}
                            className="flex-1 rounded-lg py-2 text-xs font-medium transition-colors"
                            style={{
                              backgroundColor: speed === preset.value ? '#7c3aed' : `${currentTheme.fg}11`,
                              color: speed === preset.value ? '#fff' : `${currentTheme.fg}88`,
                            }}
                            onClick={() => { updateSpeed(preset.value); void haptic('selection'); }}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs" style={{ color: `${currentTheme.fg}88` }}>
                          <span>Custom Speed</span>
                          <span>{speed}x</span>
                        </div>
                        <Slider
                          value={[speed]}
                          onValueChange={([v]) => { updateSpeed(v); void haptic('selection'); }}
                          min={1}
                          max={10}
                          step={0.5}
                          className="touch-target"
                        />
                      </div>
                    </div>
                  )}
                  {showPanel === 'font' && (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs" style={{ color: `${currentTheme.fg}88` }}>
                          <span>Font Size</span>
                          <span>{fontSize}px</span>
                        </div>
                        <Slider
                          value={[fontSize]}
                          onValueChange={([v]) => { setFontSize(v); void haptic('selection'); }}
                          min={16}
                          max={72}
                          step={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs" style={{ color: `${currentTheme.fg}88` }}>
                          <span>Line Spacing</span>
                          <span>{lineSpacing.toFixed(1)}</span>
                        </div>
                        <Slider
                          value={[lineSpacing]}
                          onValueChange={([v]) => { setLineSpacing(v); void haptic('selection'); }}
                          min={1}
                          max={3}
                          step={0.1}
                        />
                      </div>
                    </div>
                  )}
                  {showPanel === 'theme' && (
                    <div className="flex gap-2">
                      {(Object.keys(PLAYER_THEMES) as PlayerTheme[]).map(key => (
                        <button
                          key={key}
                          className={`flex-1 rounded-lg p-3 text-xs font-medium border-2 transition-colors ${
                            theme === key ? 'border-primary' : 'border-transparent'
                          }`}
                          style={{
                            backgroundColor: PLAYER_THEMES[key].bg,
                            color: PLAYER_THEMES[key].fg,
                            border: theme === key ? '2px solid #a78bfa' : '2px solid transparent',
                          }}
                          onClick={() => { setTheme(key); void haptic('selection'); }}
                        >
                          {PLAYER_THEMES[key].label}
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {(accessibilityProfile.simplifiedControls || accessibilityProfile.highContrast) && (
              <div className="px-6 pt-3">
                <AccessibleControlsPanel title="Accessible prompt controls" actions={accessibleActions} />
              </div>
            )}

            {/* Panel toggles */}
            <div className="flex justify-center gap-1 px-6 pt-2">
              {[
                { key: 'speed' as const, icon: Gauge, label: 'Speed' },
                { key: 'font' as const, icon: Type, label: 'Font' },
                { key: 'theme' as const, icon: Palette, label: 'Theme' },
              ].map(({ key, icon: Icon, label }) => (
                <Button
                  key={key}
                  variant="ghost"
                  size="sm"
                  className="text-xs gap-1"
                  style={{ color: showPanel === key ? '#a78bfa' : `${currentTheme.fg}88` }}
                  onClick={() => setShowPanel(showPanel === key ? 'none' : key)}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </Button>
              ))}
            </div>

            {/* Transport controls */}
            <div className="flex items-center justify-center gap-2 px-6 py-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full"
                style={{ color: currentTheme.fg }}
                onClick={resetScroll}
                title="Reset to start"
                aria-label="Reset to start"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full"
                style={{ color: currentTheme.fg }}
                onClick={() => startCountdown(settings.countdownDuration)}
                title="Countdown"
                aria-label="Start countdown"
              >
                <Timer className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11 rounded-full"
                style={{ color: currentTheme.fg }}
                onClick={rewind}
                title="Rewind"
                aria-label="Rewind"
              >
                <SkipBack className="h-5 w-5" />
              </Button>
              <Button
                size="icon"
                className="h-16 w-16 rounded-full bg-primary text-primary-foreground shadow-lg"
                onClick={togglePlay}
                aria-label={playback.playing ? 'Pause teleprompter' : 'Play teleprompter'}
              >
                {playback.playing ? <Pause className="h-7 w-7" /> : <Play className="h-7 w-7 ml-0.5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11 rounded-full"
                style={{ color: currentTheme.fg }}
                onClick={forward}
                title="Forward"
                aria-label="Forward"
              >
                <SkipForward className="h-5 w-5" />
              </Button>
              {voice.supported && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full"
                  style={{ color: voice.listening ? '#a78bfa' : currentTheme.fg }}
                  onClick={toggleVoice}
                  title="Voice control"
                  aria-label="Toggle voice control"
                >
                  {voice.listening ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full"
                style={{ color: focusLine ? '#a78bfa' : currentTheme.fg }}
                onClick={() => { setFocusLine(!focusLine); void haptic('selection'); }}
                title="Focus line"
                aria-label="Toggle focus line"
              >
                <AlignJustify className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full"
                style={{ color: gesturesEnabled ? '#a78bfa' : currentTheme.fg }}
                onClick={() => { setGesturesEnabled(!gesturesEnabled); void haptic('selection'); }}
                title="Gesture controls"
                aria-label="Toggle gesture controls"
              >
                <Hand className="h-4 w-4" />
              </Button>
            </div>

            {/* Status bar */}
            <div className="flex items-center justify-center gap-4 px-6 pb-3 text-[10px]" style={{ color: `${currentTheme.fg}55` }}>
              <span>{wordCount} words</span>
              <span>{speed}x speed</span>
              <span>{displayFontSize}px</span>
              <span>{Math.round(playback.scrollProgress * 100)}%</span>
              <button type="button" onClick={resetScroll} className="inline-flex items-center gap-1 underline underline-offset-2">
                <ChevronsUp className="h-3 w-3" /> Start
              </button>
              <button type="button" onClick={jumpToEnd} className="inline-flex items-center gap-1 underline underline-offset-2">
                <ChevronsDown className="h-3 w-3" /> End
              </button>
              <button type="button" onClick={() => window.location.reload()} className="inline-flex items-center gap-1 underline underline-offset-2">
                <RefreshCw className="h-3 w-3" /> Reload
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Player;
