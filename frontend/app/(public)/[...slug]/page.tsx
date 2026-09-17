import { redirect } from "next/navigation";

/** Unmatched public paths → home (no 404 page). */
export default function CatchAllUnknownRoute() {
  redirect("/");
}
