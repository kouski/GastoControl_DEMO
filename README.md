# GastoControl — DEMO LOCAL CON DATOS FICTICIOS

Esta versión es independiente de Firebase y no realiza llamadas a bases de datos remotas. Los registros se almacenan **solo en el localStorage del navegador**, no se sincronizan entre dispositivos ni navegadores. No introduzcas información personal real.

## Iniciar

```bash
npm install
npm run dev
```

Abrir http://localhost:3000. Para crear el paquete estático: `npm run build`.

## Demo

- Cinco empleados ficticios y registros inventados (octubre de 2026).
- Administración: PIN de ejemplo `2468`, únicamente para la demostración visual; **NO es seguridad real**.
- Backup: exportación JSON y botón **Restaurar copia de seguridad**, que reemplaza los registros locales tras confirmación.
- Los cambios persisten en este navegador. Los justificantes de los registros iniciales son solo datos descriptivos, sin fotografías adjuntas. Para volver a los datos originales, borra el almacenamiento local de este sitio.
- No incluye imágenes reales, secretos, archivos de configuración ni conexión con Firebase.
- El envío de gastos desde otro móvil no se refleja en la administración de este equipo.

**Advertencia:** Esta demo no es apta para almacenar datos sensibles ni para producción.
