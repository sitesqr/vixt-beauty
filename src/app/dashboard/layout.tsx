import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "CLIENT") redirect("/cliente");
  if (session.role === "SUPER_ADMIN") redirect("/admin");

  const [company, unread] = await Promise.all([
    session.companyId
      ? prisma.company.findUnique({ where: { id: session.companyId }, select: { name: true } })
      : null,
    prisma.notification.count({ where: { userId: session.userId, read: false } }),
  ]);

  return (
    <AppShell
      variant="owner"
      userName={session.name}
      userEmail={session.email}
      companyName={company?.name}
      unreadCount={unread}
    >
      {children}
    </AppShell>
  );
}
