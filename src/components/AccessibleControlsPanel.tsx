import { Button } from '@/components/ui/button';

export interface AccessibleControlAction {
  id: string;
  label: string;
  description?: string;
  pressed?: boolean;
  disabled?: boolean;
  onAction: () => void;
}

interface AccessibleControlsPanelProps {
  title: string;
  actions: AccessibleControlAction[];
  className?: string;
}

export function AccessibleControlsPanel({ title, actions, className }: AccessibleControlsPanelProps) {
  return (
    <section aria-label={title} className={className}>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {actions.map(action => (
          <Button
            key={action.id}
            variant={action.pressed ? 'default' : 'outline'}
            className="min-h-12 justify-start whitespace-normal text-left"
            aria-pressed={typeof action.pressed === 'boolean' ? action.pressed : undefined}
            aria-describedby={action.description ? `${action.id}-description` : undefined}
            disabled={action.disabled}
            onClick={action.onAction}
          >
            <span>
              <span className="block text-sm font-medium">{action.label}</span>
              {action.description && (
                <span id={`${action.id}-description`} className="block text-xs opacity-75">
                  {action.description}
                </span>
              )}
            </span>
          </Button>
        ))}
      </div>
    </section>
  );
}
