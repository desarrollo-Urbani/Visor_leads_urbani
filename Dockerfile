# Dockerfile para Visor Leads (Frontend + Backend)

# Etapa 1: Build del Frontend
FROM node:20-alpine AS build-frontend
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Etapa 2: Servidor Backend
FROM node:20-alpine
WORKDIR /app

# Instalar dependencias del servidor
COPY server/package*.json ./server/
RUN cd server && npm install

# Copiar el build del frontend a una carpeta estática (si el servidor la sirve)
# O simplemente copiar todo el código si el servidor corre por separado
COPY --from=build-frontend /app/dist ./dist
COPY server/ ./server/

# Puerto del servidor
EXPOSE 3000

# Comando para iniciar el backend
CMD ["node", "server/index.js"]
