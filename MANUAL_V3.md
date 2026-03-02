# 📘 Manual de Operación Maestro: Visor de Leads Urbani (Expert V3)

Bienvenido a la versión **Expert V3** del Visor de Leads Urbani. Este documento es la guía definitiva para dominar la herramienta de gestión comercial más avanzada del ecosistema.

---

## 🚀 1. Concepto de Operación "Zero Friction"

La interfaz V3 no es solo un visor de datos; es una **consola de alta velocidad** diseñada para eliminar la fricción entre el contacto y el registro de datos. El objetivo es que el ejecutivo pase el 90% de su tiempo hablando con clientes y solo el 10% registrando información.

---

## 📋 2. El Monitor de Gestión (Dashboard Administrativo)

Al ingresar como Administrador, la primera vista es el **Monitor Global**, que proporciona una radiografía en tiempo real de la operación.

### A. KPIs Fundamentales
*   **Pendientes**: Leads que han entrado al sistema y no han tenido su primer contacto.
*   **Gestión Efectiva**: Porcentaje de leads que ya han sido movidos de su estado inicial ("Nuevo").
*   **Renta Promedio**: Una métrica estratégica calculada automáticamente eliminando sesgos de formato (reconoce 1.500.000 como número válido).
*   **Via IA**: Contador de leads cuya información inicial fue enriquecida por el motor de inteligencia artificial.

### B. Visualización de Datos
*   **Embudo de Ventas**: Gráfico de barras dinámico que muestra la distribución de leads en cada etapa del proceso (Nuevo -> Por Contactar -> En Proceso -> Cerrado).
*   **Market Share por Ejecutivo**: Gráfico de torta que permite auditar la carga de trabajo y distribución de la cartera.

---

## ⚡ 3. Consola de Gestión V3 (Interface Operativa)

La consola V3 se divide en tres módulos sinérgicos que fluyen de izquierda a derecha.

### 🧩 Módulo A: Cola de Leads (La Selección Inteligente)
Este panel lateral izquierdo es el motor de prioridad del ejecutivo.
*   **Código de Colores Dinámico**:
    *   🟥 **Rojo Tenue (⏳)**: Lead "virgen" o sin gestión reciente. Requiere atención inmediata.
    *   🟩 **Verde Suave (✅)**: Lead ya gestionado en la sesión actual.
*   **Iconos de Estado**: Indica de forma inequívoca si la tarea está pendiente o completada.
*   **Buscador Inteligente**: Filtra por Nombre, Email o Proyecto sin necesidad de recargar la página.

### 🎯 Módulo B: Centro de Comando (Detalle y Acciones)
Es donde ocurre la magia. Hemos implementado una **Lógica de Mapeo Inteligente** para las acciones.

#### 📞 Acciones de Contacto Sinérgicas
A diferencia de otros sistemas, hacer clic en los botones de contacto directo ahora **prepara tu formulario**:
*   **WhatsApp / Llamar / Correo**: Al hacer clic, el sistema asume que lograste contactar al lead y automáticamente selecciona el estado **"Contactado"**, el motivo **"Interesado"** y redacta una nota inicial por ti.

#### ⚡ QuickActions (Automatización de Un Clic)
Los botones inferiores permiten mapear situaciones comunes en milisegundos:

| Acción | Motivo Automático | Próxima Acción Sugerida | Recordatorio (Agenda) | Nota Predefinida |
| :--- | :--- | :--- | :--- | :--- |
| **No contesta** | No responde | Llamar | +2 Horas | "Intento de contacto fallido. Se reintenta en 2 horas." |
| **N° Inválido** | Teléfono inválido | - | - | "Número fuera de servicio o inexistente." |
| **Contactado** | Interesado | Email | +24 Horas | "Lead contactado, se envía información por correo." |
| **Agendar** | Agendado | Visita | +48 Horas | "Visita agendada para revisar proyecto en sala de ventas." |
| **Perdido** | No califica | - | - | "Lead no cumple con perfil de renta o financiamiento." |

#### 🔄 El Flujo "Guardar + Siguiente"
Tras presionar este botón, el sistema:
1. Persiste la gestión y el historial.
2. Muestra un indicador visual de éxito.
3. Carga instantáneamente al **siguiente lead de la cola**, manteniendo el ritmo de trabajo ("Flow State").

### 📜 Módulo C: Timeline de Contacto (Contexto Total)
A la derecha, la línea de tiempo muestra la evolución del lead.
*   **Historial Inalterable**: Cada click en "Guardar" genera un registro con fecha, hora, responsable y comentario exacto.
*   **Seguimiento de Cadencia**: El sistema analiza el historial para sugerir cuándo fue la última vez que se le contactó y evitar el acoso comercial o el olvido.

---

## 🔧 4. Administración y Carga de Datos

### Gestión de Usuarios y Accesos
En la pestaña **Usuarios**, los administradores pueden:
*   Crear nuevos perfiles de ejecutivos.
*   **Botón Power (On/Off)**: Desactivar accesos de forma instantánea sin borrar el historial del usuario.
*   Asignar ejecutivos a jefes de venta específicos para reportes segmentados.

### Protocolo de Carga de Base
Para garantizar la integridad de los datos, el archivo CSV debe seguir estas reglas:
1. **Encabezado**: `nombre,apellido,email,telefono,proyecto,renta,clasificacion`
2. **Formato**: UTF-8 sin BOM (para evitar problemas con acentos).
3. **Distribución**: Al cargar, el administrador puede definir porcentajes de reparto (Ej: 50% para Ejecutivo A, 50% para Ejecutivo B).

---

## 💡 5. Resolución de Problemas (Troubleshooting)

*   **¿La pantalla se queda negra?**: Probablemente un error de carga de gráficos. Refresca con `Ctrl + R`. Hemos optimizado el componente de métricas para evitar esto, pero un internet inestable puede afectar.
*   **¿El lead no desaparece de la cola?**: Asegúrate de haber presionado "Guardar + Siguiente". Si el botón está gris, verifica que el campo **Motiva** no esté vacío.
*   **¿No veo historial?**: El historial solo aparece una vez que seleccionas un lead específico. Si el lead es nuevo, la línea de tiempo indicará "Sin gestiones previas".

---
*Documento propiedad de Urbani® Desarrollo Inmobiliario. Edición Expert V3.0 - Febrero 2026.*
