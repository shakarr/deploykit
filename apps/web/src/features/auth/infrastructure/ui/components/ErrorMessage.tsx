import { memo } from "react";

interface ErrorMessagePropsI {
  message: string;
}

export const ErrorMessage: React.FC<ErrorMessagePropsI> = memo(
  function ErrorMessage({ message }) {
    if (!message) return null;

    return (
      <p
        role="alert"
        className="text-xs text-danger bg-danger/10 rounded-lg px-3 py-2"
      >
        {message}
      </p>
    );
  },
);
