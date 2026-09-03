import { prisma } from "@/lib/prisma";
import UsersClient from "./UsersClient";
export default async function UsersPage() {
  const users = await prisma.user.findMany({ select: { id: true, name: true, username: true, role: true, is_active: true, created_at: true }, orderBy: { created_at: "desc" }});
  return <UsersClient users={users} />;
}
