import { memo } from "react";

interface UserAvatarPropsI {
  email: string;
}

export const UserAvatar: React.FC<UserAvatarPropsI> = memo(function UserAvatar({
  email,
}) {
  return (
    <div className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center shrink-0">
      <span className="text-sm font-semibold text-text-secondary">
        {email.charAt(0).toUpperCase()}
      </span>
    </div>
  );
});
