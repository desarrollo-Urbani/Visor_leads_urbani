import type { Lead } from "@/types";

export const MOCK_LEADS: Lead[] = [
    {
        id: "1",
        nombre: "Juan Pérez",
        email: "juan.perez@email.com",
        renta: "1.500.000",
        fecha_registro: "2024-02-14T10:00:00Z",
        cantidad_negocios: 0,
        proyecto: "Pinamar",
        telefono: "+56912345678",
        estado_gestion: "No Gestionado",
        notas: "Interesado en dpto 2 dormitorios.",
    },
    {
        id: "2",
        nombre: "María González",
        email: "maria.g@email.com",
        renta: "2.800.000",
        fecha_registro: "2024-02-15T09:30:00Z",
        cantidad_negocios: 0,
        proyecto: "Pinamar",
        telefono: "+56987654321",
        estado_gestion: "Contactado",
        ultima_gestion: "2024-02-15T15:00:00Z",
        notas: "No contestó, volver a llamar tarde.",
    },
    {
        id: "3",
        nombre: "Carlos López",
        email: "c.lopez@empresa.cl",
        renta: "950.000",
        fecha_registro: "2024-02-10T11:20:00Z",
        cantidad_negocios: 0,
        proyecto: "Pinamar",
        estado_gestion: "No Efectivo",
        ultima_gestion: "2024-02-11T10:00:00Z",
        notas: "Renta insuficiente para crédito.",
    }
];
