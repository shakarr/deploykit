import { memo, useEffect, useRef } from "react";

interface LogViewerPropsI {
  lines: string[];
}

export const LogViewer: React.FC<LogViewerPropsI> = memo(function LogViewer({
  lines,
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [lines]);

  return (
    <div
      ref={containerRef}
      className="bg-surface-0 border border-border rounded-lg p-3 sm:p-4 max-h-64 sm:max-h-96 overflow-y-auto font-mono text-xs leading-5"
    >
      {lines.map((line, i) => (
        <div
          key={i}
          className="text-text-secondary hover:text-text-primary whitespace-pre-wrap break-all"
        >
          {line}
        </div>
      ))}
    </div>
  );
});
