import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sopham – koll på sophämtningen i Stockholm",
  description: "Förbered dina kärl och skapa en kalender för sophämtning i Stockholm. Utan konto.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="sv">
      <body>{children}</body>
    </html>
  );
}
