import Link from "next/link";
import { Brand } from "@/components/brand";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-12">
      <Link href="/" className="mb-10 self-start">
        <Brand />
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-1.5 mb-8 text-sm text-muted">{subtitle}</p>
      {children}
      <p className="mt-6 text-sm text-muted">{footer}</p>
    </main>
  );
}
