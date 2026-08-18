import "./globals.css";

export const metadata = {
  title: "Kişisel Finans & Yaşam Paneli",
  description:
    "Gelir-gider, yatırım/portföy, hedef ve notları tek panelde yöneten kişisel finans ve yaşam yönetim uygulaması.",
  applicationName: "Rutinler",
  keywords: ["kişisel finans", "bütçe takibi", "yatırım", "portföy", "TEFAS fon", "hedef takibi", "not"],
  openGraph: {
    title: "Kişisel Finans & Yaşam Paneli",
    description: "Gelir-gider, yatırım, hedef ve notları tek panelde yönet.",
    type: "website",
    locale: "tr_TR",
  },
  // Herkese açık ürün: arama motorları indeksleyebilir.
  robots: { index: true, follow: true },
};

export const viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
