import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, Play, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RehearsalCoachPanel } from '@/components/RehearsalCoachPanel';
import { RehearsalReport } from '@/components/RehearsalReport';
import { useSpeechEvents } from '@/hooks/use-speech-events';
import { haptic } from '@/lib/haptics';
import { analyzeRehearsal } from '@/lib/rehearsal-metrics';
import { getScript, saveRehearsalSession } from '@/lib/storage';
import { RehearsalSession, SpeechTranscriptEvent } from '@/types/studio';
import { AccessibleStatus } from '@/components/AccessibleStatus';

const Rehearsal = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const script = id ? getScript(id) : null;
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [events, setEvents] = useState<SpeechTranscriptEvent[]>([]);
  const [savedSession, setSavedSession] = useState<RehearsalSession | null>(null);

  const speech = useSpeechEvents({
    enabled: true,
    onTranscript: (event) => setEvents(current => [...current, event]),
  });
  const latestTranscript = events[events.length - 1]?.transcript ?? '';
  const statusMessage = startedAt
    ? speech.listening
      ? latestTranscript ? `Latest transcript: ${latestTranscript}` : 'Rehearsal listening'
      : 'Rehearsal running with limited speech feedback'
    : savedSession
      ? 'Rehearsal report saved locally'
      : 'Rehearsal ready';

  const liveMetrics = useMemo(() => {
    if (!script || startedAt === null) return null;
    return analyzeRehearsal({
      scriptContent: script.content,
      transcriptEvents: events,
      startedAt,
      endedAt: Date.now(),
    });
  }, [events, script, startedAt]);

  const start = () => {
    setEvents([]);
    setSavedSession(null);
    setStartedAt(Date.now());
    speech.start();
    void haptic('medium');
  };

  const stop = () => {
    if (!script || startedAt === null) return;
    const endedAt = Date.now();
    speech.stop();
    const metrics = analyzeRehearsal({
      scriptContent: script.content,
      transcriptEvents: events,
      startedAt,
      endedAt,
    });
    const session = saveRehearsalSession({
      scriptId: script.id,
      scriptTitle: script.title,
      startedAt,
      endedAt,
      transcriptEvents: events,
      metrics,
    });
    setSavedSession(session);
    setStartedAt(null);
    void haptic('medium');
  };

  if (!script) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="max-w-sm p-6 text-center">
          <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <h1 className="mb-2 text-lg font-semibold text-foreground">Script not found</h1>
          <p className="mb-4 text-sm text-muted-foreground">The script may have been deleted or could not be loaded.</p>
          <Button onClick={() => navigate('/home')}>Back to Scripts</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background safe-area-padding">
      <AccessibleStatus message={statusMessage} />
      <header className="flex items-center gap-2 px-4 pb-2" style={{ paddingTop: 'calc(1.5rem + env(safe-area-inset-top, 0px))' }}>
        <Button variant="ghost" size="icon" className="touch-target" onClick={() => navigate(-1)} aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold text-foreground">Rehearse</h1>
          <p className="truncate text-xs text-muted-foreground">{script.title}</p>
        </div>
      </header>

      <main className="space-y-4 px-5 py-4">
        <div className="rounded-lg border bg-card p-4 text-card-foreground">
          <p className="text-sm text-muted-foreground">
            Practice without recording. Cuevora stores the report locally only when you stop and save the session.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {startedAt === null ? (
              <Button onClick={start} className="touch-target gap-2">
                <Play className="h-4 w-4" />
                Start rehearsal
              </Button>
            ) : (
              <Button onClick={stop} className="touch-target gap-2" variant="destructive">
                <Square className="h-4 w-4" />
                Stop and save
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate(`/player/${script.id}`)} className="touch-target">
              Open prompt
            </Button>
          </div>
        </div>

        <RehearsalCoachPanel metrics={liveMetrics} listening={speech.listening} supported={speech.supported} />

        {!speech.supported && (
          <div className="rounded-lg border bg-card p-4 text-card-foreground" role="note">
            <h2 className="text-sm font-semibold">Limited feedback available</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Speech recognition is unavailable on this device or browser. You can still rehearse and use the prompt, but transcript-based metrics will be unavailable.
            </p>
          </div>
        )}

        {events.length > 0 && (
          <div className="rounded-lg border bg-card p-4 text-card-foreground" role="region" aria-label="Latest transcript">
            <h2 className="text-sm font-semibold">Latest transcript</h2>
            <p className="mt-2 text-sm text-muted-foreground">{latestTranscript}</p>
          </div>
        )}

        {savedSession && <RehearsalReport session={savedSession} />}
      </main>
    </div>
  );
};

export default Rehearsal;
