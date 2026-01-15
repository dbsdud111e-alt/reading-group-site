import { Inter } from "next/font/google";
import "./globals.css";
import MainLayout from "@/components/layout/MainLayout";
import { ReadingProvider } from "@/lib/store";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Math Reading Group",
  description: "수학 교육자를 위한 독서 모임 및 수업 콘텐츠 공유 플랫폼",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <ReadingProvider>
          <MainLayout>{children}</MainLayout>
        </ReadingProvider>
      </body>
    </html>
  );
}
