import { createSupabaseBrowserClient } from "@/lib/supabaseBrowser";
import { getCachedUser } from "@/lib/sessionCache";


export const COOKIE_NAME = "fitcoach_lang";
export type Locale = "ar" | "en";

/**
 * Reads the active language preference on the client-side.
 * First checks cookies, then localStorage, defaulting to 'ar'.
 */
export function getClientLang(): Locale {
  if (typeof window === "undefined") return "ar";
  try {
    const value = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${COOKIE_NAME}=`))
      ?.split("=")[1];
    if (value === "en" || value === "ar") return value;
    
    const local = localStorage.getItem(COOKIE_NAME);
    if (local === "en" || local === "ar") return local;
  } catch {}
  return "ar";
}

/**
 * Updates the active language preference on the client-side:
 * 1. Sets cookie (3 years maxAge).
 * 2. Saves to localStorage.
 * 3. Syncs language to user_profiles table in Supabase.
 */
export async function setClientLang(lang: Locale) {
  if (typeof window === "undefined") return;
  try {
    // 1. Set cookie
    document.cookie = `${COOKIE_NAME}=${lang}; path=/; max-age=${60 * 60 * 24 * 365 * 3}; same-site=lax`;
    
    // 2. Set localStorage
    localStorage.setItem(COOKIE_NAME, lang);
    
    // 3. Sync to Supabase user_profiles if logged in
    const supabase = createSupabaseBrowserClient();
    const { user } = await getCachedUser(supabase);
    if (user?.id) {

      await supabase
        .from("user_profiles")
        .update({ lang })
        .eq("user_id", user.id);
    }
  } catch (err) {
    console.error("Failed to set client language preference", err);
  }
}
