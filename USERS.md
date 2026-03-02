# Usuarios del Sistema

Esta guía detalla los usuarios disponibles para probar el sistema tanto en el **Entorno Mock** (sin base de datos) como en el **Entorno Real** (PostgreSQL/Docker).

## 🚀 Entorno Mock (Sin Conexión a DB)
Este entorno se activa automáticamente si no hay una base de datos PostgreSQL disponible. Las credenciales están hardcodeadas en `server/mock_data.js`.

| Nombre | Email | Password | Rol |
| :--- | :--- | :--- | :--- |
| **Felipe Admin** | `felipe@urbani.cl` | `Urbani2024!` | Administrador |
| **Ejecutivo Alpha** | `e1@urbani.cl` | `Urbani2026!` | Ejecutivo |
| **Ejecutivo Beta** | `e2@urbani.cl` | `Urbani2026!` | Ejecutivo |

---

## 🏗️ Entorno Real (PostgreSQL / Docker)
Si la base de datos está activa, los usuarios dependen de qué script de inicialización se haya ejecutado.

### Configuración Estándar (`server/db_full_setup.js`)
| Nombre | Email | Password | Rol |
| :--- | :--- | :--- | :--- |
| **Felipe Admin** | `felipe@urbani.cl` | `Urbani2024!` | Administrador |
| **Ejecutivo Alpha** | `e1@urbani.cl` | `Urbani2024!` | Ejecutivo |

### Configuración V3 Direct (`v3_direct_setup.js`)
Utilizada para pruebas masivas de asignación y logs de ejecutivo.
| Nombre | Email | Password | Rol |
| :--- | :--- | :--- | :--- |
| **Ejecutivo 1** | `e1@urbani.cl` | `123` | Ejecutivo |
| **Ejecutivo 2** | `e2@urbani.cl` | `123` | Ejecutivo |

---

> [!TIP]
> Si tienes problemas para entrar en modo real, puedes resetear la base de datos ejecutando:
> `node v3_direct_setup.js` (desde la raíz) para usar las contraseñas cortas (`123`).
