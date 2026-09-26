import { LogoMark } from "@/components/logo";
import { MobileNav, Sidebar } from "@/components/dashboard/nav";

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <div className="flex min-h-screen" data-page-scale="app">
      <Sidebar />
      <div className="min-w-0 flex-1">
        {/* On small screens the sidebar is replaced by this bar. */}
        <header className="sticky top-0 z-30 border-b border-line bg-canvas/85 backdrop-blur-xl lg:hidden">
          <div className="flex items-center gap-3 px-4 pt-3 sm:px-8">
            <LogoMark className="size-8" />
          </div>
          <div className="px-4 pt-3 pb-3 sm:px-8">
            <MobileNav />
          </div>
        </header>
        <main className="mx-auto max-w-6xl min-[1800px]:max-w-7xl px-4 py-8 sm:px-8 lg:pt-10">{children}</main>
      </div>
    </div>
  );
}
