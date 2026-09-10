import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { LogInForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Log in" };

export default async function LogInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <AuthShell
      title="Welcome back."
      subtitle="Log in to pick up where your last session left off."
      footer={
        <>
          No account yet?{" "}
          <Link href="/signup" className="text-accent hover:underline">
            Create one
          </Link>
          .
        </>
      }
    >
      <LogInForm next={next ?? "/dashboard"} />
    </AuthShell>
  );
}
