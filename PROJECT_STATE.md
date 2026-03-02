# Resumen del Proyecto: Visor de Leads Urbani (V3 Final Preparation)

Este documento es la fuente de verdad técnica sobre el estado actual del proyecto.

## 1. Arquitectura Técnica
- **Frontend**: React 18 / TypeScript / Vite / Tailwind CSS / Shadcn UI.
- **Backend**: Node.js / Express (Port 3000).
- **Base de Datos**: PostgreSQL 15 en Docker.
- **Seguridad**: Autenticación persistente vía JWT (8h) con validación de identidad en endpoints de gestión.
- **Despliegue**: Docker Compose (Frontend + Backend + DB).

# Visor Leads Urbani - Estado del Proyecto

## 🚀 Estado Actual: Preparado para Producción (Pre-Launch)
El sistema ha sido auditado y los bugs críticos de la V3 han sido resueltos.

### ✅ Mejoras Recientes (Feb 26, 2026)
1. **Fix QuickActions**: Se corrigió el error de autocompletado de fechas (ahora usa hora local en lugar de UTC).
2. **KPIs Dinámicos**: Implementación de indicadores reales en el header (Renta Promedio, % Gestión, Conteo de Vencidos y Total).
3. **Build Verificado**: El proceso de compilación (`npm run build`) se ejecuta sin errores.
4. **Seguridad**: Reforzamiento de RBAC y Login Limiter.

### 🏛️ Arquitectura y Perfiles
- **Monitor Administrativo (Dashboard)**: Acceso restringido a `admin`, `gerente` y `subgerente`. 
- **Panel de Gestión V3**: Interfaz optimizada para `ejecutivo` con flujo Auto-Next.

### ⚠️ Pendientes para el "Go-Live"
- [ ] Cambiar `JWT_SECRET` en el archivo `.env` del servidor.
- [ ] Configurar `ALLOWED_ORIGIN` en el servidor para el dominio final.
- [ ] Realizar una carga de prueba con datos reales.

---
**Ultima Actualización**: 26 de Febrero, 2026 - Auditoría y Fixes V3 Completados.
