const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const email = 'admin@bap.com';
  const newPassword = 'admin123';
  const hashed = bcrypt.hashSync(newPassword, 10);

  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    await prisma.user.update({
      where: { email },
      data: {
        password: hashed,
        role: 'admin',
      },
    });
    console.log('✅ Admin actualizado: contraseña hasheada y rol admin');
  } else {
    await prisma.user.create({
      data: {
        name: 'Administrador',
        email,
        password: hashed,
        role: 'admin',
      },
    });
    console.log('✅ Admin creado correctamente');
  }

  await prisma.$disconnect();
}

main().catch(console.error);
