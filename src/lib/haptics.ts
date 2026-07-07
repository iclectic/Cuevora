import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import { getSettings } from '@/lib/storage';

type HapticKind = 'light' | 'medium' | 'selection' | 'warning';

export async function haptic(kind: HapticKind = 'light'): Promise<void> {
  if (!Capacitor.isNativePlatform() || !getSettings().hapticsEnabled) return;

  try {
    if (kind === 'selection') {
      await Haptics.selectionChanged();
      return;
    }

    if (kind === 'warning') {
      await Haptics.notification({ type: 'WARNING' });
      return;
    }

    await Haptics.impact({ style: kind === 'medium' ? ImpactStyle.Medium : ImpactStyle.Light });
  } catch {
    // Haptics are optional; web, simulators, and some devices can no-op safely.
  }
}
