import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RehearsalReport } from './RehearsalReport';
import { RehearsalSession } from '@/types/studio';

const session: RehearsalSession = {
  id: 'session-1',
  scriptId: 'script-1',
  scriptTitle: 'Launch story',
  startedAt: 1000,
  endedAt: 61_000,
  transcriptEvents: [],
  metrics: {
    durationSeconds: 60,
    transcriptWordCount: 120,
    scriptWordCount: 150,
    wordsPerMinute: 120,
    longPauseCount: 2,
    fillerWordCount: 3,
    scriptCoverage: 0.8,
    completionPercent: 80,
    unavailableMetrics: ['Eye contact'],
    suggestions: ['Break long sections into shorter phrases to reduce pauses.'],
  },
};

describe('RehearsalReport', () => {
  it('renders report metrics and suggestions', () => {
    render(<RehearsalReport session={session} />);

    expect(screen.getByText('Launch story')).toBeInTheDocument();
    expect(screen.getByText('120 WPM')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();
    expect(screen.getByText(/Break long sections/)).toBeInTheDocument();
  });

  it('shows unavailable metrics clearly', () => {
    render(<RehearsalReport session={session} />);

    expect(screen.getByText('Unavailable: Eye contact')).toBeInTheDocument();
  });
});
