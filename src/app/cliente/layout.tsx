import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "CLIENT") redirect(session.role === "SUPER_ADMIN" ? "/admin" : "/dashboard");

  const unread = await prisma.notification.count({ where: { userId: session.userId, read: false } });
  return (
    <AppShell variant="client" userName={session.name} userEmail={session.email} unreadCount={unread}>
      {children}
    </AppShell>
  );
}
