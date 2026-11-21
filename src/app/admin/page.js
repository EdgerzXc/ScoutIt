import { requireAdminPage } from "@/lib/requireAdminPage.server";

export default async function AdminPage() {
  await requireAdminPage("/admin");
  const { default: AdminConsole } = await import("./AdminConsole");
  return <AdminConsole />;
}
