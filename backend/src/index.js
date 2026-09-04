require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client'); // 👈 importar Prisma

const prisma = new PrismaClient(); // 👈 crear instancia

const authRoutes = require('./routes/auth');
const authenticate = require('./middleware/auth');
const propertiesRoutes = require('./routes/properties');
const billsRoutes = require('./routes/bills');
const maintenanceRoutes = require('./routes/maintenance');

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertiesRoutes);
app.use('/api/bills', billsRoutes);
app.use('/api/maintenance', maintenanceRoutes);

// Ruta protegida: devuelve el usuario autenticado con sus propiedades
app.get('/api/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { properties: true },
    });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener usuario', error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend en puerto ${PORT}`));