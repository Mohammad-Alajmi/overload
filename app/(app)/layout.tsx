import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { BottomNav, TopNav } from "@/components/nav/app-nav";
import { ToastProvider } from "@/components/ui/toast";

/**
 * Second half of the session guard. The middleware already redirects a
 * logged-out request before this renders, but checking here too means no page in
 * this group can ever render without a member — a redirect rule is easy to
 * misconfigure, and 250 points are downstream of this.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  if (!user) redirect("/login");

  return (
    <ToastProvider>
      <TopNav />
      {/* Bottom padding clears the tab bar on phones. */}
      <main className="mx-auto w-full max-w-3xl px-5 pt-6 pb-28 sm:pb-12">
        {children}
      </main>
      <BottomNav />
    </ToastProvider>
  );
}
