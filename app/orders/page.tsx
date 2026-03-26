import { redirect } from "next/navigation";

export default function LegacyOrdersRedirectPage() {
  redirect("/customer/orders");
}
