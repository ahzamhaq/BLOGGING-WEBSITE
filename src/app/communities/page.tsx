import { redirect } from "next/navigation";

// Permanent redirect: /communities → /community
export default function CommunitiesRedirect() {
  redirect("/community");
}
