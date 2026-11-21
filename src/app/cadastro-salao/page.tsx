import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterShopForm } from "@/components/auth/register-shop-form";
import { getSession } from "@/lib/auth";

export const metadata = { title: "Cadastre sua salão" };

export default async function Page() {
  const session = await getSession();
  if (session) redirect(session.role === "CLIENT" ? "/cliente" : "/dashboard");
  return (
    <AuthShell title="Comece sua salão" subtitle="Cadastre-se em minutos e comece a testar gratuitamente.">
      <RegisterShopForm />
    </AuthShell>
  );
}
