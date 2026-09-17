import { redirect } from "next/navigation";

/** Any unmatched route → home (no 404 UI). */
export default function NotFound() {
  redirect("/");
}
