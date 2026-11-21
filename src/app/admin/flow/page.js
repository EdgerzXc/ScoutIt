import { requireAdminPage } from "@/lib/requireAdminPage.server";

export default async function AdminFlowPage() {
  await requireAdminPage("/admin/flow");
  const { default: AdminFlowConsole } = await import("./AdminFlowConsole");
  return <AdminFlowConsole />;
}
