import { redirect } from "next/navigation";

import { readSafeAuthDestination } from "@/modules/auth/oauth-contract";

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const destination = readSafeAuthDestination(next);
  redirect(`/login?notice=google-only&next=${encodeURIComponent(destination)}`);
}
