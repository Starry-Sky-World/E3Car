import { prisma } from "./prisma";

export async function createInviteCodes(count: number) {
  const codes = Array.from({ length: count }).map(() =>
    `INV-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
  );
  await prisma.inviteCode.createMany({
    data: codes.map((code) => ({ code })),
    skipDuplicates: true
  });
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
