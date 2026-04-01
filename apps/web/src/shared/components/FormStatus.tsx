import { memo } from "react";
import { CheckCircle, AlertTriangle } from "lucide-react";

interface FormStatusPropsI {
  success?: boolean;
  successMessage?: string;
  error?: string | null;
}

export const FormStatus: React.FC<FormStatusPropsI> = memo(function FormStatus({
  success,
  successMessage = "Saved",
  error,
}) {
  if (success) {
    return (
      <span className="flex items-center gap-1 text-xs text-success">
        <CheckCircle className="w-3.5 h-3.5" />
        {successMessage}
      </span>
    );
  }

  if (error) {
    return (
      <span className="flex items-center gap-1 text-xs text-danger">
        <AlertTriangle className="w-3.5 h-3.5" />
        {error}
      </span>
    );
  }

  return null;
});
