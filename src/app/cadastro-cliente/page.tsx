import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterClientForm } from "@/components/auth/register-client-form";
import { getSession } from "@/lib/auth";

export const metadata = { title: "Cadastrar-se como cliente" };

export default async function Page() {
  const session = await getSession();
  if (session) redirect(session.role === "CLIENT" ? "/cliente" : "/dashboard");
  return (
    <AuthShell title="Crie sua conta grátis" subtitle="Agende em qualquer salão parceira com uma única conta.">
      <RegisterClientForm />
    </AuthShell>
  );
}
