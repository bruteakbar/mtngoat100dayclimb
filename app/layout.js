import "./globals.css";

export const metadata = {
  title: "100 Days of Work",
  description: "Calisthenics · Single Kettlebell · Row · Ruck · Pull-up Bar — 100 day tracker",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
