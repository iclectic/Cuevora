interface AccessibleStatusProps {
  message: string;
  assertive?: boolean;
  className?: string;
}

export function AccessibleStatus({ message, assertive = false, className = 'sr-only' }: AccessibleStatusProps) {
  return (
    <div
      role={assertive ? 'alert' : 'status'}
      aria-live={assertive ? 'assertive' : 'polite'}
      aria-atomic="true"
      className={className}
    >
      {message}
    </div>
  );
}
