import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exchangeCodeForToken } from "@/lib/oauth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  const cookieStore = cookies();
  const storedState = cookieStore.get("oauth_state")?.value;

  if (!code || !state || !storedState || state !== storedState) {
    return NextResponse.redirect("/admin?error=oauth_state");
  }

  const config = await prisma.appConfig.findFirst({ orderBy: { id: "desc" } });
  if (!config) {
    return NextResponse.redirect("/admin?error=config-missing");
  }

  try {
    await exchangeCodeForToken({
      code,
      clientId: config.clientId,
      clientSecret: config.clientSecret
    });
    const res = NextResponse.redirect("/admin?success=oauth");
    res.cookies.delete("oauth_state");
    return res;
  } catch (err) {
    return NextResponse.redirect(
      `/admin?error=${encodeURIComponent((err as Error).message)}`
    );
  }
}
