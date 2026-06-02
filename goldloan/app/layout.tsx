import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GoldLoan Manager",
  description: "Manage gold loans, calculate interest, track customers and send WhatsApp reminders.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
