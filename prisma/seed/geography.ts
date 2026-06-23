import { PrismaClient } from "@prisma/client";
import { slugify } from "../../src/lib/utils";

const prisma = new PrismaClient();

const GEOREF_BASE_URL = "https://apis.datos.gob.ar/georef/api";
const DELAY_BETWEEN_REQUESTS_MS = 250;

type GeorefProvincia = {
  id: string;
  nombre: string;
};

type GeorefDepartamento = {
  id: string;
  nombre: string;
  provincia: { id: string; nombre: string };
};

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Georef API respondió ${response.status} para ${url}`);
  }
  return response.json() as Promise<T>;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchProvincias(): Promise<GeorefProvincia[]> {
  const data = await fetchJson<{ provincias: GeorefProvincia[] }>(
    `${GEOREF_BASE_URL}/provincias?max=100`,
  );
  return data.provincias;
}

async function fetchDepartamentos(
  provinciaId: string,
): Promise<GeorefDepartamento[]> {
  const data = await fetchJson<{ departamentos: GeorefDepartamento[] }>(
    `${GEOREF_BASE_URL}/departamentos?max=600&provincia=${provinciaId}`,
  );
  return data.departamentos;
}

async function main() {
  const provincias = await fetchProvincias();
  console.log(`Provincias encontradas en georef: ${provincias.length}`);

  let provinceCount = 0;
  let departmentCount = 0;

  for (const provincia of provincias) {
    const provinceSlug = slugify(provincia.nombre);

    const province = await prisma.province.upsert({
      where: { georefId: provincia.id },
      update: { name: provincia.nombre, slug: provinceSlug },
      create: {
        georefId: provincia.id,
        name: provincia.nombre,
        slug: provinceSlug,
      },
    });
    provinceCount += 1;

    const departamentos = await fetchDepartamentos(provincia.id);

    for (const departamento of departamentos) {
      const departmentSlug = `${slugify(departamento.nombre)}-${provinceSlug}`;

      await prisma.department.upsert({
        where: { georefId: departamento.id },
        update: {
          name: departamento.nombre,
          slug: departmentSlug,
          provinceId: province.id,
        },
        create: {
          georefId: departamento.id,
          name: departamento.nombre,
          slug: departmentSlug,
          provinceId: province.id,
        },
      });
      departmentCount += 1;
    }

    console.log(
      `${provincia.nombre}: ${departamentos.length} departamentos`,
    );

    await sleep(DELAY_BETWEEN_REQUESTS_MS);
  }

  console.log(
    `Listo. Provincias procesadas: ${provinceCount}. Departamentos procesados: ${departmentCount}.`,
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
