const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10);
  const tenantPassword = await bcrypt.hash('Temp123!', 10);

  await prisma.user.upsert({
    where: { email: 'admin@bap.com' },
    update: {},
    create: {
      email: 'admin@bap.com',
      password: adminPassword,
      name: 'Administrador',
      role: 'admin',
    },
  });

  await prisma.user.upsert({
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

  console.log('Seed completado');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());