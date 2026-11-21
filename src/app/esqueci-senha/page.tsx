import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/password-forms";
import { Suspense } from "react";

export const metadata = { title: "Recuperar senha" };

export default function Page() {
  return (
    <AuthShell title="Recuperar senha" subtitle="Enviaremos as instruções para o seu e-mail.">
      <Suspense><ForgotPasswordForm /></Suspense>
    </AuthShell>
  );
}
