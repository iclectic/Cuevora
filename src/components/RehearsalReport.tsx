import { RehearsalSession } from '@/types/studio';

interface RehearsalReportProps {
  session: RehearsalSession;
}

export function RehearsalReport({ session }: RehearsalReportProps) {
  const { metrics } = session;

  return (
    <article className="rounded-lg border bg-card p-4 text-card-foreground">
      <header>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Rehearsal report</p>
        <h2 className="mt-1 text-base font-semibold">{session.scriptTitle}</h2>
      </header>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-muted-foreground">Duration</dt>
          <dd className="font-medium">{metrics.durationSeconds}s</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Pace</dt>
          <dd className="font-medium">{metrics.wordsPerMinute === null ? 'Unavailable' : `${metrics.wordsPerMinute} WPM`}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Script completion</dt>
          <dd className="font-medium">{metrics.completionPercent}%</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Transcript words</dt>
          <dd className="font-medium">{metrics.transcriptWordCount}</dd>
        </div>
      </dl>

      {metrics.unavailableMetrics.length > 0 && (
        <p className="mt-4 rounded-md bg-muted p-3 text-sm text-muted-foreground">
          Unavailable: {metrics.unavailableMetrics.join(', ')}
        </p>
      )}

      <div className="mt-4">
        <h3 className="text-sm font-semibold">Suggestions</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          {metrics.suggestions.map((suggestion) => (
            <li key={suggestion}>{suggestion}</li>
          ))}
        </ul>
      </div>
    </article>
  );
}
