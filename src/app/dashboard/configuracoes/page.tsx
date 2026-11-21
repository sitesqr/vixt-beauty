import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/ui";
import { SettingsForm } from "@/components/dashboard/settings-form";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await getSession();
  if (!session?.companyId) redirect("/login");
  const [company, subscription] = await Promise.all([
    prisma.company.findUnique({ where: { id: session.companyId }, include: { workingHours: true, cancellationPolicy: true } }),
    prisma.subscription.findFirst({ where: { companyId: session.companyId }, include: { plan: true }, orderBy: { createdAt: "desc" } }),
  ]);
  if (!company) redirect("/login");

  return (
    <>
      <PageHeader title="Configurações" description="Personalize sua salão, horários e políticas." />
      <div className="mb-6 rounded-2xl border border-rose-500/20 bg-rose-500/[0.06] p-5">
        <p className="text-xs text-rose-100/45">Sua página pública</p>
        <a href={`/b/${company.slug}`} target="_blank" className="mt-1 inline-block text-lg font-semibold text-rose-300 hover:underline">
          /b/{company.slug} ↗
        </a>
        <p className="mt-1 text-xs text-rose-100/45">Compartilhe este link no Instagram e WhatsApp para receber agendamentos.</p>
      </div>
      <SettingsForm
        initial={{
          name: company.name, description: company.description || "", logoUrl: company.logoUrl || "", phone: company.phone || "",
          whatsapp: company.whatsapp || "", cpfCnpj: company.cpfCnpj || "", address: company.address || "", city: company.city || "",
          state: company.state || "",
          workingHours: [0,1,2,3,4,5,6].map((d) => {
            const wh = company.workingHours.find((w) => w.dayOfWeek === d);
            return { dayOfWeek: d, openTime: wh?.openTime || "09:00", closeTime: wh?.closeTime || "20:00", enabled: wh?.enabled ?? (d >= 1 && d <= 6) };
          }),
          minAdvanceHours: company.cancellationPolicy?.minAdvanceHours ?? 4,
          minRescheduleHours: company.cancellationPolicy?.minRescheduleHours ?? 2,
        }}
        planName={subscription?.plan.name || "—"}
      />
    </>
  );
}
