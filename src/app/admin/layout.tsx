import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "SUPER_ADMIN") redirect(session.role === "CLIENT" ? "/cliente" : "/dashboard");

  return (
    <AppShell variant="admin" userName={session.name} userEmail={session.email}>
      {children}
    </AppShell>
  );
}
