import { cookies } from "next/headers";

export const adminSessionCookieName = "adminSession";

export function requireAdminSession() {
  const cookieStore = cookies();
  const session = cookieStore.get(adminSessionCookieName)?.value;
  if (!session || session !== "ok") {
    throw new Error("Unauthorized");
  }
}
