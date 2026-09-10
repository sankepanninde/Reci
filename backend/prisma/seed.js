const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const adminPassword  = await bcrypt.hash('admin123', 10);
  const tenantPassword = await bcrypt.hash('Temp123!', 10);

  // 1. Usuarios
  const admin = await prisma.user.upsert({
    where: { email: 'admin@bap.com' },
    update: {},
    create: {
      email: 'admin@bap.com',
      password: adminPassword,
      name: 'Administrador',
      role: 'admin',
    },
  });

  const tenant = await prisma.user.upsert({
    where: { email: 'local1@mail.com' },
    update: {},
    create: {
      email: 'local1@mail.com',
      password: tenantPassword,
      name: 'Comercio Alpha',
      role: 'tenant',
      document: '101010',
      phone: '+57 300 123 4567',
    },
  });

  // 2. Propiedades del tenant
  const p1 = await prisma.property.create({
    data: {
      name: 'Local Comercial 1',
      type: 'comercial',
      tenantName: tenant.name,
      document: tenant.document,
      email: tenant.email,
      phone: tenant.phone,
      meters: '1 Normal',
      status: 'Pendiente',
      baseAmount: 15000,
      ownerId: tenant.id,
    },
  });

  const p2 = await prisma.property.create({
    data: {
      name: 'Local Comercial 2',
      type: 'comercial',
      tenantName: tenant.name,
      document: tenant.document,
      email: tenant.email,
      phone: tenant.phone,
      meters: '1 Normal',
      status: 'Pendiente',
      baseAmount: 18000,
      ownerId: tenant.id,
    },
  });

  // 3. Recibos de luz de prueba
  await prisma.bill.createMany({
    data: [
      {
        propertyId: p1.id,
        periodStart: new Date('2026-06-01'),
        periodEnd:   new Date('2026-06-30'),
        dueDate:     new Date('2026-07-15'),
        consumption: 180.5,
        kwhRate:     250,
        energyTotal: 45125,
        trashCost:   3000,
        total:       48125,
        status:      'Pendiente',
      },
      {
        propertyId: p1.id,
        periodStart: new Date('2026-07-01'),
        periodEnd:   new Date('2026-07-31'),
        dueDate:     new Date('2026-08-15'),
        consumption: 210.75,
        kwhRate:     250,
        energyTotal: 52687.5,
        trashCost:   3000,
        total:       55687.5,
        status:      'Pagado',
        paidDate:    new Date('2026-08-10'),
      },
      {
        propertyId: p2.id,
        periodStart: new Date('2026-08-01'),
        periodEnd:   new Date('2026-08-31'),
        dueDate:     new Date('2026-09-15'),
        consumption: 195.2,
        kwhRate:     250,
        energyTotal: 48800,
        trashCost:   3000,
        total:       51800,
        status:      'Pendiente',
      },
    ],
  });

  console.log('✅ Seed completado');
  console.log('   Admin : admin@bap.com / admin123');
  console.log('   Tenant: local1@mail.com / Temp123!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());