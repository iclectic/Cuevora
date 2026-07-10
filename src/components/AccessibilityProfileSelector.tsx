import { AccessibilityProfile } from '@/types/script';
import { ACCESSIBILITY_PROFILES } from '@/lib/accessibility-profiles';

interface AccessibilityProfileSelectorProps {
  value: AccessibilityProfile;
  onChange: (profile: AccessibilityProfile) => void;
}

export function AccessibilityProfileSelector({ value, onChange }: AccessibilityProfileSelectorProps) {
  return (
    <div className="grid gap-2" role="radiogroup" aria-label="Accessibility profile">
      {(Object.keys(ACCESSIBILITY_PROFILES) as AccessibilityProfile[]).map((key) => {
        const profile = ACCESSIBILITY_PROFILES[key];
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={value === key}
            className={`rounded-lg border p-3 text-left transition-colors ${
              value === key ? 'border-primary bg-primary/10' : 'border-border bg-card'
            }`}
            onClick={() => onChange(key)}
          >
            <span className="block text-sm font-medium text-foreground">{profile.label}</span>
            <span className="mt-1 block text-xs text-muted-foreground">{profile.description}</span>
          </button>
        );
      })}
    </div>
  );
}
