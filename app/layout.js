import "./globals.css";

export const metadata = {
  title: "Kişisel Finans Yönetimi",
  description: "Gelir ve gider takip paneli",
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
