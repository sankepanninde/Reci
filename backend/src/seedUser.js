const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const email = 'admin@bap.com';
  const exists = await prisma.user.findUnique({ where: { email } });
  if (!exists) {
    await prisma.user.create({
      data: {
        name: 'Administrador',
        email,
        password: bcrypt.hashSync('admin123', 10),
        role: 'admin',
      },
    });
    console.log('Admin creado');
  } else {
    console.log('Admin ya existe');
  }
  await prisma.$disconnect();
}

main().catch(console.error);