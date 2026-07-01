"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth, requireAdminSession } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import {
  CreateProfessionalProfileActionState,
  CreateProfessionalProfileInput,
  CreateProfessionalProfileSchema,
  CreateSanctionActionState,
  CreateSanctionInput,
  CreateSanctionSchema,
  SetBoostActionState,
  SetBoostInput,
  SetBoostSchema,
  UpdateProfessionalStatusActionState,
} from "./types";

export type UpdateProfessionalProfileActionState = CreateProfessionalProfileActionState;

const SLUG_SUFFIX_LENGTH = 4;
const MAX_SLUG_ATTEMPTS = 5;

function randomSlugSuffix(): string {
  return Math.random().toString(36).slice(2, 2 + SLUG_SUFFIX_LENGTH);
}

export async function createProfessionalProfileAction(
  input: CreateProfessionalProfileInput,
): Promise<CreateProfessionalProfileActionState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { error: "Necesitás iniciar sesión" };
  }

  const existingProfile = await prisma.professionalProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (existingProfile) {
    redirect("/professional/edit");
  }

  const parsed = CreateProfessionalProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const {
    bio,
    contactPhone,
    primaryTradeId,
    primaryYearsExperience,
    primarySpecialties,
    secondaryTrades,
    departmentIds,
  } = parsed.data;

  const uniqueDepartmentIds = [...new Set(departmentIds)];
  const baseSlug = slugify(session.user.name);

  for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
    const slug = `${baseSlug}-${randomSlugSuffix()}`;
    try {
      const profileId = await prisma.$transaction(async (tx) => {
        const profile = await tx.professionalProfile.create({
          data: {
            userId: session.user.id,
            slug,
            bio,
            contactPhone,
          },
        });

        await tx.professionalTrade.create({
          data: {
            professionalId: profile.id,
            tradeId: primaryTradeId,
            isPrimary: true,
            yearsExperience: primaryYearsExperience,
            specialties: primarySpecialties,
          },
        });

        if (secondaryTrades.length > 0) {
          await tx.professionalTrade.createMany({
            data: secondaryTrades.map((trade) => ({
              professionalId: profile.id,
              tradeId: trade.tradeId,
              isPrimary: false,
              yearsExperience: trade.yearsExperience,
              specialties: trade.specialties,
            })),
          });
        }

        await tx.professionalCoverageArea.createMany({
          data: uniqueDepartmentIds.map((departmentId) => ({
            professionalId: profile.id,
            departmentId,
          })),
        });

        return profile.id;
      });

      return { professionalId: profileId };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        continue;
      }
      throw error;
    }
  }

  return { error: "No pudimos generar tu perfil, intentá de nuevo" };
}

export async function updateProfessionalActiveStatusAction(
  professionalId: string,
  isActive: boolean,
): Promise<UpdateProfessionalStatusActionState> {
  const session = await requireAdminSession();
  if ("error" in session) {
    return { error: session.error };
  }

  await prisma.professionalProfile.update({
    where: { id: professionalId },
    data: { isActive },
  });

  return {};
}

export async function updateProfessionalVerifiedStatusAction(
  professionalId: string,
  isVerified: boolean,
): Promise<UpdateProfessionalStatusActionState> {
  const session = await requireAdminSession();
  if ("error" in session) {
    return { error: session.error };
  }

  await prisma.professionalProfile.update({
    where: { id: professionalId },
    data: { isVerified },
  });

  return {};
}

export async function createSanctionAction(
  input: CreateSanctionInput,
): Promise<CreateSanctionActionState> {
  const session = await requireAdminSession();
  if ("error" in session) {
    return { error: session.error };
  }

  const parsed = CreateSanctionSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const { professionalId, type, reason, expiresAt, confirmName } = parsed.data;

  if (type === "permanent_deactivation") {
    const professional = await prisma.professionalProfile.findUnique({
      where: { id: professionalId },
      select: { user: { select: { fullName: true } } },
    });
    if (!professional) {
      return { error: "Profesional no encontrado" };
    }
    if (
      confirmName?.trim().toLowerCase() !==
      professional.user.fullName.trim().toLowerCase()
    ) {
      return { error: "El nombre ingresado no coincide con el del profesional" };
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.professionalSanction.create({
      data: {
        professionalId,
        type,
        reason,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    if (type === "permanent_deactivation") {
      await tx.professionalProfile.update({
        where: { id: professionalId },
        data: { isActive: false },
      });
    }
  });

  return { success: true };
}

export async function setBoostAction(
  input: SetBoostInput,
): Promise<SetBoostActionState> {
  const session = await requireAdminSession();
  if ("error" in session) {
    return { error: session.error };
  }

  const parsed = SetBoostSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const { professionalId, boostUntil } = parsed.data;

  await prisma.professionalProfile.update({
    where: { id: professionalId },
    data: {
      newProfessionalBoostUntil: boostUntil ? new Date(boostUntil) : null,
    },
  });

  return { success: true };
}

export async function updateProfessionalProfileAction(
  input: CreateProfessionalProfileInput,
): Promise<UpdateProfessionalProfileActionState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { error: "Necesitás iniciar sesión" };
  }

  const existingProfile = await prisma.professionalProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true, slug: true },
  });
  if (!existingProfile) {
    redirect("/professional/onboarding");
  }

  const parsed = CreateProfessionalProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const {
    bio,
    contactPhone,
    primaryTradeId,
    primaryYearsExperience,
    primarySpecialties,
    secondaryTrades,
    departmentIds,
  } = parsed.data;

  const uniqueDepartmentIds = [...new Set(departmentIds)];

  await prisma.$transaction(async (tx) => {
    await tx.professionalProfile.update({
      where: { id: existingProfile.id },
      data: { bio, contactPhone },
    });

    // Se borran y recrean las relaciones para evitar pisar el índice
    // parcial único de oficio primario (regla #7 de CLAUDE.md).
    await tx.professionalTrade.deleteMany({
      where: { professionalId: existingProfile.id },
    });
    await tx.professionalTrade.create({
      data: {
        professionalId: existingProfile.id,
        tradeId: primaryTradeId,
        isPrimary: true,
        yearsExperience: primaryYearsExperience,
        specialties: primarySpecialties,
      },
    });
    if (secondaryTrades.length > 0) {
      await tx.professionalTrade.createMany({
        data: secondaryTrades.map((trade) => ({
          professionalId: existingProfile.id,
          tradeId: trade.tradeId,
          isPrimary: false,
          yearsExperience: trade.yearsExperience,
          specialties: trade.specialties,
        })),
      });
    }

    await tx.professionalCoverageArea.deleteMany({
      where: { professionalId: existingProfile.id },
    });
    await tx.professionalCoverageArea.createMany({
      data: uniqueDepartmentIds.map((departmentId) => ({
        professionalId: existingProfile.id,
        departmentId,
      })),
    });
  });

  redirect(`/p/${existingProfile.slug}?updated=1`);
}
