import {
  ProfileSection,
  PasswordSection,
  InfoSection,
} from "@settings/infrastructure/ui/components";

export const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-sm text-text-secondary mt-0.5">
          Manage your account and application settings
        </p>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 max-w-6xl">
        <ProfileSection />
        <PasswordSection />
        <div className="col-span-1 md:col-span-2">
          <InfoSection />
        </div>
      </div>
    </div>
  );
};
