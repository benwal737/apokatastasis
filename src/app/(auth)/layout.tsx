import { Header } from "@/components/header";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-full w-full flex-col">
      <div className="fixed top-0 left-0 right-0 z-50">
        <Header hideSearch />
      </div>
      <div className="flex flex-1 pt-16 h-full">
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
