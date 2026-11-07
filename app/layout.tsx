import type { Metadata } from "next";
import brand from "@/docs/branding/brand.json";
import { brandingAsset } from "@/lib/branding";
import "./globals.css";

export const metadata: Metadata = {
  title: brand.title,
  description: brand.description,
  icons: { icon: brandingAsset(brand.favicon) },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="sv">
      <body>{children}</body>
    </html>
  );
}
