# Multi-stage build para optimizar el tamaño de la imagen

# ETAPA 1: Construcción del Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# ETAPA 2: Configuración del Backend y Servidor Final
FROM node:20-alpine
WORKDIR /app/server

# Instalar dependencias del servidor primero (para cachear capas)
COPY server/package*.json ./
RUN npm install

# Copiar el código del servidor
COPY server/ ./

# Copiar el resultado del build del frontend desde la primera etapa
COPY --from=frontend-builder /app/dist ../dist

# Variables de entorno por defecto
ENV PORT=3000
ENV NODE_ENV=production

# Puerto expuesto
EXPOSE 3000

# Comando para iniciar la aplicación (el servidor sirve el frontend estático)
CMD ["node", "index.js"]
