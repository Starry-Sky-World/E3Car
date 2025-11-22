import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin";

export async function GET() {
  try {
    requireAdminSession();
  } catch (err) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }
  const config = await prisma.appConfig.findFirst({ orderBy: { id: "desc" } });
  const token = await prisma.adminToken.findFirst({ orderBy: { obtainedAt: "desc" } });
  const now = Date.now();
  return NextResponse.json({
    hasConfig: !!config,
    clientId: config?.clientId ?? null,
    hasSecret: Boolean(config?.clientSecret),
    updatedAt: config?.updatedAt ?? null,
    token: token
      ? {
          expiresAt: token.expiresAt,
          expired: token.expiresAt.getTime() < now,
          scope: token.scope,
          tokenLength: token.accessToken.length
        }
      : null
  });
}

export async function POST(request: Request) {
  try {
    requireAdminSession();
  } catch (err) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const { clientId, clientSecret } = body;
  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "Client ID 和 Client Secret 均不能为空" }, { status: 400 });
  }

  const existing = await prisma.appConfig.findFirst({ orderBy: { id: "desc" } });
  if (existing) {
    await prisma.appConfig.update({
      where: { id: existing.id },
      data: { clientId, clientSecret }
    });
  } else {
    await prisma.appConfig.create({ data: { clientId, clientSecret } });
  }

  return NextResponse.json({ ok: true });
}
