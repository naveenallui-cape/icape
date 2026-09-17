import { redirect } from "next/navigation";

/** Unmatched /admin paths → admin dashboard (no 404 page). */
export default function AdminCatchAllUnknownRoute() {
  redirect("/admin/dashboard");
}
