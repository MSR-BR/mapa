import { redirect } from "next/navigation";

export default function LegacyPasswordPage() {
  redirect("/login?notice=google-only");
}
