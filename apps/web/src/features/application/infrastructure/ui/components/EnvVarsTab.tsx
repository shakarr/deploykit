import { useState, useEffect, memo } from "react";
import { Eye, EyeOff, Check } from "lucide-react";

import { Card, Button } from "@shared/components";

import { trpc } from "@lib/trpc";

interface EnvVarsTabPropsI {
  app: any;
  applicationId: string;
}

export const EnvVarsTab: React.FC<EnvVarsTabPropsI> = memo(function EnvVarsTab({
  app,
  applicationId,
}) {
  const utils = trpc.useUtils();

  const [envText, setEnvText] = useState<string>("");
  const [saved, setSaved] = useState<boolean>(false);
  const [showValues, setShowValues] = useState<boolean>(false);

  useEffect(() => {
    if (app.envVars && typeof app.envVars === "object") {
      const text = Object.entries(app.envVars as Record<string, string>)
        .map(([k, v]) => `${k}=${v}`)
        .join("\n");
      setEnvText(text);
    }
  }, [app.envVars]);

  const updateMutation = trpc.application.updateEnvVars.useMutation({
    onSuccess: () => {
      utils.application.byId.invalidate({ id: applicationId });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const handleSave = () => {
    const vars: Record<string, string> = {};
    for (const line of envText.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim();
      if (key) vars[key] = value;
    }
    updateMutation.mutate({ id: applicationId, envVars: vars });
  };

  const maskEnvValues = (text: string): string =>
    text
      .split("\n")
      .map((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) return line;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx === -1) return line;
        return trimmed.slice(0, eqIdx) + "=" + "•".repeat(8);
      })
      .join("\n");

  return (
    <Card>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Environment Variables</h3>
          <div className="flex items-center gap-3">
            <p className="text-xs text-text-muted">
              KEY=VALUE format, one per line
            </p>
            <button
              type="button"
              onClick={() => setShowValues(!showValues)}
              className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors px-2 py-1 rounded-md hover:bg-surface-2"
            >
              {showValues ? (
                <EyeOff className="w-3.5 h-3.5" />
              ) : (
                <Eye className="w-3.5 h-3.5" />
              )}
              {showValues ? "Hide" : "Reveal"}
            </button>
          </div>
        </div>

        <textarea
          value={showValues ? envText : maskEnvValues(envText)}
          onChange={(e) => setEnvText(e.target.value)}
          onFocus={() => setShowValues(true)}
          rows={12}
          className="w-full px-4 py-3 rounded-lg bg-surface-2 border border-border text-sm font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent resize-y"
          placeholder={`NODE_ENV=production\nDATABASE_URL=postgresql://...\nJWT_SECRET=my-secret`}
          spellCheck={false}
        />

        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Saving..." : "Save Environment"}
          </Button>
          {saved && (
            <span className="text-xs text-success flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Saved
            </span>
          )}
        </div>

        <p className="text-xs text-text-muted">
          Variables are encrypted at rest. Changes require a redeploy to take
          effect.
        </p>
      </div>
    </Card>
  );
});
