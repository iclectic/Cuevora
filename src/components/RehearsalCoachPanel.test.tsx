import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RehearsalCoachPanel } from './RehearsalCoachPanel';
import { RehearsalMetrics } from '@/types/studio';

const metrics: RehearsalMetrics = {
  durationSeconds: 60,
  transcriptWordCount: 120,
  scriptWordCount: 150,
  wordsPerMinute: 120,
  longPauseCount: 2,
  fillerWordCount: 3,
  scriptCoverage: 0.8,
  completionPercent: 80,
  unavailableMetrics: [],
  suggestions: ['Slow down slightly.'],
};

describe('RehearsalCoachPanel', () => {
  it('renders live metric summary', () => {
    render(<RehearsalCoachPanel metrics={metrics} listening supported />);

    expect(screen.getByText('Listening')).toBeInTheDocument();
    expect(screen.getByText('120 WPM')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();
  });

  it('explains unsupported speech state', () => {
    render(<RehearsalCoachPanel metrics={null} listening={false} supported={false} />);

    expect(screen.getByText('Limited')).toBeInTheDocument();
    expect(screen.getByText(/Speech recognition is unavailable/)).toBeInTheDocument();
  });
});
