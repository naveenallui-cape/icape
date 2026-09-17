import { redirect } from "next/navigation";

export default function PublicNotFound() {
  redirect("/");
}
