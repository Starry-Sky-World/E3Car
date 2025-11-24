import { prisma } from "./prisma";

export async function createInviteCodes(count: number) {
  const codes: string[] = [];
  const attempted = new Set<string>();

  while (codes.length < count) {
    const code = `INV-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    if (attempted.has(code)) continue;
    attempted.add(code);
    try {
      await prisma.inviteCode.create({ data: { code } });
      codes.push(code);
    } catch (err) {
      // Unique constraint hit; regenerate and retry.
      if ((err as { code?: string }).code === "P2002") continue;
      throw err;
    }
  }

  return codes;
}

export async function createInviteCode(code: string) {
  return prisma.inviteCode.create({ data: { code } });
}

export async function listInviteCodes() {
  return prisma.inviteCode.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      enterpriseUser: true
    }
  });
}

export async function assertInviteCodeUsable(code: string) {
  const invite = await prisma.inviteCode.findUnique({ where: { code } });
  if (!invite) {
    throw new Error("兑换码不存在");
  }
  if (invite.used) {
    throw new Error("兑换码已被使用");
  }
  return invite;
}

export async function markInviteUsed(inviteId: number, enterpriseUserId: number) {
  await prisma.inviteCode.update({
    where: { id: inviteId },
    data: { used: true, usedAt: new Date(), enterpriseUserId }
  });
}

export async function revokeInviteCode(id: number) {
  return prisma.inviteCode.delete({ where: { id } });
}

export async function getInviteCodeByCode(code: string) {
  return prisma.inviteCode.findUnique({ where: { code } });
}
