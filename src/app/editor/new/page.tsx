import { redirect } from "next/navigation";

// /editor/new → redirect to /editor/[new-draft-id]
// In production this would create a DB draft and redirect to its ID
export default function NewEditorPage() {
  redirect("/editor/new-draft");
}
