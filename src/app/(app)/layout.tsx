import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AppNav from "@/components/dashboard/AppNav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session: any = await getServerSession(authOptions);
  if (!session) redirect("/login");
  return (
    <div className="min-h-screen bg-zinc-50">
      <AppNav role={session.user.role} userName={session.user.name} />
      <main className="pb-20 lg:pb-6 lg:pl-64">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
