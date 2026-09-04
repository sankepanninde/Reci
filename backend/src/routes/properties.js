const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const router = express.Router();
const auth = require('../middleware/auth');

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Acceso denegado' });
  next();
}

// Helper: crea o actualiza un usuario arrendatario a partir de los datos
async function upsertTenantUser(data) {
  if (!data.email) return null;
  const password = data.password || 'Temp123!';
  const hashed = await bcrypt.hash(password, 10);

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    return prisma.user.update({
      where: { email: data.email },
      data: {
        name: data.tenant,
        phone: data.phone,
        role: 'tenant',
        password: hashed,
        mustChangePassword: true,
      },
    });
  } else {
    return prisma.user.create({
      data: {
        name: data.tenant,
        email: data.email,
        password: hashed,
        role: 'tenant',
        phone: data.phone,
        mustChangePassword: true,
      },
    });
  }
}

// Obtener todas las propiedades
router.get('/', auth, requireAdmin, async (req, res) => {
  try {
    const properties = await prisma.property.findMany({ orderBy: { name: 'asc' } });
    res.json(properties);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener propiedades', error: error.message });
  }
});

// Crear propiedad
router.post('/', auth, requireAdmin, async (req, res) => {
  try {
    const data = req.body;
    const property = await prisma.property.create({
      data: {
        name: data.unit || data.name,
        tenantName: data.tenant,
        document: data.document,
        email: data.email,
        phone: data.phone,
        password: data.password,
        meters: data.meters || '1 Normal',
        status: data.status || 'Pendiente',
        baseAmount: parseFloat(data.baseAmount) || 0,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        prevReading: data.prev != null ? parseFloat(data.prev) : null,
        currReading: data.curr != null ? parseFloat(data.curr) : null,
        m1Prev: data.m1Prev != null ? parseFloat(data.m1Prev) : null,
        m1Curr: data.m1Curr != null ? parseFloat(data.m1Curr) : null,
        m2Prev: data.m2Prev != null ? parseFloat(data.m2Prev) : null,
        m2Curr: data.m2Curr != null ? parseFloat(data.m2Curr) : null,
        m3Prev: data.m3Prev != null ? parseFloat(data.m3Prev) : null,
        m3Curr: data.m3Curr != null ? parseFloat(data.m3Curr) : null,
      },
    });

    // Si hay arrendatario, crear/actualizar usuario y enlazar
    if (data.tenant && data.email) {
      const user = await upsertTenantUser(data);
      if (user) {
        await prisma.property.update({
          where: { id: property.id },
          data: { ownerId: user.id },
        });
      }
    }

    res.status(201).json(property);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear propiedad', error: error.message });
  }
});

// Actualizar propiedad
router.put('/:id', auth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const updateData = {};
    if (data.unit !== undefined || data.name !== undefined) updateData.name = data.unit || data.name;
    if (data.tenant !== undefined) updateData.tenantName = data.tenant;
    if (data.document !== undefined) updateData.document = data.document;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.password !== undefined) updateData.password = data.password;
    if (data.meters !== undefined) updateData.meters = data.meters;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.baseAmount !== undefined) updateData.baseAmount = parseFloat(data.baseAmount);
    if (data.dueDate !== undefined) updateData.dueDate = new Date(data.dueDate);

    if (data.prevReading !== undefined) updateData.prevReading = parseFloat(data.prevReading);
    if (data.currReading !== undefined) updateData.currReading = parseFloat(data.currReading);
    if (data.prev !== undefined) updateData.prevReading = parseFloat(data.prev);
    if (data.curr !== undefined) updateData.currReading = parseFloat(data.curr);
    if (data.m1Prev !== undefined) updateData.m1Prev = parseFloat(data.m1Prev);
    if (data.m1Curr !== undefined) updateData.m1Curr = parseFloat(data.m1Curr);
    if (data.m2Prev !== undefined) updateData.m2Prev = parseFloat(data.m2Prev);
    if (data.m2Curr !== undefined) updateData.m2Curr = parseFloat(data.m2Curr);
    if (data.m3Prev !== undefined) updateData.m3Prev = parseFloat(data.m3Prev);
    if (data.m3Curr !== undefined) updateData.m3Curr = parseFloat(data.m3Curr);

    // Manejo de arrendatario
    if (data.tenant && data.email) {
      const user = await upsertTenantUser(data);
      if (user) updateData.ownerId = user.id;
    } else if (data.tenant === '') {
      updateData.ownerId = null; // desasignar
    }

    const property = await prisma.property.update({
      where: { id },
      data: updateData,
    });
    res.json(property);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar propiedad', error: error.message });
  }
});

// Eliminar propiedad
router.delete('/:id', auth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.property.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar propiedad', error: error.message });
  }
});

module.exports = router;