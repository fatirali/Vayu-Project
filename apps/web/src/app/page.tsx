import { redirect } from "next/navigation";

// Root redirect — middleware handles auth; this is a fallback
export default function RootPage() {
  redirect("/library");
}
