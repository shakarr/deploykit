import { memo } from "react";
import { Shield } from "lucide-react";

interface RoleBadgePropsI {
  role: string;
}

export const RoleBadge: React.FC<RoleBadgePropsI> = memo(function RoleBadge({
  role,
}) {
  const label = role.charAt(0).toUpperCase() + role.slice(1);

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-accent bg-accent-muted px-2 py-1 rounded">
      <Shield className="w-3 h-3" />
      {label}
    </span>
  );
});
