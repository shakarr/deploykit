import { Shield } from "lucide-react";

import { SectionCard } from "@settings/infrastructure/ui/components";

import { APP_INFO } from "@settings/infrastructure/ui/constants/settings.constants";

export const InfoSection: React.FC = () => {
  return (
    <SectionCard icon={Shield} title="About DeployKit">
      <div className="space-y-2 text-sm text-text-secondary">
        {APP_INFO.map(({ label, value }) => (
          <div key={label} className="flex justify-between">
            <span>{label}</span>
            <span className="font-mono text-text-primary">{value}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-xs text-text-muted">
          Self-hosted Platform as a Service. Open source alternative to Vercel,
          Heroku, and Dokploy.
        </p>
      </div>
    </SectionCard>
  );
};
