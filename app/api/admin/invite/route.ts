import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin";
import {
  assertInviteCodeUsable,
  createInviteCode,
  createInviteCodes,
  listInviteCodes,
  getInviteCodeByCode,
  revokeInviteCode
} from "@/lib/invite";

export async function GET() {
  try {
    await requireAdminSession();
  } catch (err) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }
  const invites = await listInviteCodes();
  return NextResponse.json(invites);
}

export async function POST(request: Request) {
  try {
    await requireAdminSession();
  } catch (err) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const { code, count } = body;
  try {
    if (count && Number.isInteger(count) && count > 0) {
      const created = await createInviteCodes(count);
      return NextResponse.json({ codes: created });
    }
    if (code) {
      const created = await createInviteCode(code);
      return NextResponse.json(created);
    }
    return NextResponse.json({ error: "缺少参数" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdminSession();
  } catch (err) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const forceDelete = searchParams.get("force") === "true";
  if (!code) {
    return NextResponse.json({ error: "缺少 code 参数" }, { status: 400 });
  }
  try {
    const invite = forceDelete ? await getInviteCodeByCode(code) : await assertInviteCodeUsable(code);
    if (!invite) {
      return NextResponse.json({ error: "兑换码不存在" }, { status: 404 });
    }
    await revokeInviteCode(invite.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
