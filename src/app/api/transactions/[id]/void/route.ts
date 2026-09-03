import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: { id: string }}) {
  const session: any = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return new Response("Forbidden", { status: 403 });
  const { reason } = await req.json();
  if (!reason) return new Response("Reason required", { status: 400 });
  const tx = await prisma.transaction.update({
    where: { id: params.id },
    data: { status: "VOID" as any, voided_by: session.user.id, voided_at: new Date(), void_reason: reason }
  });
  return Response.json(tx);
}
