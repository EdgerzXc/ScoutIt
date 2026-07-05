import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Activity, ShieldAlert, FileEdit, Zap } from "lucide-react";

export default async function DashboardOverview() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    }
  );

  // In a real scenario, we'd fetch actual counts here from the Supabase databases.
  // We'll mock the counts for the MVP skeleton.
  
  const stats = [
    { name: "Total Properties", value: "2,543", icon: Activity, change: "+12% this week" },
    { name: "Pending Approvals", value: "84", icon: ShieldAlert, change: "Requires action" },
    { name: "Audit Events (24h)", value: "1,204", icon: FileEdit, change: "Normal traffic" },
    { name: "Active Feature Gates", value: "5", icon: Zap, change: "2 modified recently" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">System Overview</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="bg-[#121212] border border-white/5 rounded-xl p-5"
            >
              <div className="flex items-center gap-3 text-white/50 mb-3">
                <Icon className="w-4 h-4" />
                <h3 className="text-sm font-medium">{stat.name}</h3>
              </div>
              <div className="text-3xl font-semibold text-white mb-1">
                {stat.value}
              </div>
              <div className="text-xs text-[#E8AE3C]">{stat.change}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-[#121212] border border-white/5 rounded-xl p-6">
          <h2 className="text-lg font-medium mb-4">Recent Audit Logs</h2>
          <div className="text-sm text-white/50 bg-black/50 border border-white/5 rounded-lg p-8 text-center">
            Audit logs will stream here.
          </div>
        </div>

        <div className="bg-[#121212] border border-white/5 rounded-xl p-6">
          <h2 className="text-lg font-medium mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <button className="w-full text-left px-4 py-3 bg-black/50 hover:bg-white/5 border border-white/5 rounded-lg text-sm text-white/80 transition-colors">
              Review pending properties
            </button>
            <button className="w-full text-left px-4 py-3 bg-black/50 hover:bg-white/5 border border-white/5 rounded-lg text-sm text-white/80 transition-colors">
              Manage IP Blocks
            </button>
            <button className="w-full text-left px-4 py-3 bg-black/50 hover:bg-white/5 border border-white/5 rounded-lg text-sm text-white/80 transition-colors">
              Upload Matterport URL
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
