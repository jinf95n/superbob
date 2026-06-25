import { prisma } from "@/lib/prisma";

export type DepartmentFilterOption = {
  id: string;
  name: string;
  slug: string;
  provinceName: string;
};

export async function getDepartmentsForFilter(): Promise<
  DepartmentFilterOption[]
> {
  const departments = await prisma.department.findMany({
    orderBy: [{ province: { name: "asc" } }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      province: { select: { name: true } },
    },
  });

  return departments.map((department) => ({
    id: department.id,
    name: department.name,
    slug: department.slug,
    provinceName: department.province.name,
  }));
}

export type ProvinceWithDepartments = {
  id: string;
  name: string;
  departments: { id: string; name: string }[];
};

export async function getProvincesWithDepartments(): Promise<
  ProvinceWithDepartments[]
> {
  return prisma.province.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      departments: {
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      },
    },
  });
}

export type SanJuanDepartmentOption = {
  name: string;
  slug: string;
};

/**
 * Departamentos de San Juan, para el buscador de la home (Fase 1 solo
 * opera en San Juan).
 */
export async function getSanJuanDepartments(): Promise<
  SanJuanDepartmentOption[]
> {
  return prisma.department.findMany({
    where: { province: { name: "San Juan" } },
    orderBy: { name: "asc" },
    select: { name: true, slug: true },
  });
}
