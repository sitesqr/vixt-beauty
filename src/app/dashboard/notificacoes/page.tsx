import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/ui";
import { NotificationsList } from "@/components/dashboard/notifications-list";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await getSession();
  if (!session) redirect("/login");
  const notifications = await prisma.notification.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return (
    <>
      <PageHeader title="Notificações" description="Fique por dentro de tudo que acontece na sua salão." />
      <NotificationsList initial={notifications.map((n) => ({ ...n, createdAt: n.createdAt.toISOString() }))} />
    </>
  );
}
