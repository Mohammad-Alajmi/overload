"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_ROUTINE } from "@/lib/routines";

export type AuthState = { error: string | null };

/**
 * Only allow relative paths back, so ?next= cannot be used as an open redirect.
 *
 * Finding 6: the previous version checked the first two characters — a leading
 * "/" that was not "//". That let through "/\evil.example.com", because
 * browsers normalise a backslash into a forward slash, turning it into
 * "//evil.example.com", which is a protocol-relative URL pointing off-site.
 *
 * Prefix checks keep losing this game, so the value is parsed instead and only
 * accepted if it genuinely resolves to somewhere on this origin.
 */
function safeNext(raw: unknown): string {
  const fallback = "/dashboard";
  const value = typeof raw === "string" ? raw : "";

  if (!value.startsWith("/")) return fallback;
  if (value.includes("\\")) return fallback;

  try {
    // Any origin will do; it exists only so a relative path can be resolved.
    const base = "https://overload.invalid";
    const url = new URL(value, base);
    if (url.origin !== base) return fallback;
    return `${url.pathname}${url.search}`;
  } catch {
    return fallback;
  }
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
  // Finding 3. Checked here, on the server, not only in the form. This only
  // covers people signing up through this site; someone calling the Supabase
  // API directly is governed by the project's own password policy, which is a
  // dashboard setting and has to be raised there too.
  if (password.length < 12)
    return { error: "Passwords need at least 12 characters." };

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

const ROUTINE_SLUGS = new Set(["full-body-3", "upper-lower-4", "ppl-6"]);

/**
 * Active routine lives in public.profiles now, not in auth metadata. A real
 * column can be constrained, indexed and queried; a JSON blob on the user
 * record can only be read back one member at a time.
 */
export async function setActiveRoutineAction(formData: FormData): Promise<void> {
  const slug = String(formData.get("routine") ?? "");
  if (!ROUTINE_SLUGS.has(slug)) redirect("/routines");

  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) redirect("/login");

  await supabase
    .from("profiles")
    .update({ active_routine: slug })
    .eq("id", user.user.id);

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

/** Name and default rest, edited from /me. */
export async function updateProfileAction(
  _previous: { ok: boolean; message: string } | null,
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  const displayName = String(formData.get("display_name") ?? "").trim();
  const rest = Number(formData.get("rest_seconds"));

  if (!displayName) return { ok: false, message: "A name cannot be empty." };
  if (displayName.length > 40)
    return { ok: false, message: "Names cap out at 40 characters." };
  if (!Number.isInteger(rest) || rest < 15 || rest > 600)
    return { ok: false, message: "Rest must be between 15 and 600 seconds." };

  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return { ok: false, message: "You are not signed in." };

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName, rest_seconds: rest })
    .eq("id", user.user.id);

  if (error) return { ok: false, message: error.message };

  // Keep auth metadata in step so the fallback greeting never goes stale.
  await supabase.auth.updateUser({ data: { display_name: displayName } });

  revalidatePath("/", "layout");
  return { ok: true, message: "Saved." };
}
