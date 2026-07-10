import { ReactNode, useEffect, useRef } from 'react';

interface PageShellProps {
  title: string;
  children: ReactNode;
  className?: string;
  focusOnMount?: boolean;
}

export function PageShell({ title, children, className, focusOnMount = true }: PageShellProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (focusOnMount) headingRef.current?.focus();
  }, [focusOnMount]);

  return (
    <main className={className} aria-labelledby="page-title">
      <h1 id="page-title" ref={headingRef} tabIndex={-1} className="sr-only">
        {title}
      </h1>
      {children}
    </main>
  );
}
