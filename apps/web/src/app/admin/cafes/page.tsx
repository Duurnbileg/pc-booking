import { redirect } from "next/navigation";

export default function AdminPendingCafesRedirect() {
  redirect("/admin/pcs?status=PENDING");
}
