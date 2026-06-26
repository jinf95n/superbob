import { prisma } from "@/lib/prisma";
import { Prisma, Role } from "@prisma/client";
import {
  AdminUserListItem,
  AdminUserListParams,
  AdminUserListResult,
  UserAccountProfile,
  UserProfileStats,
} from "./types";

export async function getUserAccountProfile(
  userId: string,
): Promise<UserAccountProfile | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      fullName: true,
      email: true,
      phone: true,
      phoneVerifiedAt: true,
      avatarUrl: true,
      createdAt: true,
    },
  });
}

export async function getUserProfileStats(
  userId: string,
): Promise<UserProfileStats> {
  const [contactsCount, reviewsGiven, reviewsPending] = await Promise.all([
    prisma.contactEvent.count({ where: { clientId: userId } }),
    prisma.review.count({
      where: { reviewerId: userId, publishedAt: { not: null } },
    }),
    prisma.workRecord.count({
      where: {
        clientId: userId,
        reviews: { none: { reviewerId: userId } },
      },
    }),
  ]);
  return { contactsCount, reviewsGiven, reviewsPending };
}

export type UserAccountInfo = {
  phone: string | null;
  avatarUrl: string | null;
};

export async function getUserAccountInfo(
  userId: string,
): Promise<UserAccountInfo | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { phone: true, avatarUrl: true },
  });
}

export async function getUserRole(userId: string): Promise<Role | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return user?.role ?? null;
}

export async function getTotalUsersCount(): Promise<number> {
  return prisma.user.count();
}

const ADMIN_USERS_PAGE_SIZE = 20;

export async function getUsersForAdmin(
  params: AdminUserListParams,
): Promise<AdminUserListResult> {
  const where: Prisma.UserWhereInput = {
    ...(params.provinceId && { provinceId: params.provinceId }),
    ...(params.departmentId && { departmentId: params.departmentId }),
    ...((params.registeredFrom || params.registeredTo) && {
      createdAt: {
        ...(params.registeredFrom && { gte: params.registeredFrom }),
        ...(params.registeredTo && { lte: params.registeredTo }),
      },
    }),
  };

  const total = await prisma.user.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / ADMIN_USERS_PAGE_SIZE));
  const page = Math.min(Math.max(params.page, 1), totalPages);

  const rows = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * ADMIN_USERS_PAGE_SIZE,
    take: ADMIN_USERS_PAGE_SIZE,
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      createdAt: true,
      province: { select: { name: true } },
      department: { select: { name: true } },
    },
  });

  const users: AdminUserListItem[] = rows.map((row) => ({
    id: row.id,
    fullName: row.fullName,
    email: row.email,
    phone: row.phone,
    role: row.role,
    isActive: row.isActive,
    createdAt: row.createdAt,
    provinceName: row.province?.name ?? null,
    departmentName: row.department?.name ?? null,
  }));

  return { users, total, page, pageSize: ADMIN_USERS_PAGE_SIZE, totalPages };
}
