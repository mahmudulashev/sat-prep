import { redirect } from "next/navigation";

export default function TestsIndex() {
  redirect("/dashboard/tests/math");
}
