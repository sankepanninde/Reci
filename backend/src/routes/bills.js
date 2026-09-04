const express = require('express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const router = express.Router();
const auth = require('../middleware/auth');
const { sendEmail } = require('../services/emailService');

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Acceso denegado' });
  next();
}

router.get('/', auth, requireAdmin, async (req, res) => {
  try {
    const bills = await prisma.bill.findMany({
      include: { property: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(bills);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener recibos', error: error.message });
  }
});

router.get('/tenant', auth, async (req, res) => {
  try {
    const property = await prisma.property.findFirst({
      where: { ownerId: req.user.id },
    });
    if (!property) return res.status(404).json({ message: 'No se encontró propiedad' });
    const bills = await prisma.bill.findMany({
      where: { propertyId: property.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json(bills);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener recibos del arrendatario', error: error.message });
  }
});

router.post('/generate', auth, requireAdmin, async (req, res) => {
  try {
    const billsData = req.body.bills || req.body;
    const emailTemplate = req.body.emailTemplate || '';
    const whatsappTemplate = req.body.whatsappTemplate || '';

    for (const bill of billsData) {
      const property = await prisma.property.findUnique({
        where: { id: bill.propertyId },
      });
      if (!property) continue;

      const replaceVariables = (template, p, b) => {
        return template
          .replaceAll('{nombre_arrendatario}', p.tenantName || 'Arrendatario')
          .replaceAll('{nombre_local}', p.name || 'Local')
          .replaceAll('{fecha_corte}', `${b.periodStart} al ${b.periodEnd}`)
          .replaceAll('{consumo_total}', b.consumption.toString())
          .replaceAll('{importe_total}', `$${b.total}`)
          .replaceAll('{fecha_limite}', new Date(b.dueDate).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }))
          .replaceAll('{url_plataforma}', process.env.FRONTEND_URL || 'http://localhost:5173');
      };

      const emailBody = replaceVariables(emailTemplate, property, bill);
      const whatsappBody = replaceVariables(whatsappTemplate, property, bill);

      // Enviar correo real si hay email y plantilla
      if (property.email && emailBody) {
        await sendEmail(
          property.email,
          'Nuevo recibo de luz disponible para pago',
          `<p>${emailBody.replace(/\n/g, '<br>')}</p>`
        );
      }

      // WhatsApp simulado (solo log)
      if (property.phone && whatsappBody) {
        console.log(`WhatsApp simulado para ${property.phone}: ${whatsappBody}`);
      }

      // Guardar recibo
      await prisma.bill.create({
        data: {
          propertyId: bill.propertyId,
          periodStart: new Date(bill.periodStart),
          periodEnd: new Date(bill.periodEnd),
          dueDate: new Date(bill.dueDate),
          consumption: bill.consumption,
          kwhRate: bill.kwhRate,
          energyTotal: bill.energyTotal,
          trashCost: bill.trashCost,
          total: bill.total,
          status: bill.status || 'Pendiente',
        },
      });
    }

    res.status(201).json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear recibos', error: error.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    if (req.user.role !== 'admin') {
      const property = await prisma.property.findFirst({ where: { ownerId: req.user.id } });
      if (!property) return res.status(403).json({ message: 'No autorizado' });
      const bill = await prisma.bill.findUnique({ where: { id } });
      if (!bill || bill.propertyId !== property.id) return res.status(403).json({ message: 'No autorizado' });
    }

    const updateData = {};
    if (data.status) updateData.status = data.status;
    if (data.paymentProof) updateData.paymentProof = JSON.stringify(data.paymentProof);
    if (data.paidDate) updateData.paidDate = new Date(data.paidDate);

    const updated = await prisma.bill.update({
      where: { id },
      data: updateData,
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar recibo', error: error.message });
  }
});

// Ruta para probar plantilla de email sin crear recibo
router.post('/test-email', auth, requireAdmin, async (req, res) => {
  try {
    const { to, subject, template } = req.body;
    if (!to || !template) return res.status(400).json({ message: 'Faltan destinatario o plantilla' });

    const sampleBill = {
      periodStart: '2026-07-01',
      periodEnd: '2026-07-31',
      dueDate: '2026-08-30',
      consumption: 320,
      total: 178000,
    };
    const sampleProperty = {
      tenantName: 'Comercio Alpha',
      name: 'Local 1',
    };

    const replaceVariables = (tpl, p, b) => {
      return tpl
        .replaceAll('{nombre_arrendatario}', p.tenantName || 'Arrendatario')
        .replaceAll('{nombre_local}', p.name || 'Local')
        .replaceAll('{fecha_corte}', `${b.periodStart} al ${b.periodEnd}`)
        .replaceAll('{consumo_total}', b.consumption.toString())
        .replaceAll('{importe_total}', `$${b.total}`)
        .replaceAll('{fecha_limite}', new Date(b.dueDate).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }))
        .replaceAll('{url_plataforma}', process.env.FRONTEND_URL || 'http://localhost:5173');
    };

    const finalBody = replaceVariables(template, sampleProperty, sampleBill);
    await sendEmail(to, subject || 'Nuevo recibo de luz disponible para pago', `<p>${finalBody.replace(/\n/g, '<br>')}</p>`);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error al enviar correo de prueba', error: error.message });
  }
});

module.exports = router;