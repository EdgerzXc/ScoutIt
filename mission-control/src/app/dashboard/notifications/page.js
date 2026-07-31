import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentStaff } from "@/lib/rbac";
import { sendNotification } from "./actions";
import { Send, Bell } from "lucide-react";

export default async function NotificationsPage() {
  const staff = await getCurrentStaff();
  const admin = createAdminClient();

  const { data: notifications, error } = await admin
    .from("private_notifications")
    .select("id, user_id, title, message, target_url, is_read, created_at, created_by, admin_users(email)")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Private Notifications</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Compose Form */}
        <div className="bg-[#121212] border border-white/5 rounded-xl p-6 lg:col-span-1 h-fit">
          <div className="flex items-center gap-2 mb-4 text-white">
            <Send className="w-4 h-4 text-[#E8AE3C]" />
            <h2 className="text-lg font-medium">Send Notification</h2>
          </div>
          <p className="text-xs text-white/50 mb-6">
            Send a direct notification to a user&apos;s dashboard. It will appear as an alert they must read.
          </p>

          <form action={sendNotification} className="space-y-4">
            <label className="block text-xs text-white/50">
              User ID (auth.users UUID)
              <input
                name="userId"
                required
                placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000"
                className="mt-1 w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
              />
            </label>

            <label className="block text-xs text-white/50">
              Title
              <input
                name="title"
                required
                placeholder="e.g. Action Required on Your Property"
                className="mt-1 w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
              />
            </label>

            <label className="block text-xs text-white/50">
              Message
              <textarea
                name="message"
                required
                rows={4}
                placeholder="Detailed message here..."
                className="mt-1 w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
              />
            </label>

            <label className="block text-xs text-white/50">
              Target URL (Optional)
              <input
                name="targetUrl"
                placeholder="e.g. /dashboard/inbox?inquiry=123"
                className="mt-1 w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
              />
            </label>

            <button className="w-full px-4 py-2 bg-[#E8AE3C] text-black rounded-lg text-sm font-medium hover:bg-[#F7C64E] transition-colors mt-2">
              Send Notification
            </button>
          </form>
        </div>

        {/* Right: History */}
        <div className="bg-[#121212] border border-white/5 rounded-xl p-6 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4 text-white">
            <Bell className="w-4 h-4 text-[#E8AE3C]" />
            <h2 className="text-lg font-medium">Recently Sent</h2>
          </div>

          {error ? (
            <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl p-4">
              Failed to load notifications: {error.message}
            </div>
          ) : (
            <div className="space-y-4">
              {(notifications ?? []).map((notif) => (
                <div key={notif.id} className="bg-black/30 border border-white/5 rounded-lg p-4">
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <h3 className="font-medium text-white text-sm">{notif.title}</h3>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full border ${
                        notif.is_read 
                          ? "bg-green-400/10 text-green-400 border-green-400/20" 
                          : "bg-white/5 text-white/50 border-white/10"
                      }`}>
                        {notif.is_read ? "Read" : "Unread"}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-white/70 mb-2 line-clamp-2">{notif.message}</p>
                  {notif.target_url && (
                    <div className="mb-3 text-[10px] font-mono text-white/40 truncate">
                      Link: {notif.target_url}
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[10px] text-white/40 border-t border-white/5 pt-2">
                    <span>To: {notif.user_id}</span>
                    <span>Sent by {notif.admin_users?.email} · {new Date(notif.created_at).toLocaleString()}</span>
                  </div>
                </div>
              ))}
              
              {notifications && notifications.length === 0 && (
                <div className="text-sm text-white/50 text-center py-8">
                  No notifications sent yet.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
