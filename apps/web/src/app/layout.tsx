import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import { AuthProvider } from "@/components/auth-provider";
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
          <AuthProvider>{children}</AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
