const express = require('express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const router = express.Router();
const auth = require('../middleware/auth');

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Acceso denegado' });
  next();
}

// Obtener plantilla por tipo
router.get('/:type', auth, requireAdmin, async (req, res) => {
  try {
    const { type } = req.params;
    const template = await prisma.notificationTemplate.findFirst({
      where: { type },
    });
    res.json(template || { type, body: '', subject: '' });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener plantilla', error: error.message });
  }
});

// Guardar/actualizar plantilla
router.put('/:type', auth, requireAdmin, async (req, res) => {
  try {
    const { type } = req.params;
    const { subject, body } = req.body;
    const existing = await prisma.notificationTemplate.findFirst({ where: { type } });
    let template;
    if (existing) {
      template = await prisma.notificationTemplate.update({
        where: { id: existing.id },
        data: { subject, body },
      });
    } else {
      template = await prisma.notificationTemplate.create({
        data: { type, subject, body },
      });
    }
    res.json(template);
  } catch (error) {
    res.status(500).json({ message: 'Error al guardar plantilla', error: error.message });
  }
});

module.exports = router;