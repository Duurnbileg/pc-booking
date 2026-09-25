import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import { AuthProvider } from "@/components/auth-provider";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: "PCBook — Gaming Center",
  description: "Монголын gaming center-үүдийг олж, үнэ · gear · үзүүлэлтээ харьцуулаарай.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="mn">
      <body>
        <Providers>
          <AuthProvider>
            <SiteHeader />
            <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
