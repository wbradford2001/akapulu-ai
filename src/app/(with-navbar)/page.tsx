import { redirect } from "next/navigation";

export default function HomePage() {
  redirect("/create"); // Redirect "/" to "/create"
  return null; // This ensures the function doesn't return anything
}