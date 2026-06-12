import "./globals.css";

export const metadata = {
  title: "Kişisel Yönetim Paneli",
  description: "Gelir gider, yatırım ve eğitim notları yönetim paneli"
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
