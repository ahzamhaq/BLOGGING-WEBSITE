import { redirect } from "next/navigation";

// /editor/new → serve the editor in "create" mode via the [id] dynamic route
// The editor page detects articleId === "__new__" and does a POST on first save
export default function NewEditorPage() {
  redirect("/editor/__new__");
}
