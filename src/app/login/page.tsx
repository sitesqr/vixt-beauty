import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { getSession } from "@/lib/auth";

export const metadata = { title: "Entrar" };

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    redirect(session.role === "SUPER_ADMIN" ? "/admin" : session.role === "CLIENT" ? "/cliente" : "/dashboard");
  }
  return (
    <AuthShell title="Bem-vindo de volta" subtitle="Entre com sua conta para continuar.">
      <LoginForm />
    </AuthShell>
  );
}
