import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-sb-bg">
      <Header />
      <div className="pb-16 sm:pb-0">{children}</div>
      <BottomNav />
    </div>
  );
}
