import { Link } from "wouter";
import { Plus } from "lucide-react";
import logoSrc from "@assets/동인고_마크_파랑_투명배경_(1)_1780355951132.png";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-30 border-b bg-card">
        <div className="flex h-14 items-center px-6 gap-4">
          <Link href="/" className="font-semibold text-lg flex items-center gap-2">
            <img src={logoSrc} alt="동인고등학교 마크" className="h-8 w-auto" />
            동인고 업무 대시보드
          </Link>
          <div className="ml-auto flex items-center space-x-4">
            <Link href="/projects/new" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
              <Plus className="mr-2 h-4 w-4" />
              새 프로젝트
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1 flex overflow-hidden">
        {children}
      </main>
    </div>
  );
}
