export type UserRole = "user" | "admin";
export type TeamRole = "owner" | "admin" | "member";
export type PlanTier = "free" | "pro" | "max";
export type PaidPlanTier = Exclude<PlanTier, "free">;

export interface User {
  _id: string;
  name?: string;
  email?: string;
  image?: string;
  role?: UserRole;
}
