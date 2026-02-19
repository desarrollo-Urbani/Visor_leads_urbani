# Resumen del Proyecto: Visor de Leads Urbani

Este documento sirve como contexto técnico para que un LLM (como Claude, GPT o Gemini) comprenda el estado actual del proyecto y proponga pasos a seguir.

## 1. Arquitectura Técnica
- **Frontend**: React 18 con TypeScript y Vite. Estilizado con Tailwind CSS y componentes de Shadcn UI. Diseño premium con modo oscuro, glassmorphism y micro-animaciones.
- **Backend**: Servidor Node.js con Express. Maneja la lógica de negocio, autenticación básica, carga de archivos CSV y gestión de leads.
- **Base de Datos**: PostgreSQL 15. Estructura relacional con tablas para `usuarios_sistema`, `leads`, `lead_status_history`, `archivos_csv` y `contact_events`.
- **Contenerización**:- **Infraestructura**: Totalmente dockerizado (`docker-compose`).
- **Persistencia**: Base de Datos PostgreSQL aislada en contenedor con inicialización automática.
- **Estado de Versión**: Sincronizado con GitHub (Rama `main`).

## 2. Funciones Implementadas
- **Dashboard de Métricas**: Visualización en tiempo real de leads por ejecutivo, ventas y valor de cartera.
- **Gestión Multi-vista**: Navegación fluida entre métricas, auditoría de leads, historial de cargas y administración de usuarios.
- **Carga Masiva Pro**: Importación vía CSV con distribución inteligente porcentual entre ejecutivos.
- **Administración**: Panel para crear, editar y resetear claves de usuarios comerciales.
- **Gestión de Leads**: Listado inteligente con filtros avanzados (Proyecto, Estado, Calidad IA/Hot Leads).
- **Carga Masiva (Admin)**: Herramienta para subir CSVs con asignación ponderada (distribución de leads entre ejecutivos por porcentaje).
- **Sistema de Auditoría**: Historial detallado de cambios de estado para cada lead.
- **Herramienta de Purga**: Botón administrativo para limpiar toda la base de datos (útil para desarrollo/pruebas).
- **Estado Vacío**: Interfaz optimizada para mostrar mensajes claros cuando no hay datos.

## 3. Estado del Repositorio y Código
- **Git**: Repositorio inicializado en la rama `main`, sincronizado con GitHub (`https://github.com/desarrollo-Urbani/Visor_leads_urbani.git`).
- **Limpieza**: Código fuente (`src/`, `server/`) totalmente limpio. Los scripts de prueba y archivos legacy se archivaron en la carpeta `_backup_dev/` (ignorada por Git).
- **Producción**: El servidor Express está configurado para servir el frontend estático (`dist/`), permitiendo un despliegue unificado en el puerto 3000.

## 4. Credenciales y Acceso Inicial
- **Usuario Admin**: `admin@urbani.com` / `123`
- **Puerto**: `3000` (Docker) o `5173` (Vite dev)

## 5. Sugerencias de Pasos a Seguir
Para continuar mejorando el proyecto, se podrían explorar estas áreas con el LLM:
1. **Seguridad (Capa 2)**: Implementar tokens JWT para sesiones reales y protector de rutas en el frontend.
2. **IA Integración**: Conectar el endpoint de calificación con modelos como Llama 3 (Groq) o GPT-4o para calificar leads en la carga.
3. **Mecanismo de Reintento**: Mejora en la estabilidad de importaciones masivas de gran tamaño (>10k leads).
4. **Notificaciones**: Sistema de alertas instantáneas (email/WhatsApp) cuando se asigna un lead "Hot" a un ejecutivo.
5. **Analytics**: Gráficos avanzados de rendimiento por ejecutivo y tasas de conversión por campaña.

---
**Estado Actual**: Listo para Producción / Dockerizado.
