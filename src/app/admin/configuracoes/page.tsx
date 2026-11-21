import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/ui";
import { GlobalSettingsForm } from "@/components/admin/global-settings-form";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await getSession();
  if (!session) return null;
  const configs = await prisma.globalConfig.findMany();
  const values: Record<string, any> = {};
  for (const c of configs) values[c.key] = c.value;
  return (
    <>
      <PageHeader title="Configurações globais" description="Parâmetros que afetam toda a plataforma." />
      <GlobalSettingsForm initial={{
        platformName: values.platformName || "VIXT Beauty",
        supportEmail: values.supportEmail || "suporte@vixtbeauty.com",
        defaultTrialDays: values.defaultTrialDays || 14,
        allowSelfRegistration: values.allowSelfRegistration !== false,
        maintenanceMode: values.maintenanceMode === true,
      }} />
    </>
  );
}
