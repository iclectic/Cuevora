import { RehearsalMetrics } from '@/types/studio';
import { Badge } from '@/components/ui/badge';

interface RehearsalCoachPanelProps {
  metrics: RehearsalMetrics | null;
  listening: boolean;
  supported: boolean;
}

export function RehearsalCoachPanel({ metrics, listening, supported }: RehearsalCoachPanelProps) {
  if (!supported) {
    return (
      <section className="rounded-lg border bg-card p-4 text-card-foreground">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">Rehearsal coach</h2>
          <Badge variant="outline">Limited</Badge>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Speech recognition is unavailable on this device. Prompting still works, but transcript-based metrics are disabled.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border bg-card p-4 text-card-foreground">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">Rehearsal coach</h2>
        <Badge variant={listening ? 'default' : 'outline'}>{listening ? 'Listening' : 'Ready'}</Badge>
      </div>

      {metrics ? (
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-muted-foreground">Pace</dt>
            <dd className="font-medium">{metrics.wordsPerMinute === null ? 'Unavailable' : `${metrics.wordsPerMinute} WPM`}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Completion</dt>
            <dd className="font-medium">{metrics.completionPercent}%</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Long pauses</dt>
            <dd className="font-medium">{metrics.longPauseCount}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Filler words</dt>
            <dd className="font-medium">{metrics.fillerWordCount}</dd>
          </div>
        </dl>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">
          Start rehearsal to capture pacing, pause and filler-word feedback locally.
        </p>
      )}
    </section>
  );
}
