import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  console.log("🌱 Seedando VIXT Beauty — Gestão Inteligente para Salões de Beleza...");

  // Planos (SaaS para salões femininos)
  const plans = [
    {
      name: "Starter",
      slug: "starter",
      description: "Para salões em início de atividade",
      priceCents: 4900,
      maxProfessionals: 3,
      maxServices: 20,
      features: JSON.stringify(["Até 3 profissionais", "Até 20 serviços", "Agenda online", "Página pública", "Relatórios básicos"]),
      sortOrder: 1,
    },
    {
      name: "Profissional",
      slug: "profissional",
      description: "Para salões em crescimento",
      priceCents: 8900,
      maxProfessionals: 10,
      maxServices: 60,
      features: JSON.stringify(["Até 10 profissionais", "Serviços ilimitados", "Agenda inteligente", "Comissões", "Notificações", "Relatórios completos"]),
      sortOrder: 2,
    },
    {
      name: "Empresarial",
      slug: "empresarial",
      description: "Para redes e múltiplas unidades",
      priceCents: 17900,
      maxProfessionals: 100,
      maxServices: 500,
      features: JSON.stringify(["Profissionais ilimitados", "Serviços ilimitados", "Múltiplas unidades", "API", "Suporte prioritário", "Relatórios avançados"]),
      sortOrder: 3,
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { slug: plan.slug },
      update: plan,
      create: plan,
    });
  }

  // Super admin
  const adminHash = await bcrypt.hash("Admin@123", 12);
  await prisma.user.upsert({
    where: { email: "admin@vixtbeauty.com" },
    update: {},
    create: {
      name: "Admin VIXT",
      email: "admin@vixtbeauty.com",
      phone: "(11) 99999-9999",
      passwordHash: adminHash,
      role: "SUPER_ADMIN",
      emailVerified: true,
    },
  });

  // Proprietária demo + salão
  const ownerHash = await bcrypt.hash("Demo@123", 12);
  const owner = await prisma.user.upsert({
    where: { email: "demo@vixtbeauty.com" },
    update: {},
    create: {
      name: "Camila Ferreira",
      email: "demo@vixtbeauty.com",
      phone: "(11) 98888-7777",
      passwordHash: ownerHash,
      role: "OWNER",
      emailVerified: true,
    },
  });

  let company = await prisma.company.findUnique({ where: { slug: "belle-essence" } });
  if (!company) {
    company = await prisma.company.create({
      data: {
        ownerId: owner.id,
        name: "Belle Essence Salão de Beleza",
        slug: "belle-essence",
        description: "Salão de beleza feminino premium. Cabelos, unhas, sobrancelhas, maquiagem e estética com atendimento de excelência.",
        phone: "(11) 3333-4444",
        whatsapp: "(11) 98888-7777",
        address: "Rua Augusta, 1200",
        neighborhood: "Consolação",
        city: "São Paulo",
        state: "SP",
        status: "ACTIVE",
        trialEndsAt: new Date(Date.now() + 14 * 86400000),
        settings: JSON.stringify({ theme: "beauty" }),
      },
    });

    await prisma.membership.create({
      data: { userId: owner.id, companyId: company.id, role: "ADMIN" },
    });

    const plan = await prisma.plan.findUnique({ where: { slug: "profissional" } });
    await prisma.subscription.create({
      data: {
        companyId: company.id,
        planId: plan!.id,
        status: "ACTIVE",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 86400000),
        provider: "SIMULATED",
      },
    });

    // Horários de funcionamento (seg–sáb, 09:00–20:00)
    for (let d = 1; d <= 6; d++) {
      await prisma.workingHour.create({
        data: { companyId: company.id, dayOfWeek: d, openTime: "09:00", closeTime: "20:00" },
      });
    }

    // Serviços típicos de um salão de beleza feminino
    const servicesData = [
      { name: "Corte Feminino", description: "Corte feminino personalizado com consultoria de penteado", category: "Cabelo", priceCents: 6500, durationMin: 60 },
      { name: "Escova e Penteado", description: "Escova modeladora com finalização profissional", category: "Cabelo", priceCents: 4500, durationMin: 45 },
      { name: "Coloração", description: "Coloração com tinta profissional e tratamento pós-cor", category: "Coloração", priceCents: 12000, durationMin: 120 },
      { name: "Luzes / Mechas", description: "Mechas e luzes com técnica personalizada", category: "Coloração", priceCents: 18000, durationMin: 180 },
      { name: "Hidratação Capilar", description: "Tratamento hidratante profundo para cabelos", category: "Tratamento", priceCents: 6000, durationMin: 50 },
      { name: "Reconstrução Capilar", description: "Reconstrução da fibra capilar com queratina", category: "Tratamento", priceCents: 7000, durationMin: 60 },
      { name: "Manicure", description: "Manicure completa com esmaltação", category: "Unhas", priceCents: 3500, durationMin: 45 },
      { name: "Pedicure", description: "Pedicure com hidratação e esmaltação", category: "Unhas", priceCents: 4000, durationMin: 50 },
      { name: "Alongamento de Unhas", description: "Alongamento e manutenção de unhas em gel", category: "Unhas", priceCents: 9000, durationMin: 90 },
      { name: "Design de Sobrancelhas", description: "Design e modelagem de sobrancelhas", category: "Sobrancelhas", priceCents: 4000, durationMin: 30 },
      { name: "Micropigmentação", description: "Micropigmentação de sobrancelhas (design fio a fio)", category: "Sobrancelhas", priceCents: 15000, durationMin: 120 },
      { name: "Maquiagem", description: "Maquiagem profissional para eventos e ensaios", category: "Maquiagem", priceCents: 9000, durationMin: 75 },
      { name: "Limpeza de Pele", description: "Limpeza de pele profissional com hidratação", category: "Estética", priceCents: 8000, durationMin: 75 },
      { name: "Depilação", description: "Depilação com cera em área selecionada", category: "Estética", priceCents: 5000, durationMin: 45 },
      { name: "Procedimento Estético", description: "Tratamento estético facial personalizado", category: "Estética", priceCents: 11000, durationMin: 60 },
    ];
    const services = [];
    for (const s of servicesData) {
      services.push(await prisma.service.create({ data: { companyId: company.id, ...s } }));
    }

    // Profissionais
    const pro1 = await prisma.professional.create({
      data: {
        companyId: company.id,
        name: "Ana Paula Ribeiro",
        phone: "(11) 97777-6666",
        email: "ana@belleessence.com.br",
        specialties: ["Cabelo", "Coloração", "Tratamento"],
        commissionRate: 40,
        bio: "Cabeleireira especialista em cortes femininos, coloração e tratamentos capilares há 9 anos.",
      },
    });
    const pro2 = await prisma.professional.create({
      data: {
        companyId: company.id,
        name: "Juliana Alves",
        phone: "(11) 96666-5555",
        specialties: ["Unhas", "Sobrancelhas", "Estética"],
        commissionRate: 35,
        bio: "Manicure, Designer de Sobrancelhas e esteticista com 6 anos de experiência.",
      },
    });

    for (const pro of [pro1, pro2]) {
      for (const s of services) {
        await prisma.professionalService.create({
          data: { professionalId: pro.id, serviceId: s.id },
        });
      }
      for (let d = 1; d <= 6; d++) {
        await prisma.professionalWorkingHour.create({
          data: { professionalId: pro.id, dayOfWeek: d, startTime: "09:00", endTime: "19:00" },
        });
      }
    }

    // Cliente demo
    await prisma.user.upsert({
      where: { email: "cliente@vixtbeauty.com" },
      update: {},
      create: {
        name: "Fernanda Oliveira",
        email: "cliente@vixtbeauty.com",
        phone: "(11) 99999-1234",
        passwordHash: await bcrypt.hash("Cliente@123", 12),
        role: "CLIENT",
        emailVerified: true,
      },
    });

    // Política de cancelamento
    await prisma.cancellationPolicy.create({
      data: { companyId: company.id, minAdvanceHours: 4, minRescheduleHours: 2 },
    });

    console.log("✅ Demo criado:", {
      admin: "admin@vixtbeauty.com / Admin@123",
      owner: "demo@vixtbeauty.com / Demo@123",
      client: "cliente@vixtbeauty.com / Cliente@123",
      slug: "belle-essence",
    });
  } else {
    console.log("ℹ️  Salão demo já existe, pulando...");
    console.log("   admin@vixtbeauty.com / Admin@123");
    console.log("   demo@vixtbeauty.com / Demo@123");
    console.log("   cliente@vixtbeauty.com / Cliente@123");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
