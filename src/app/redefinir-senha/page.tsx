import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/password-forms";
import { Suspense } from "react";

export const metadata = { title: "Redefinir senha" };

export default function Page() {
  return (
    <AuthShell title="Redefinir senha" subtitle="Escolha uma nova senha para sua conta.">
      <Suspense><ResetPasswordForm /></Suspense>
    </AuthShell>
  );
}
