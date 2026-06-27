export interface ProfessionalBio {
  version: 2;

  jobTypes: string[];

  guarantee: {
    offersGuarantee: boolean;
    details: string;
  };

  availability: {
    days: string[];
    hours: string;
    allowsUrgentCalls: boolean;
  };

  paymentMethods: string[];

  languages: string[];

  hasInsurance: boolean;
  license: {
    isLicensed: boolean;
    number: string;
    entity: string;
  };

  workModality: string[];

  billing: string[];

  freeText: string;
}

export const EMPTY_BIO: ProfessionalBio = {
  version: 2,
  jobTypes: [],
  guarantee: { offersGuarantee: false, details: "" },
  availability: { days: [], hours: "", allowsUrgentCalls: false },
  paymentMethods: [],
  languages: ["Español"],
  hasInsurance: false,
  license: { isLicensed: false, number: "", entity: "" },
  workModality: [],
  billing: [],
  freeText: "",
};

export const BIO_OPTIONS = {
  jobTypes: [
    "Urgencias",
    "Obras nuevas",
    "Reformas y remodelaciones",
    "Mantenimiento",
    "Presupuesto sin cargo",
    "Trabajos en altura",
    "Comercios e industrias",
    "Trabajos de terminación",
    "Asesoramiento técnico",
  ],
  availability: {
    days: ["Lunes a viernes", "Sábados", "Domingos", "Feriados"],
    hours: [
      "07:00 a 13:00",
      "08:00 a 18:00",
      "09:00 a 19:00",
      "Jornada completa",
      "Guardia 24hs",
      "A convenir",
    ],
  },
  paymentMethods: [
    "Efectivo",
    "Transferencia bancaria",
    "Mercado Pago",
    "Tarjeta de débito",
    "Tarjeta de crédito",
    "Cheque",
    "Cuenta DNI",
  ],
  languages: ["Español", "Inglés", "Portugués", "Italiano"],
  workModality: [
    "Trabajo en domicilio del cliente",
    "Trabajo en taller propio",
    "Presupuesto a distancia",
    "Videollamada de diagnóstico",
  ],
  billing: [
    "Factura A",
    "Factura B",
    "Recibo sin factura",
    "Sin comprobante",
  ],
};

export function parseBio(raw: string | null): ProfessionalBio {
  if (!raw) return EMPTY_BIO;
  try {
    const parsed = JSON.parse(raw);
    if (parsed.version && parsed.version >= 2) {
      return {
        ...EMPTY_BIO,
        ...parsed,
        availability: { ...EMPTY_BIO.availability, ...(parsed.availability ?? {}) },
        guarantee: { ...EMPTY_BIO.guarantee, ...(parsed.guarantee ?? {}) },
        license: { ...EMPTY_BIO.license, ...(parsed.license ?? {}) },
      } as ProfessionalBio;
    }
    return { ...EMPTY_BIO, freeText: parsed.freeText ?? raw };
  } catch {
    return { ...EMPTY_BIO, freeText: raw };
  }
}

export function serializeBio(bio: ProfessionalBio): string {
  return JSON.stringify(bio);
}
