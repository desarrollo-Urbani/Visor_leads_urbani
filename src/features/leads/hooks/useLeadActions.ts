import { useState, useCallback } from "react";
import { applyQuickAction } from "../services/leads.api";
import type { QuickActionPayload, QuickActionType } from "../types/lead.types";

export function useLeadActions(userId: string, onActionSuccess?: () => void) {
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Estado del formulario de gestión
    const [formData, setFormData] = useState({
        action: "" as QuickActionType | "",
        motivo: "",
        proximaAccion: "",
        fechaProximoContacto: "",
        nota: "",
    });

    const resetForm = useCallback(() => {
        setFormData({
            action: "",
            motivo: "",
            proximaAccion: "",
            fechaProximoContacto: "",
            nota: "",
        });
    }, []);

    const updateFormData = useCallback((data: Partial<typeof formData>) => {
        setFormData((prev) => ({ ...prev, ...data }));
    }, []);

    const saveManagement = useCallback(
        async (leadId: string) => {
            if (!leadId || !formData.action || !formData.motivo || !formData.nota) {
                setError("El motivo, la acción y la nota son obligatorios");
                return false;
            }

            // Validar próxima acción y fecha para agendar o no contesta
            const isContactNeeded = formData.action === "no_contesta" || formData.action === "agendar_visita";

            if (isContactNeeded && (!formData.proximaAccion || !formData.fechaProximoContacto)) {
                setError("La próxima acción y fecha son obligatorias para agendar o reintentar");
                return false;
            }

            // Si hay una acción seleccionada manualmente, la fecha debe estar
            if (formData.proximaAccion && !formData.fechaProximoContacto) {
                setError("Debes indicar una fecha para la próxima acción");
                return false;
            }

            setSaving(true);
            setError(null);
            try {
                const payload: QuickActionPayload = {
                    leadId,
                    action: formData.action as QuickActionType,
                    motivo: formData.motivo,
                    proximaAccion: formData.proximaAccion,
                    fechaProximoContacto: formData.fechaProximoContacto,
                    nota: formData.nota,
                };

                const success = await applyQuickAction(userId, payload);
                if (success) {
                    resetForm();
                    // Importante: No llamar a onSuccess aquí si queremos que la vista controle el salto
                    if (onActionSuccess) onActionSuccess();
                    return true;
                } else {
                    setError("Error al guardar la gestión");
                    return false;
                }
            } catch (err) {
                setError("Error de conexión");
                console.error(err);
                return false;
            } finally {
                setSaving(false);
            }
        },
        [userId, formData, onActionSuccess, resetForm]
    );

    return {
        saving,
        error,
        formData,
        updateFormData,
        saveManagement,
        resetForm,
        setError
    };
}
