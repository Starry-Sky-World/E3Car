import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin";
import { refreshAdminGraphToken } from "@/lib/graph";

export async function POST(request: Request) {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const force = Boolean(body.force);

  try {
    const result = await refreshAdminGraphToken(force);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
