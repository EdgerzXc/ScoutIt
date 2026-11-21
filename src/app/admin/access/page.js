import { adminReturnPath } from "@/lib/adminEntryPath";
import AdminWorkspaceEntry from "./AdminWorkspaceEntry";

export const metadata = { title: "Staff access" };

export default async function AdminAccessPage({ searchParams }) {
  const params = await searchParams;
  return <AdminWorkspaceEntry destination={adminReturnPath(params?.next)} />;
}
