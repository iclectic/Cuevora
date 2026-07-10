import { describe, expect, it } from 'vitest';
import { applyProfileFontSize, applyProfileLineSpacing, getAccessibilityProfile } from './accessibility-profiles';

describe('accessibility profiles', () => {
  it('raises low-vision font size and contrast settings', () => {
    const profile = getAccessibilityProfile('low-vision');

    expect(applyProfileFontSize(28, profile)).toBe(44);
    expect(profile.highContrast).toBe(true);
    expect(profile.simplifiedControls).toBe(true);
  });

  it('adds spacing for dyslexia-friendly prompting without changing content', () => {
    const profile = getAccessibilityProfile('dyslexia');

    expect(applyProfileLineSpacing(1.5, profile)).toBe(1.8);
    expect(profile.className).toContain('tracking');
  });
});
