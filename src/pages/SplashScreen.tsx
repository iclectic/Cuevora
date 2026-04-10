import { useEffect, useState } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
  minDuration?: number;
}

const SplashScreen = ({ onComplete, minDuration = 2000 }: SplashScreenProps) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setVisible(false), minDuration);
    const removeTimer = setTimeout(onComplete, minDuration + 400);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [onComplete, minDuration]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{
        backgroundColor: '#1e1b4b',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.4s ease-out',
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      {/* Radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 45%, rgba(124,58,237,0.2) 0%, transparent 60%)',
        }}
      />

      {/* Icon */}
      <div className="relative mb-8">
        <svg
          width="88"
          height="88"
          viewBox="0 0 512 512"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="splashCGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#7c3aed" />
            </linearGradient>
            <linearGradient id="splashAccent" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
          </defs>
          <rect width="512" height="512" rx="108" fill="#1e1b4b" />
          <path d="M310 130 C200 130, 120 200, 120 256 C120 312, 200 382, 310 382"
            stroke="url(#splashCGrad)" strokeWidth="48" fill="none" strokeLinecap="round" />
          <rect x="200" y="220" width="140" height="12" rx="6" fill="url(#splashAccent)" opacity="0.9" />
          <rect x="200" y="250" width="110" height="12" rx="6" fill="url(#splashAccent)" opacity="0.65" />
          <rect x="200" y="280" width="80" height="12" rx="6" fill="url(#splashAccent)" opacity="0.4" />
          <path d="M360 230 L395 256 L360 282 Z" fill="#f59e0b" opacity="0.85" />
        </svg>
      </div>

      {/* App name */}
      <h1
        className="text-3xl font-bold tracking-tight"
        style={{ color: '#f0f0f0' }}
      >
        Cuevora
      </h1>

      {/* Tagline */}
      <p
        className="mt-2 text-sm font-medium"
        style={{ color: '#a78bfa' }}
      >
        Teleprompter features, actually free.
      </p>

      {/* Loading dots */}
      <div className="mt-10 flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-1.5 w-1.5 rounded-full"
            style={{
              backgroundColor: '#a78bfa',
              animation: `splash-dot 1s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes splash-dot {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
