import { Rocket } from "lucide-react";

export const AppLogo: React.FC = () => {
  return (
    <div className="flex items-center justify-center gap-3 mb-8">
      <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
        <Rocket className="w-5 h-5 text-white" />
      </div>
      <span className="text-xl font-semibold tracking-wide">DeployKit</span>
    </div>
  );
};
