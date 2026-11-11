// Hand-written to match supabase/migrations/*.sql.
// Once the Supabase project exists, regenerate with:
//   npx supabase gen types typescript --project-id <id> > src/lib/supabase/types.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = "business" | "creator" | "admin";
export type BriefStatus =
  | "draft"
  | "open"
  | "assigned"
  | "in_review"
  | "approved"
  | "completed"
  | "cancelled";
export type SubmissionStatus = "pending" | "changes_requested" | "approved";
export type PayoutStatus = "pending" | "paid";
export type PriceRange = "budget" | "mid" | "premium";

type Timestamps = { created_at: string; updated_at: string };

type Table<Row, Required extends keyof Row> = {
  Row: Row;
  Insert: Partial<Row> & Pick<Row, Required>;
  Update: Partial<Row>;
  Relationships: [];
};

export type Profile = Timestamps & {
  id: string;
  role: UserRole;
  full_name: string;
  phone: string | null;
  city: string;
};

export type Business = Timestamps & {
  id: string;
  owner_id: string;
  name: string;
  category: string;
  area: string | null;
  instagram: string | null;
  website: string | null;
  about: string | null;
  audience: string | null;
  price_range: PriceRange | null;
};

export type CreatorProfile = Timestamps & {
  id: string;
  display_name: string;
  bio: string | null;
  niches: string[];
  instagram: string | null;
  followers: number | null;
  portfolio_urls: string[];
  rate_per_reel: number | null;
  is_verified: boolean;
};

export type Brief = Timestamps & {
  id: string;
  business_id: string;
  title: string;
  goal: string | null;
  answers: Json;
  ai_brief: Json | null;
  deliverables: number;
  budget_inr: number | null;
  status: BriefStatus;
  assigned_creator_id: string | null;
  due_date: string | null;
  ai_generations: number;
};

export type Submission = Timestamps & {
  id: string;
  brief_id: string;
  creator_id: string;
  video_path: string;
  caption: string | null;
  status: SubmissionStatus;
  feedback: string | null;
};

export type Payout = {
  id: string;
  creator_id: string;
  brief_id: string | null;
  amount_inr: number;
  status: PayoutStatus;
  note: string | null;
  paid_at: string | null;
  created_at: string;
};

export type BriefApplication = {
  id: string;
  brief_id: string;
  creator_id: string;
  note: string | null;
  created_at: string;
};

export type AuditLog = {
  id: number;
  actor: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  detail: Json;
  created_at: string;
};

export type AiUsage = {
  id: number;
  user_id: string;
  kind: "brief" | "match" | "calendar" | "report";
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<Profile, "id">;
      businesses: Table<Business, "owner_id" | "name" | "category">;
      creator_profiles: Table<CreatorProfile, "id">;
      briefs: Table<Brief, "business_id" | "title">;
      submissions: Table<Submission, "brief_id" | "creator_id" | "video_path">;
      payouts: Table<Payout, "creator_id" | "amount_inr">;
      ai_usage: Table<AiUsage, "user_id" | "kind">;
      audit_log: Table<AuditLog, "action" | "entity">;
      brief_applications: Table<BriefApplication, "brief_id" | "creator_id">;
    };
    Views: { [_ in never]: never };
    Functions: {
      my_role: { Args: Record<string, never>; Returns: UserRole };
      is_admin: { Args: Record<string, never>; Returns: boolean };
      admin_close_brief: { Args: { p_brief: string; p_amount: number; p_note?: string }; Returns: string };
    };
    Enums: {
      user_role: UserRole;
      brief_status: BriefStatus;
      submission_status: SubmissionStatus;
      payout_status: PayoutStatus;
    };
    CompositeTypes: { [_ in never]: never };
  };
};
