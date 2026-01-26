import { redirect } from "next/navigation";

export default async function ProgramsIndexPage() {
  redirect("/packages");
}
