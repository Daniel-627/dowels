import TenantSidebar from "@/components/shared/TenantSidebar";

export const dynamic = "force-dynamic";

export default function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50 lg:flex-row flex-col">
      <TenantSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-4 sm:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}