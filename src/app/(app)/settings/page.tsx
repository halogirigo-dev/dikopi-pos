import { prisma } from "@/lib/prisma";
import SettingsClient from "./SettingsClient";
export default async function SettingsPage() {
  const settings = await prisma.setting.findMany();
  const map: Record<string,string> = {};
  settings.forEach(s=>map[s.key]=s.value);
  return <SettingsClient initial={map} />;
}
