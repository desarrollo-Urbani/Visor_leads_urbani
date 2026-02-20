# Resumen del Proyecto: Visor de Leads Urbani

Este documento sirve como contexto técnico para que un LLM (como Claude, GPT o Gemini) comprenda el estado actual del proyecto y proponga pasos a seguir.

## 1. Arquitectura Técnica
- **Frontend**: React 18 con TypeScript y Vite. Estilizado con Tailwind CSS y componentes de Shadcn UI.
- **Backend**: Servidor Node.js con Express. Maneja la lógica de negocio, autenticación, y carga de archivos con **UPSERT Inteligente**.
- **Base de Datos**: PostgreSQL 15 **Local a Docker** (con volumen persistente `postgres_data`).
- **Contenerización**: Todo el sistema corre en containers (`docker-compose`).

## 2. Funciones Implementadas
- **Dashboard de Métricas**: Visualización en tiempo real de leads.
- **Normalización Inteligente**: `ai_normalizer.py` con Ollama (llama3.2:latest) para resúmenes automáticos con 🤖.
- **Importación Robusta**: Prevención de duplicados basada en Email + Teléfono + Proyecto.
- **Purga & Carga**: Herramientas administrativas para limpieza y repoblación de leads.

## 4. Credenciales y Acceso (Docker)
- **URL Frontend**: [http://localhost:5173](http://localhost:5173) (Vite Dev)
- **URL Unificada**: [http://localhost:3000](http://localhost:3000) (Producción)
- **Admin**: `desarrollo@urbani.cl` / `Urbani2026!`
- **Ejecutivo**: `felipe.torresp@gmail.com` / `Urbani2026!`

---
**Estado Actual**: Finalizado y Operativo en Docker.
