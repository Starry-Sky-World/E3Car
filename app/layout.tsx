import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Entra Invite Redemption",
  description: "Redeem invite codes to create Entra enterprise users"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <div className="max-w-5xl mx-auto px-4 py-10">{children}</div>
      </body>
    </html>
  );
}
