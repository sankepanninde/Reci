const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const email = 'admin@bap.com';
  const password = 'admin123';
  const hashed = await bcrypt.hash(password, 10);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.user.update({
      where: { email },
      data: { password: hashed, role: 'admin', mustChangePassword: false },
    });
    console.log('✅ Admin actualizado: contraseña admin123, rol admin');
  } else {
    await prisma.user.create({
      data: {
        name: 'Administrador',
        email,
        password: hashed,
        role: 'admin',
        mustChangePassword: false,
      },
    });
    console.log('✅ Admin creado con contraseña admin123');
  }
  await prisma.$disconnect();
}

main().catch(console.error);