INSTRUCCIONES — Plataforma BAP Inmobiliaria
Archivos actualizados / corregidos
1. AdminDashboard.jsx ✅
Ubicación recomendada: src/components/dashboard/AdminDashboard.jsx
Cambios realizados:
🐛 BUG CRÍTICO CORREGIDO: El input de "Aseo general" ya no comparte estado con "Aseo Apto". Ahora cada uno maneja su propio valor (totalTrashBill vs apartmentTrashBill).
➕ Nueva pestaña: Mantenimiento — Lee bap_maintenance del localStorage y muestra todos los reportes de los arrendatarios. Puedes responder y marcar como resuelto.
➕ Nueva pestaña: Comprobantes — Muestra los pagos reportados por los tenants (desde su portal). Puedes "Verificar pago" (marca el recibo como Pagado) o "Rechazar" (limpia el comprobante).
🔧 Al verificar un pago, se sincroniza el estado del recibo Y la propiedad a "Pagado".
🔧 Al cambiar estado de pago en la pestaña "Pagos", se sincroniza también en los recibos generados.
🔧 handleTenantCreated ahora respeta el id de la unidad ingresado en el modal (no sobrescribe con documento).
2. CreateTenantModal.jsx ✅
Ubicación recomendada: src/components/dashboard/CreateTenantModal.jsx
Cambios realizados:
El campo "ID de la Unidad / Local" se envía correctamente como id y unit al crear el arrendatario.
Compatible con edición (modo editingTenant).
Estructura de carpetas sugerida
plain
src/
├── App.jsx
├── main.jsx
├── index.css
├── components/
│   ├── auth/
│   │   └── UnifiedLogin.jsx
│   └── dashboard/
│       ├── AdminDashboard.jsx
│       ├── CreateTenantModal.jsx
│       └── TenantDashboard.jsx
Cómo usar
Reemplaza tu AdminDashboard.jsx actual con el archivo descargado.
Reemplaza tu CreateTenantModal.jsx actual con el archivo descargado.
Los demás archivos (UnifiedLogin.jsx, TenantDashboard.jsx, App.jsx, main.jsx, index.css) siguen funcionando igual. No necesitas cambiarlos.
Ejecuta npm run dev (o npm start) y prueba:
Editar el aseo general y el aseo del apartamento por separado.
Crear un nuevo arrendatario con un ID de unidad personalizado.
Ver reportes de mantenimiento desde el portal del admin.
Ver y verificar comprobantes de pago enviados desde el portal del arrendatario.
Dependencias necesarias
bash
npm install lucide-react react-router-dom
Tailwind CSS debe estar configurado en tu proyecto.
Datos de prueba (login)
Admin: admin@bap.com / admin123
Arrendatario: Usa el documento o correo de cualquier unidad del panel + la contraseña provisional.

INSTRUCCIONES — Plataforma BAP Inmobiliaria (v2)
Cambios en esta versión
1. Asignación de locales obligatoria ✅
Al crear un arrendatario, el campo "ID de la Unidad / Local" es obligatorio.
Al editar un arrendatario, puedes cambiarle la unidad/local (reasignarlo).
Si intentas usar una unidad que ya está ocupada por otro arrendatario, el formulario te lo bloquea con un error en rojo.
Se muestra la lista de unidades ocupadas debajo del campo para referencia.
2. Campos obligatorios marcados ✅
Todos los campos obligatorios tienen un asterisco rojo (*) y validación en tiempo real:
ID de la Unidad / Local
Nombre
Documento (solo números)
Correo electrónico (formato válido)
Contraseña provisional (mínimo 6 caracteres)
Canon base
3. Teléfono / WhatsApp opcional
Nuevo campo para guardar el teléfono del arrendatario (útil para notificaciones WhatsApp futuras).
4. Visualización mejorada en "Arrendatarios"
Icono de casa junto al nombre de la unidad.
Mensaje indicando que puedes editar para reasignar local.
Teléfono visible en la tarjeta del arrendatario si está guardado.
Estructura de carpetas
plain
src/
├── App.jsx
├── main.jsx
├── index.css
├── components/
│   ├── auth/
│   │   └── UnifiedLogin.jsx
│   └── dashboard/
│       ├── AdminDashboard.jsx
│       ├── CreateTenantModal.jsx
│       └── TenantDashboard.jsx
Dependencias
bash
npm install lucide-react react-router-dom
Datos de prueba
Admin: admin@bap.com / admin123
Arrendatario: Usa el documento o correo de cualquier unidad + contraseña provisional.