import "server-only";

import { auth } from "@/lib/auth";
import { createAdminClient } from "@/utils/supabase/server";

export async function getSettingsPageData() {
  const session = await auth();

  if (!session?.user?.id) {
    return { isAdmin: false };
  }

  const supabase = createAdminClient();
  const { data: companyUser } = await supabase
    .from("company_users")
    .select("role")
    .eq("user_id", session.user.id)
    .eq("status", "active")
    .maybeSingle();

  return { isAdmin: companyUser?.role === "admin" };
}
