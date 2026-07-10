import { AccessibilityProfile } from '@/types/script';

export interface AccessibilityProfileConfig {
  id: AccessibilityProfile;
  label: string;
  description: string;
  minFontSize: number;
  lineSpacingMultiplier: number;
  highContrast: boolean;
  reducedMotion: boolean;
  captionsPreferred: boolean;
  simplifiedControls: boolean;
  className: string;
}

export const ACCESSIBILITY_PROFILES: Record<AccessibilityProfile, AccessibilityProfileConfig> = {
  default: {
    id: 'default',
    label: 'Default',
    description: 'Use your normal prompting settings.',
    minFontSize: 16,
    lineSpacingMultiplier: 1,
    highContrast: false,
    reducedMotion: false,
    captionsPreferred: false,
    simplifiedControls: false,
    className: '',
  },
  dyslexia: {
    id: 'dyslexia',
    label: 'Dyslexia-friendly',
    description: 'Adds more spacing and steadier line rhythm.',
    minFontSize: 30,
    lineSpacingMultiplier: 1.2,
    highContrast: false,
    reducedMotion: false,
    captionsPreferred: false,
    simplifiedControls: false,
    className: 'tracking-wide',
  },
  'low-vision': {
    id: 'low-vision',
    label: 'Low vision',
    description: 'Prioritises larger text and controls.',
    minFontSize: 44,
    lineSpacingMultiplier: 1.25,
    highContrast: true,
    reducedMotion: false,
    captionsPreferred: false,
    simplifiedControls: true,
    className: 'font-semibold',
  },
  'high-contrast': {
    id: 'high-contrast',
    label: 'High contrast',
    description: 'Uses stronger contrast for text and controls.',
    minFontSize: 32,
    lineSpacingMultiplier: 1.1,
    highContrast: true,
    reducedMotion: false,
    captionsPreferred: false,
    simplifiedControls: false,
    className: 'font-medium',
  },
  'calm-focus': {
    id: 'calm-focus',
    label: 'Calm focus',
    description: 'Reduces motion and keeps the interface quieter.',
    minFontSize: 30,
    lineSpacingMultiplier: 1.15,
    highContrast: false,
    reducedMotion: true,
    captionsPreferred: false,
    simplifiedControls: true,
    className: '',
  },
  'caption-first': {
    id: 'caption-first',
    label: 'Caption-first',
    description: 'Keeps captions and transcript state prominent.',
    minFontSize: 30,
    lineSpacingMultiplier: 1.1,
    highContrast: false,
    reducedMotion: false,
    captionsPreferred: true,
    simplifiedControls: false,
    className: '',
  },
  'simple-controls': {
    id: 'simple-controls',
    label: 'Simple controls',
    description: 'Favours fewer visible controls while prompting.',
    minFontSize: 32,
    lineSpacingMultiplier: 1.1,
    highContrast: false,
    reducedMotion: true,
    captionsPreferred: false,
    simplifiedControls: true,
    className: '',
  },
};

export function getAccessibilityProfile(profile: AccessibilityProfile): AccessibilityProfileConfig {
  return ACCESSIBILITY_PROFILES[profile] || ACCESSIBILITY_PROFILES.default;
}

export function applyProfileFontSize(fontSize: number, profile: AccessibilityProfileConfig): number {
  return Math.max(fontSize, profile.minFontSize);
}

export function applyProfileLineSpacing(lineSpacing: number, profile: AccessibilityProfileConfig): number {
  return Number(Math.max(lineSpacing, lineSpacing * profile.lineSpacingMultiplier).toFixed(2));
}
