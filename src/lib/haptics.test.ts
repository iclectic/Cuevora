import { describe, expect, it } from 'vitest';
import { haptic } from '@/lib/haptics';

describe('haptic', () => {
  it('is a safe no-op on web', async () => {
    await expect(haptic('medium')).resolves.toBeUndefined();
  });
});
