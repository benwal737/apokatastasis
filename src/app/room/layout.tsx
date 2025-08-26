import { Header } from "@/components/header";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <div className="flex h-full w-full flex-col">
        <div className="fixed top-0 left-0 right-0 z-50">
          <Header hideSearch hideCreate />
        </div>
        <div className="flex flex-1 pt-16 h-full">
          <div className="h-[calc(100vh-4rem)] sticky top-16">
            <AppSidebar />
          </div>
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
