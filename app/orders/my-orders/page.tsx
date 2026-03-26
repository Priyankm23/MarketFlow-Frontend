import { redirect } from "next/navigation";

export default function LegacyMyOrdersRedirectPage() {
  redirect("/customer/orders");
}
