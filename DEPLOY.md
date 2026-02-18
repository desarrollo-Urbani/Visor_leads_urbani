# Guía de Despliegue con Docker

Esta guía explica cómo poner en producción el **Visor de Leads** de forma automatizada.

## Requisitos Previos
- Tener instalado **Docker** y **Docker Compose**.
- Tener el código del proyecto (ya lo tienes en GitHub).

## Pasos para Despliegue

### 1. Preparar el entorno
Crea un archivo `.env` en la raíz del proyecto (opcional, hay valores por defecto) con las credenciales que desees:
```env
DB_USER=admin_urbani
DB_PASSWORD=tu_password_seguro
DB_NAME=antigravity_db
```

### 2. Levantar el sistema
Ejecuta el siguiente comando en la terminal dentro de la carpeta del proyecto:
```bash
docker-compose up -d --build
```
*Esto hará lo siguiente:*
- Descargará y configurará la base de datos PostgreSQL.
- **Inicializará las tablas automáticamente** usando `schema_local.sql`.
- Construirá la imagen de la aplicación (Frontend + Backend).
- Levantará todo el cluster.

### 3. Acceder a la aplicación
Una vez termine el proceso:
- La aplicación estará disponible en: `http://localhost:3000`
- **Usuario inicial**: `admin@urbani.com`
- **Contraseña**: `123`

## Comandos Útiles
- **Ver logs**: `docker-compose logs -f app`
- **Detener todo**: `docker-compose down`
- **Reiniciar**: `docker-compose restart app`

---
> [!TIP]
> Si despliegas en un servidor remoto, asegúrate de cambiar `localhost` por la IP de tu servidor.
