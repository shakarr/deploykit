import { memo, useState } from "react";
import { Lock, HardDrive, GitBranch } from "lucide-react";

import { Card, Button, Input, Select } from "@shared/components";
import { CopyableField } from "@application/infrastructure/ui/components/CopyableField";

import { trpc } from "@lib/trpc";

interface GeneralTabPropsI {
  app: any;
  applicationId: string;
}

export const GeneralTab: React.FC<GeneralTabPropsI> = memo(function GeneralTab({
  app,
  applicationId,
}) {
  const utils = trpc.useUtils();
  const updateMutation = trpc.application.update.useMutation({
    onSuccess: () => utils.application.byId.invalidate({ id: applicationId }),
  });

  const [repoUrl, setRepoUrl] = useState(app.repositoryUrl || "");
  const [branch, setBranch] = useState(app.branch || "main");
  const [sourceToken, setSourceToken] = useState("");
  const [tokenDirty, setTokenDirty] = useState(false);
  const [rootDirectory, setRootDirectory] = useState(app.rootDirectory || "");
  const [volumes, setVolumes] = useState<string[]>(
    (app.volumes as string[]) || [],
  );
  const [newVolume, setNewVolume] = useState("");
  const [buildType, setBuildType] = useState(app.buildType || "nixpacks");
  const [port, setPort] = useState(String(app.port || ""));

  // Health check
  const [hcType, setHcType] = useState(app.healthCheckType ?? "http");
  const [hcPath, setHcPath] = useState(app.healthCheckPath ?? "/");
  const [hcTimeout, setHcTimeout] = useState(
    String(app.healthCheckTimeout ?? 5),
  );
  const [hcInterval, setHcInterval] = useState(
    String(app.healthCheckInterval ?? 10),
  );
  const [hcRetries, setHcRetries] = useState(
    String(app.healthCheckRetries ?? 6),
  );
  const [hcRequired, setHcRequired] = useState(
    app.healthCheckRequired ?? false,
  );

  // Preview deployments
  const [previewEnabled, setPreviewEnabled] = useState(
    app.previewEnabled ?? false,
  );
  const [previewDomain, setPreviewDomain] = useState(app.previewDomain ?? "");

  const handleSave = () =>
    updateMutation.mutate({
      id: applicationId,
      repositoryUrl: repoUrl || undefined,
      branch,
      buildType,
      port: parseInt(port) || undefined,
      ...(tokenDirty && { sourceToken: sourceToken || null }),
      rootDirectory: rootDirectory || null,
      volumes: volumes.length > 0 ? volumes : null,
      healthCheckType: hcType as any,
      healthCheckPath: hcPath || "/",
      healthCheckTimeout: parseInt(hcTimeout) || 5,
      healthCheckInterval: parseInt(hcInterval) || 10,
      healthCheckRetries: parseInt(hcRetries) || 6,
      healthCheckRequired: hcRequired,
      previewEnabled,
      previewDomain: previewDomain || null,
    });

  return (
    <Card>
      <div className="space-y-6 max-w-2xl">
        {/* Source */}
        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            Source
          </h3>

          {/* Repo URL spans full width — it's long */}
          <Input
            label="Repository URL"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/user/repo"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Branch"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="main"
              autoComplete="off"
            />
            <Input
              label="Root Directory"
              value={rootDirectory}
              onChange={(e) => setRootDirectory(e.target.value)}
              placeholder="apps/web"
              autoComplete="off"
            />
          </div>

          {/* Access Token */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary flex items-center gap-1.5">
              <Lock className="w-3 h-3" />
              Access Token
              {app.hasSourceToken && !tokenDirty && (
                <span className="text-[10px] text-success bg-success/10 px-1.5 py-0.5 rounded">
                  configured
                </span>
              )}
            </label>
            <input
              type="password"
              value={sourceToken}
              onChange={(e) => {
                setSourceToken(e.target.value);
                setTokenDirty(true);
              }}
              autoComplete="new-password"
              placeholder={
                app.hasSourceToken
                  ? "•••••••• (leave empty to keep current)"
                  : "ghp_xxxxxxxxxxxx"
              }
              className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
            />
            <p className="text-[11px] text-text-muted">
              GitHub PAT, GitLab token, or any HTTPS git token. Leave empty for
              public repos.
            </p>
          </div>
        </section>

        {/* Build */}
        <section className="space-y-3 pt-4 border-t border-border">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            Build
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Build Type"
              value={buildType}
              onChange={(e) => setBuildType(e.target.value)}
              options={[
                { value: "nixpacks", label: "Nixpacks (auto-detect)" },
                { value: "dockerfile", label: "Dockerfile" },
                { value: "buildpacks", label: "Buildpacks" },
              ]}
            />
            <Input
              label="Port"
              type="number"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              placeholder="3000"
            />
          </div>
        </section>

        {/* Webhook */}
        <section className="space-y-2 pt-4 border-t border-border">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            Webhook
          </h3>
          <CopyableField
            value={`${window.location.origin}/api/webhooks/github`}
          />
          <p className="text-[11px] text-text-muted">
            Add this to your GitHub repo → Settings → Webhooks to auto-deploy on
            push.
          </p>
        </section>

        {/* Persistent Volumes */}
        <section className="space-y-3 pt-4 border-t border-border">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
            <HardDrive className="w-3 h-3" />
            Persistent Volumes
          </h3>

          {volumes.map((vol, idx) => (
            <div key={idx} className="flex gap-2">
              <code className="flex-1 px-3 py-1.5 rounded-lg bg-surface-2 border border-border text-xs font-mono text-text-primary truncate">
                {vol}
              </code>
              <button
                type="button"
                onClick={() => setVolumes(volumes.filter((_, i) => i !== idx))}
                className="px-2 py-1.5 rounded-lg text-xs text-danger hover:bg-danger/10 transition-colors"
              >
                Remove
              </button>
            </div>
          ))}

          <div className="flex gap-2">
            <input
              type="text"
              value={newVolume}
              onChange={(e) => setNewVolume(e.target.value)}
              placeholder="/host/path:/container/path"
              className="flex-1 px-3 py-1.5 rounded-lg bg-surface-2 border border-border text-xs font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
              onKeyDown={(e) => {
                if (e.key === "Enter" && newVolume.includes(":")) {
                  e.preventDefault();
                  setVolumes([...volumes, newVolume.trim()]);
                  setNewVolume("");
                }
              }}
            />
            <button
              type="button"
              onClick={() => {
                if (newVolume.includes(":")) {
                  setVolumes([...volumes, newVolume.trim()]);
                  setNewVolume("");
                }
              }}
              disabled={!newVolume.includes(":")}
              className="px-3 py-1.5 rounded-lg bg-surface-2 border border-border text-xs font-medium text-text-primary hover:bg-surface-3 disabled:opacity-40 transition-colors"
            >
              Add
            </button>
          </div>
          <p className="text-[11px] text-text-muted">
            Format: /host/path:/container/path — data persists between deploys.
          </p>
        </section>

        {/* Health Check */}
        <section className="space-y-3 pt-4 border-t border-border">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            Health Check
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Type"
              value={hcType}
              onChange={(e) => setHcType(e.target.value)}
              options={[
                { value: "http", label: "HTTP — GET request" },
                { value: "tcp", label: "TCP — port check" },
                { value: "none", label: "None — skip" },
              ]}
            />
            {hcType === "http" && (
              <Input
                label="Path"
                value={hcPath}
                onChange={(e) => setHcPath(e.target.value)}
                placeholder="/health"
              />
            )}
          </div>

          {hcType !== "none" && (
            <div className="grid grid-cols-3 gap-3">
              <Input
                label="Timeout (s)"
                type="number"
                min={1}
                max={60}
                value={hcTimeout}
                onChange={(e) => setHcTimeout(e.target.value)}
              />
              <Input
                label="Interval (s)"
                type="number"
                min={1}
                max={60}
                value={hcInterval}
                onChange={(e) => setHcInterval(e.target.value)}
              />
              <Input
                label="Retries"
                type="number"
                min={1}
                max={20}
                value={hcRetries}
                onChange={(e) => setHcRetries(e.target.value)}
              />
            </div>
          )}

          {hcType !== "none" && (
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hcRequired}
                onChange={(e) => setHcRequired(e.target.checked)}
                className="rounded"
              />
              <span className="text-xs text-text-secondary">
                Fail deploy if health check does not pass
              </span>
            </label>
          )}

          <p className="text-[11px] text-text-muted">
            {hcType === "http" &&
              "Sends a GET request after deploy. Any response below 500 is considered healthy."}
            {hcType === "tcp" &&
              "Opens a TCP connection to the configured port. Useful for databases or non-HTTP services."}
            {hcType === "none" &&
              "The container will be marked running immediately after starting."}
          </p>
        </section>

        {/* Preview Deployments */}
        <section className="space-y-3 pt-4 border-t border-border">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
            <GitBranch className="w-3 h-3" />
            Preview Deployments
          </h3>

          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={previewEnabled}
              onChange={(e) => setPreviewEnabled(e.target.checked)}
              className="rounded"
            />
            <span className="text-xs text-text-secondary">
              Auto-deploy pull requests as preview environments
            </span>
          </label>

          {previewEnabled && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Input
                  label="Base domain (optional)"
                  value={previewDomain}
                  onChange={(e) => setPreviewDomain(e.target.value)}
                  placeholder="example.com"
                />
                <p className="text-[11px] text-text-muted">
                  PRs will get{" "}
                  <code className="font-mono">pr-42.example.com</code>. Requires
                  a <code className="font-mono">*.example.com</code> DNS record.
                </p>
              </div>
            </div>
          )}
        </section>

        <Button onClick={handleSave} disabled={updateMutation.isPending}>
          {updateMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </Card>
  );
});
