import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  LayoutDashboard,
  Users,
  Database,
  Flag,
  Video,
  LogOut,
  Bell
} from "lucide-react";

export default async function DashboardLayout({ children }) {
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  // NOTE: In the future, we would check the `admin_users` table to ensure 
  // the user is active and fetch their `base_role`.
  // For now, we assume anyone authenticated is a staff member.

  const navigation = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "CMS / Content", href: "/dashboard/cms", icon: Database },
    { name: "User CRM", href: "/dashboard/crm", icon: Users },
    { name: "Feature Gates", href: "/dashboard/features", icon: Flag },
    { name: "Media processing", href: "/dashboard/media", icon: Video },
    { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
  ];

  return (
    <div className="flex h-screen bg-[#0d0d0d] text-white font-sans overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-[#121212] border-r border-white/10 flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-black/50 border border-white/5 flex items-center justify-center">
            <Shield className="w-4 h-4 text-[#E8AE3C]" />
          </div>
          <span className="font-semibold tracking-tight">Mission Control</span>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="px-3 py-2 text-xs text-white/50 truncate mb-2">
            {user.email}
          </div>
          <form action="/auth/signout" method="POST">
            <button className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-400/10 transition-colors">
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </form>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto bg-[#0d0d0d] relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#E8AE3C] rounded-full blur-[150px] opacity-5 pointer-events-none" />
        <main className="p-8 relative z-10">{children}</main>
      </div>
    </div>
  );
}
