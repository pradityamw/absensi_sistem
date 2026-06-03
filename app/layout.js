import "./globals.css";

export const metadata = {
  title: "PresensiPintar - Sistem Absensi Siswa Bulanan",
  description: "Aplikasi Web Absensi Siswa Bulanan Terintegrasi Supabase & Google Sheets",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}

