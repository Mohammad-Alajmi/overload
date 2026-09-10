"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_ROUTINE } from "@/lib/routines";

export type AuthState = { error: string | null };

/** Only allow relative paths back, so ?next= cannot be used as an open redirect. */
function safeNext(raw: unknown): string {
  const value = typeof raw === "string" ? raw : "";
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  return "/dashboard";
}

export async function signUpAction(
  _previous: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const displayName = String(formData.get("display_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));

  if (!displayName) return { error: "Tell us what to call you." };
  if (displayName.length > 40)
    return { error: "That name is a little long — 40 characters or fewer." };
  if (!email.includes("@")) return { error: "That is not an email address." };
  if (password.length < 8)
    return { error: "Passwords need at least 8 characters." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Display name and active routine live in user metadata rather than a
      // profiles table: one less table, one less RLS policy to get wrong.
      data: { display_name: displayName, active_routine: DEFAULT_ROUTINE },
    },
  });

  if (error) return { error: error.message };

  if (!data.session) {
    return {
      error:
        "Account created, but this project still has email confirmation switched on, so you cannot sign in yet.",
    };
  }

  revalidatePath("/", "layout");
  redirect(next);
}

export async function logInAction(
  _previous: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));

  if (!email || !password)
    return { error: "Enter your email and password." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  // Deliberately vague: saying which half was wrong tells an attacker whether
  // an account exists.
  if (error) return { error: "That email and password do not match." };

  revalidatePath("/", "layout");
  redirect(next);
}

export async function logOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function setActiveRoutineAction(formData: FormData): Promise<void> {
  const slug = String(formData.get("routine") ?? "");
  const supabase = await createClient();
  await supabase.auth.updateUser({ data: { active_routine: slug } });
  revalidatePath("/", "layout");
  redirect("/dashboard");
}
