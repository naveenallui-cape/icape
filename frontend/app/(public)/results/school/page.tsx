import { redirect } from "next/navigation";

/** School-wide results moved to school portal login */
export default function SchoolResultPage() {
  redirect("/school/login");
}
