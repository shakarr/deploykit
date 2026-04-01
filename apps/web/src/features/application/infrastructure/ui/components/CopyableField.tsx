import { memo, useState } from "react";
import { Copy, Check } from "lucide-react";

interface CopyableFieldPropsI {
  value: string;
}

export const CopyableField: React.FC<CopyableFieldPropsI> = memo(
  function CopyableField({ value }) {
    const [copied, setCopied] = useState<boolean>(false);

    const handleCopy = () => {
      navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <div className="flex items-center gap-2 mt-1">
        <code className="flex-1 px-3 py-1.5 rounded bg-surface-2 border border-border text-xs font-mono text-text-secondary truncate">
          {value}
        </code>
        <button
          onClick={handleCopy}
          className="p-1.5 rounded hover:bg-surface-2 text-text-muted hover:text-text-primary transition-colors"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-success" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    );
  },
);
