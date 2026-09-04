const express = require('express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const router = express.Router();
const auth = require('../middleware/auth');

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Acceso denegado' });
  next();
}

// Obtener todos los tickets (admin)
router.get('/', auth, requireAdmin, async (req, res) => {
  try {
    const tickets = await prisma.maintenanceTicket.findMany({
      include: { property: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener tickets', error: error.message });
  }
});

// Obtener tickets del arrendatario autenticado
router.get('/tenant', auth, async (req, res) => {
  try {
    const property = await prisma.property.findFirst({ where: { ownerId: req.user.id } });
    if (!property) return res.status(404).json({ message: 'No se encontró propiedad' });
    const tickets = await prisma.maintenanceTicket.findMany({
      where: { propertyId: property.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener tickets', error: error.message });
  }
});

// Crear ticket (arrendatario o admin)
router.post('/', auth, async (req, res) => {
  try {
    const { description, category, priority, propertyId } = req.body;
    const ticket = await prisma.maintenanceTicket.create({
      data: {
        description,
        category,
        priority: priority || 'media',
        status: 'open',
        propertyId,
      },
    });
    res.status(201).json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear ticket', error: error.message });
  }
});

// Actualizar ticket (responder/resolver) - admin
router.put('/:id', auth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const updated = await prisma.maintenanceTicket.update({
      where: { id },
      data: {
        adminNotes: data.adminNotes,
        status: data.status,
      },
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar ticket', error: error.message });
  }
});

module.exports = router;