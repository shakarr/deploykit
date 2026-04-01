import { useState } from "react";

import { trpc } from "@lib/trpc";

const MIN_PASSWORD_LENGTH = 8;

export const usePasswordForm = () => {
  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [success, setSuccess] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string>("");

  const changeMutation = trpc.auth.changePassword.useMutation({
    onSuccess: () => {
      resetForm();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    },
  });

  const resetForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setValidationError("");
  };

  const validate = (): boolean => {
    if (newPassword !== confirmPassword) {
      setValidationError("New passwords don't match");
      return false;
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setValidationError(
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      );
      return false;
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");

    if (!validate()) return;
    changeMutation.mutate({ currentPassword, newPassword });
  };

  const canSubmit =
    !changeMutation.isPending && !!currentPassword && !!newPassword;

  return {
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    success,
    isPending: changeMutation.isPending,
    error: validationError || changeMutation.error?.message || null,
    canSubmit,
    handleSubmit,
  };
};
