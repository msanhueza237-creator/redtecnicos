export interface DemoProfessionalContact {
  professionalId: string;
  slug: string;
  displayName: string;
  email: string;
  phone: string;
}

/**
 * Canales deliberadamente ficticios. Se mantienen fuera de la proyección pública
 * del directorio y solo se entregan tras crear una solicitud en modo fixtures.
 */
export const demoProfessionalContacts: readonly DemoProfessionalContact[] = [
  { professionalId: "demo-001", slug: "climasur-demo-spa", displayName: "ClimaSur Demo SpA", email: "climasur@demo.redtecnicos.invalid", phone: "+56 9 0000 0001" },
  { professionalId: "demo-002", slug: "tecnico-austral-ejemplo", displayName: "Técnico Austral Ejemplo", email: "austral@demo.redtecnicos.invalid", phone: "+56 9 0000 0002" },
  { professionalId: "demo-003", slug: "servicios-termicos-demo", displayName: "Servicios Térmicos Demo", email: "termicos@demo.redtecnicos.invalid", phone: "+56 9 0000 0003" },
  { professionalId: "demo-004", slug: "refrigeracion-central-ficticia", displayName: "Refrigeración Central Ficticia", email: "refrigeracion@demo.redtecnicos.invalid", phone: "+56 9 0000 0004" },
  { professionalId: "demo-005", slug: "soluciones-hvac-ejemplo", displayName: "Soluciones HVAC Ejemplo", email: "hvac@demo.redtecnicos.invalid", phone: "+56 9 0000 0005" },
  { professionalId: "demo-006", slug: "clima-norte-laboratorio", displayName: "Clima Norte Laboratorio", email: "norte@demo.redtecnicos.invalid", phone: "+56 9 0000 0006" },
  { professionalId: "demo-007", slug: "frio-pacifico-demostracion", displayName: "Frío Pacífico Demostración", email: "pacifico@demo.redtecnicos.invalid", phone: "+56 9 0000 0007" },
  { professionalId: "demo-008", slug: "instalaciones-cordillera-ejemplo", displayName: "Instalaciones Cordillera Ejemplo", email: "cordillera@demo.redtecnicos.invalid", phone: "+56 9 0000 0008" },
  { professionalId: "demo-009", slug: "mantencion-biobio-demo", displayName: "Mantención Bío Bío Demo", email: "biobio@demo.redtecnicos.invalid", phone: "+56 9 0000 0009" },
  { professionalId: "demo-010", slug: "clima-araucania-ficticio", displayName: "Clima Araucanía Ficticio", email: "araucania@demo.redtecnicos.invalid", phone: "+56 9 0000 0010" },
] as const;

export function getDemoProfessionalContact(
  professionalId: string,
  professionalSlug: string,
): DemoProfessionalContact | undefined {
  return demoProfessionalContacts.find(
    (contact) => contact.professionalId === professionalId && contact.slug === professionalSlug,
  );
}
