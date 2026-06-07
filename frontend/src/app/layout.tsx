import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "Logly - 学習記録アプリ",
  description: "毎日の学習を記録して、成長を可視化しよう",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Logly",
  },
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#fff",
              color: "#374151",
              borderRadius: "12px",
              border: "1px solid #F3F4F6",
              padding: "12px 16px",
              fontSize: "14px",
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
            },
            success: {
              iconTheme: {
                primary: "#6366F1",
                secondary: "#fff",
              },
            },
            error: {
              iconTheme: {
                primary: "#EF4444",
                secondary: "#fff",
              },
            },
          }}
        />
      </body>
    </html>
  );
}
