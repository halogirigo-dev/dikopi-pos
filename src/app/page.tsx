import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session: any = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role === "CASHIER") redirect("/pos");
  redirect("/dashboard");
}
