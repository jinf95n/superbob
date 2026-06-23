import { createClient } from "@supabase/supabase-js";

// Service role: bypassa RLS. Solo se usa en Server Actions/Route Handlers,
// nunca debe importarse desde un Client Component.
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string,
);
