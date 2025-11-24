import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getInviteCodeByCode } from "@/lib/invite";
import { resetEnterpriseUserPassword } from "@/lib/graph";

const schema = z.object({
  inviteCode: z.string().min(1, "兑换码必填"),
  userPrincipalName: z.string().min(1, "账号必填")
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const { inviteCode, userPrincipalName } = parsed.data;

  try {
    const enterpriseUser = await prisma.enterpriseUser.findUnique({
      where: { userPrincipalName }
    });
    if (!enterpriseUser) {
      throw new Error("账号不存在");
    }

    const invite = await getInviteCodeByCode(inviteCode);
    if (!invite || !invite.used || !invite.enterpriseUserId) {
      throw new Error("兑换码不可用");
    }
    if (invite.enterpriseUserId !== enterpriseUser.id) {
      throw new Error("兑换码与账号不匹配");
    }

    const password = await resetEnterpriseUserPassword(enterpriseUser.graphUserId);
    return NextResponse.json({ userPrincipalName, password });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
