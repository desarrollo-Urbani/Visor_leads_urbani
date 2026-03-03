# 🚀 Gestor de Leads Urbani

Bienvenido al manual oficial del **Gestor de Leads**. Este documento detalla los pasos necesarios para instalar, configurar y ejecutar el proyecto en tu entorno local.

---

## 🛠️ Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:
1.  **Node.js** (v20 o superior).
2.  **PostgreSQL** (Local o vía Docker).
3.  **Ollama** (Para las funciones de Inteligencia Artificial).

---

## 📦 Instalación

1.  **Clonar el repositorio** (si aplica).
2.  **Instalar dependencias del proyecto raíz:**
    ```bash
    npm install
    ```
3.  **Instalar dependencias del servidor:**
    ```bash
    cd server
    npm install
    cd ..
    ```

---

## 🚀 Ejecución del Proyecto

El proyecto requiere tres componentes corriendo simultáneamente:

### 1. El Frontend (Interfaz de Usuario)
Ejecuta el siguiente comando desde la carpeta raíz:
```bash
npm run dev
```
> El sistema estará disponible en `http://localhost:5173`

### 2. El Backend (Servidor API)
Desde una nueva terminal, entra a la carpeta del servidor y arranca:
```bash
cd server
npm start
```
> El servidor API corre en el puerto `3000`

### 3. Asistente AI (Ollama)
Para usar la inteligencia artificial en la vista V3, debes tener Ollama activo:
1.  **Inicia Ollama:**
    ```bash
    ollama serve
    ```
2.  **Asegúrate de tener el modelo llama3 instalado:**
    ```bash
    ollama pull llama3
    ```

---

## 🤖 Uso del Asistente AI

En la pantalla de **Gestión V3**, verás a la derecha el panel de **AI Insights**. 
*   La IA tiene conocimiento automático del lead que estés seleccionando.
*   Puedes consultar análisis de perfil, consejos de venta o dudas sobre el sistema.
*   **Nota:** Si prefieres usar otro modelo (ej: `mistral`), avísame para configurarlo en el backend.

---

## 🏗️ Estructura de Carpetas

*   `/src`: Código fuente del Frontend (React + Vite + Tailwind).
*   `/server`: Código fuente del Backend (Node.js + Express).
*   `/dist`: Carpeta generada después de `npm run build` para producción.

---

## ☁️ Despliegue en Producción (Railway)

El proyecto está configurado para desplegarse automáticamente al hacer push a la rama `main`.
*   **Variables de Entorno Cruciales:** `DATABASE_URL`, `JWT_SECRET`.
*   **Build Script:** `npm run build` (omite tsc por velocidad en despliegue).

---

*Actualizado el: 03 de Marzo, 2026*
