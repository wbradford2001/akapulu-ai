import { redirect } from "next/navigation";

export default function HomePage() {
  redirect("/chat"); // Redirect "/" to "/chat"
  return null; // This ensures the function doesn't return anything
}