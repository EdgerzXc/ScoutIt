"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, Shield, Clock, X, ChevronDown, Check, Activity, Mail, CheckSquare, Plus, AlertCircle, Key, CheckCircle, Link2, History } from "lucide-react";
import { useDashboard } from "../../../context/DashboardContext";
import { crmFetch } from "../../../lib/crmClient";

// Seats a real estate enterprise actually staffs — brokers, developer project
// managers, strata/property managers, co-working operators, finance.
const ROLES = ["Admin", "Broker", "Developer PM", "Strata Manager", "Operator", "Head of Finances", "Agent", "Viewer"];

// Plain-language labels for crm_activity_log activity types.
const ACTIVITY_LABELS = {
  deal_initiated: "Opened a connection",
  status_change: "Moved a deal",
  note_added: "Added a private note",
  viewing_scheduled: "Scheduled a viewing",
  task_completed: "Completed a task",
};

// Gold-ring initials disc when a member has no real avatar photo — we never
// show a stock stranger's face for a real account (Honest Blank Rule).
function MemberAvatar({ member, size = "w-10 h-10", textSize = "text-sm" }) {
  if (member.avatar) {
    /* eslint-disable-next-line @next/next/no-img-element */
    return <img src={member.avatar} alt={member.name} className={`${size} rounded-full object-cover`} />;
  }
  const initials = (member.name || "?")
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div className={`${size} rounded-full bg-[#E8AE3C]/10 border border-[#E8AE3C]/30 flex items-center justify-center shrink-0`}>
      <span className={`${textSize} font-mono text-[#E8AE3C] tracking-wider`}>{initials}</span>
    </div>
  );
}

export default function TeamManagementPanel({ currentUser = null, properties = [], pitches = [] }) {
  const { addToast } = useDashboard();
  const [teamList, setTeamList] = useState([]);

  // Real crm_tasks rows for the signed-in member (persisted; survives refresh,
  // completed rows become the task history). Invited sandbox members have no
  // account yet, so they honestly show nothing.
  const [memberTasks, setMemberTasks] = useState(null); // null = loading
  const [memberActivity, setMemberActivity] = useState(null);

  const loadMemberData = useCallback(async () => {
    if (!currentUser?.id) return;
    try {
      const data = await crmFetch("/api/crm/tasks", { mockUserId: currentUser.id });
      setMemberTasks(data.tasks || []);
    } catch {
      setMemberTasks([]);
    }
    try {
      const data = await crmFetch("/api/crm/activity", { mockUserId: currentUser.id });
      setMemberActivity(data.activities || data.activity || []);
    } catch {
      setMemberActivity([]);
    }
  }, [currentUser?.id]);

  useEffect(() => { loadMemberData(); }, [loadMemberData]);
  
  // Mobile master–detail: below md the list and detail share one screen,
  // so tapping a member slides to the detail pane and a back button returns.
  const [showMobileDetail, setShowMobileDetail] = useState(false);

  // Modals / Overlays
  const [isInvitingMember, setIsInvitingMember] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Viewer");

  // Load initial logical data
  useEffect(() => {
    const list = [];
    
    const defaultPermissions = [
      { id: "manage_listings", label: "Manage Listings", description: "Allow member to edit, add, or archive properties." },
      { id: "view_financials", label: "View Financials", description: "Allow access to gross yields and revenue projections." },
      { id: "manage_finance", label: "Manage Financial Operations", description: "Full control over billing, invoicing, and payouts." },
      { id: "manage_projects", label: "Manage Project Tracker", description: "Allow member to post updates and edit development milestones." },
      { id: "delegate_units", label: "Delegate Units", description: "Allow member to re-assign master units to operators." },
      { id: "invite_members", label: "Invite Members", description: "Allow member to invite new users to the Enterprise OS." },
      { id: "publish_airtable", label: "Publish to Master", description: "Allow direct publishing and sync to the public Airtable directory." },
      { id: "export_data", label: "Export Portfolio Data", description: "Allow downloading of raw CRM and property data CSVs." },
      { id: "bypass_ai_queue", label: "Priority AI Processing", description: "Bypass the standard drafting queue for instant AI insights." },
    ];

    // The real signed-in super-admin is the only member until invites go out.
    // Honest Blank Rule: no seeded teammates, no invented activity or tasks.
    if (currentUser) {
      list.push({
        id: "current_user",
        name: currentUser.user_metadata?.full_name || currentUser.email || "You",
        email: currentUser.email || "",
        role: "Admin",
        avatar: currentUser.user_metadata?.avatar_url || null,
        lastActive: "Just now",
        activities: [],
        tasks: [],
        permissions: defaultPermissions.map(p => ({ ...p, granted: true }))
      });
    }

    // Set state
    setTeamList(list);
  }, [currentUser, properties]);

  const [activeMemberId, setActiveMemberId] = useState("current_user");
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [activeTab, setActiveTab] = useState("permissions"); // "activity" | "tasks" | "permissions"
  
  // Task assignment state
  const [isAssigningTask, setIsAssigningTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDue, setNewTaskDue] = useState("");
  const [isSavingTask, setIsSavingTask] = useState(false);
  const [showTaskHistory, setShowTaskHistory] = useState(false);

  const activeMember = teamList.find(m => m.id === activeMemberId) || teamList[0];

  // Persisted through the same crm_tasks engine brokers use — refresh-proof,
  // and completed rows automatically become the member's task history.
  const handleAssignTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || isSavingTask) return;
    if (activeMemberId !== "current_user") {
      addToast("That seat isn't activated yet — tasks can be delegated once they join", "ℹ️");
      return;
    }
    setIsSavingTask(true);
    try {
      const body = {
        title: newTaskTitle.trim(),
        dueAt: newTaskDue ? new Date(`${newTaskDue}T09:00:00`).toISOString() : null,
      };
      const data = await crmFetch("/api/crm/tasks", { method: "POST", mockUserId: currentUser?.id, body });
      setMemberTasks((prev) => [data.task, ...(prev || [])]);
      addToast(`Delegated "${newTaskTitle.trim()}"`, "✅");
      setIsAssigningTask(false);
      setNewTaskTitle("");
      setNewTaskDue("");
    } catch (err) {
      console.error("Failed to delegate task:", err);
      addToast("Couldn't save the task — try again", "❌");
    } finally {
      setIsSavingTask(false);
    }
  };

  const handleMarkTaskDone = async (taskId) => {
    try {
      const data = await crmFetch(`/api/crm/tasks/${taskId}`, {
        method: "PATCH",
        mockUserId: currentUser?.id,
        body: { completed: true },
      });
      setMemberTasks((prev) => (prev || []).map((t) => (t.id === taskId ? data.task : t)));
      addToast("Task marked as Done", "✅");
    } catch (err) {
      console.error("Failed to complete task:", err);
      addToast("Couldn't update the task", "❌");
    }
  };

  const togglePermission = (memberId, permissionId) => {
    setTeamList(prev => prev.map(m => {
      if (m.id !== memberId) return m;
      return {
        ...m,
        permissions: m.permissions.map(p => p.id === permissionId ? { ...p, granted: !p.granted } : p)
      };
    }));
  };

  const handleInviteSubmit = (e) => {
    e.preventDefault();
    if (!inviteEmail) return;

    const newMember = {
      id: `user_${Date.now()}`,
      name: inviteEmail.split("@")[0],
      email: inviteEmail,
      role: inviteRole,
      avatar: null,
      lastActive: "Invited — not yet joined",
      activities: [],
      tasks: [],
      permissions: teamList[0]?.permissions.map(p => ({ ...p, granted: false })) || []
    };

    setTeamList(prev => [...prev, newMember]);
    setActiveMemberId(newMember.id);
    setIsInvitingMember(false);
    setInviteEmail("");
    addToast(`Invited ${inviteEmail} as ${inviteRole}`, "✅");
  };

  const handleRoleChange = (memberId, newRole) => {
    setTeamList(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m));
    setEditingRoleId(null);
    addToast(`Role updated to ${newRole}`, "✅");
  };

  return (
    <div className="flex h-[calc(100vh-140px)] animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
      <div className="w-full flex rounded-2xl bg-surface/30 backdrop-blur-xl border border-white/5 overflow-hidden shadow-2xl relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-gold-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
        
        {/* Invite Member Modal Overlay */}
        {isInvitingMember && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6 animate-in fade-in">
            <div className="bg-surface border border-[#E8AE3C]/30 rounded-xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-white">Invite New Member</h3>
                <button onClick={() => setIsInvitingMember(false)} className="text-white/50 hover:text-white transition-colors">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleInviteSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="text-xs text-white/60 mb-1 block">Email Address</label>
                  <input 
                    type="email" 
                    required
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    placeholder="colleague@company.com" 
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#E8AE3C] transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/60 mb-1 block">Role</label>
                  <select 
                    value={inviteRole}
                    onChange={e => setInviteRole(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#E8AE3C] transition-colors"
                  >
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <button type="submit" className="w-full py-2 mt-2 bg-[#E8AE3C] text-black font-medium text-sm rounded hover:bg-[#F7C64E] transition-colors">
                  Send Invitation
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 flex overflow-hidden relative z-10">
          
          {/* Members List (Left Side) */}
          <div className={`w-full md:w-1/3 border-r border-white/5 flex-col ${showMobileDetail ? "hidden md:flex" : "flex"}`}>
            <div className="p-4 border-b border-white/5">
              <button 
                onClick={() => setIsInvitingMember(true)}
                className="w-full py-2 bg-[#E8AE3C] text-black font-medium text-sm rounded hover:bg-[#F7C64E] transition-colors flex items-center justify-center gap-2">
                <Users size={16} /> Invite Member
              </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
              {teamList.map(member => (
                <div 
                  key={member.id}
                  onClick={() => { setActiveMemberId(member.id); setEditingRoleId(null); setShowMobileDetail(true); }}
                  className={`p-3 rounded-lg cursor-pointer transition-all flex items-center gap-3 border ${
                    activeMemberId === member.id 
                      ? 'bg-white/10 border-white/20' 
                      : 'bg-transparent border-transparent hover:bg-white/5'
                  }`}
                >
                  <MemberAvatar member={member} />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <div className="text-sm text-white font-medium truncate">{member.name}</div>
                      {/* Live load indicators — open tasks + active chatboxes */}
                      {member.id === 'current_user' && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          {(memberTasks || []).filter((t) => !t.completedAt).length > 0 && (
                            <div className="text-[10px] font-mono bg-[#E8AE3C]/20 text-[#E8AE3C] px-1.5 py-0.5 rounded">
                              {(memberTasks || []).filter((t) => !t.completedAt).length} Tasks
                            </div>
                          )}
                          {pitches.filter((p) => p.status === 'pending' || p.status === 'accepted').length > 0 && (
                            <div className="text-[10px] font-mono bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded flex items-center gap-1">
                              <Link2 size={9} />
                              {pitches.filter((p) => p.status === 'pending' || p.status === 'accepted').length}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-[10px] text-white/50 uppercase tracking-widest">{member.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Member Details & Tabs (Right Side) */}
          <div className={`w-full md:w-2/3 flex-col bg-surface/50 border-l border-white/5 ${showMobileDetail ? "flex" : "hidden md:flex"}`}>
            {activeMember ? (
              <>
                <div className="p-6 border-b border-white/5 flex flex-col items-center text-center relative">
                  <button
                    onClick={() => setShowMobileDetail(false)}
                    className="md:hidden absolute left-4 top-4 flex items-center gap-1 text-[11px] font-mono uppercase tracking-widest text-[#E8AE3C] min-h-[40px]"
                  >
                    ← Team
                  </button>
                  <div className="mb-4"><MemberAvatar member={activeMember} size="w-20 h-20" textSize="text-xl" /></div>
                  <h3 className="text-lg text-white font-medium">{activeMember.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-white/50 mt-1 mb-4">
                    <Mail size={12} /> {activeMember.email}
                  </div>
                  
                  {/* Role Editor */}
                  <div className="w-full relative">
                    <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1 text-left">Assigned Role</div>
                    {editingRoleId === activeMember.id ? (
                      <div className="bg-black border border-[#E8AE3C]/50 rounded overflow-hidden">
                        {ROLES.map(role => (
                          <div 
                            key={role}
                            onClick={() => handleRoleChange(activeMember.id, role)}
                            className="px-3 py-2 text-xs text-white/80 hover:bg-[#E8AE3C]/10 hover:text-[#E8AE3C] cursor-pointer flex items-center justify-between"
                          >
                            {role}
                            {activeMember.role === role && <Check size={14} className="text-[#E8AE3C]" />}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div 
                        onClick={() => setEditingRoleId(activeMember.id)}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-sm text-white flex items-center justify-between cursor-pointer hover:border-white/30 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Shield size={14} className="text-[#E8AE3C]" />
                          {activeMember.role}
                        </div>
                        <ChevronDown size={14} className="text-white/40" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Sub-Navigation Tabs */}
                <div className="flex border-b border-white/5">
                  <button 
                    onClick={() => setActiveTab('permissions')}
                    className={`flex-1 py-3 text-[11px] font-medium tracking-wide uppercase transition-colors flex items-center justify-center gap-1.5 ${
                      activeTab === 'permissions' ? 'text-[#E8AE3C] border-b-2 border-[#E8AE3C]' : 'text-white/40 hover:text-white/80 border-b-2 border-transparent'
                    }`}
                  >
                    <Key size={14} /> Permissions
                  </button>
                  <button 
                    onClick={() => setActiveTab('tasks')}
                    className={`flex-1 py-3 text-[11px] font-medium tracking-wide uppercase transition-colors flex items-center justify-center gap-1.5 ${
                      activeTab === 'tasks' ? 'text-[#E8AE3C] border-b-2 border-[#E8AE3C]' : 'text-white/40 hover:text-white/80 border-b-2 border-transparent'
                    }`}
                  >
                    <CheckSquare size={14} /> Alignment
                  </button>
                  <button
                    onClick={() => setActiveTab('activity')}
                    className={`flex-1 py-3 text-[11px] font-medium tracking-wide uppercase transition-colors flex items-center justify-center gap-1.5 ${
                      activeTab === 'activity' ? 'text-[#E8AE3C] border-b-2 border-[#E8AE3C]' : 'text-white/40 hover:text-white/80 border-b-2 border-transparent'
                    }`}
                  >
                    <Activity size={14} /> Activity Log
                  </button>
                  <button
                    onClick={() => setActiveTab('connections')}
                    className={`flex-1 py-3 text-[11px] font-medium tracking-wide uppercase transition-colors flex items-center justify-center gap-1.5 ${
                      activeTab === 'connections' ? 'text-[#E8AE3C] border-b-2 border-[#E8AE3C]' : 'text-white/40 hover:text-white/80 border-b-2 border-transparent'
                    }`}
                  >
                    <Link2 size={14} /> Connections
                  </button>
                </div>
                
                {/* Content Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-[#0d0d0d]/30">
                  
                  {activeTab === 'permissions' && (
                    <div className="flex flex-col h-full animate-in fade-in duration-300">
                      <div className="flex justify-between items-center mb-4">
                        <div className="text-xs text-white/40 uppercase tracking-widest">Access Control</div>
                      </div>
                      
                      <div className="space-y-3 flex-1">
                        {activeMember.permissions?.map(perm => {
                          const isGranted = perm.granted;
                          
                          return (
                            <div 
                              key={perm.id} 
                              className={`p-4 rounded-lg border transition-all duration-300 flex items-center justify-between gap-4 cursor-pointer hover:border-white/30 ${
                                isGranted 
                                  ? 'bg-[#E8AE3C]/5 border-[#E8AE3C]/20' 
                                  : 'bg-white/5 border-white/10'
                              }`}
                              onClick={() => togglePermission(activeMember.id, perm.id)}
                            >
                              <div className="flex-1 min-w-0">
                                <div className={`text-sm font-medium mb-1 transition-colors ${isGranted ? 'text-[#E8AE3C]' : 'text-white/80'}`}>
                                  {perm.label}
                                </div>
                                <div className="text-[11px] text-white/40 leading-relaxed">
                                  {perm.description}
                                </div>
                              </div>
                              
                              {/* Toggle Switch */}
                              <div className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-300 ease-in-out focus:outline-none ${isGranted ? 'bg-[#E8AE3C]' : 'bg-white/20'}`}>
                                <span aria-hidden="true" className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-300 ease-in-out ${isGranted ? 'translate-x-2' : '-translate-x-2'}`} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {activeTab === 'activity' && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      {activeMemberId !== 'current_user' ? (
                        <div className="text-xs text-white/40 italic text-center py-8">
                          This seat hasn&apos;t been activated yet — activity appears once they join and start working.
                        </div>
                      ) : memberActivity === null ? (
                        <div className="text-xs text-white/40 italic text-center py-8">Loading activity…</div>
                      ) : memberActivity.length === 0 ? (
                        <div className="text-xs text-white/40 italic text-center py-8">
                          No recorded activity yet. Deal moves, notes, and viewings will build this timeline automatically.
                        </div>
                      ) : (
                        memberActivity.slice(0, 30).map((act) => (
                          <div key={act.id} className="relative pl-4 border-l border-white/10 pb-4 last:pb-0">
                            <div className="absolute w-2 h-2 rounded-full bg-[#E8AE3C] -left-[4.5px] top-1.5 ring-4 ring-[#121212]"></div>
                            <div className="text-xs text-white/80">
                              <span className="font-medium text-white">{ACTIVITY_LABELS[act.activityType] || act.activityType}</span>
                              {act.propertyTitle ? ` — ${act.propertyTitle}` : ""}
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-white/40 mt-1 uppercase tracking-widest">
                              <Clock size={10} /> {act.createdAt ? new Date(act.createdAt).toLocaleString() : ""}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {activeTab === 'connections' && (
                    <div className="space-y-3 animate-in fade-in duration-300">
                      <div className="text-xs text-white/40 uppercase tracking-widest mb-1">Connection History</div>
                      <p className="text-[11px] text-white/40 leading-relaxed mb-3">
                        Everyone this member is talking to through ScoutIt Connects. Names stay sealed until both sides reveal themselves inside the chatbox.
                      </p>
                      {activeMemberId !== 'current_user' ? (
                        <div className="text-xs text-white/40 italic text-center py-8">
                          This seat hasn&apos;t been activated yet — connections appear once they join.
                        </div>
                      ) : pitches.length === 0 ? (
                        <div className="text-xs text-white/40 italic text-center py-8">
                          No connections on record yet. When a buyer or broker spends a Connect on your portfolio, it shows here.
                        </div>
                      ) : (
                        pitches.map((p) => {
                          const revealed = p.status === 'accepted';
                          return (
                            <div key={p.id} className="p-3 bg-white/5 border border-white/10 rounded-lg flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="text-sm text-white font-medium truncate">
                                  {revealed ? p.brokerName : 'Sealed connection'}
                                </div>
                                <div className="text-[11px] text-white/50 truncate mt-0.5">{p.title}</div>
                                {!revealed && p.status === 'pending' && (
                                  <div className="text-[10px] font-mono uppercase tracking-widest text-[#E8AE3C] mt-1.5 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#E8AE3C] animate-pulse" />
                                    Active temporary chatbox
                                  </div>
                                )}
                              </div>
                              <div className="text-right shrink-0">
                                <span className={`text-[10px] font-mono uppercase tracking-widest ${p.status === 'accepted' ? 'text-green-400' : p.status === 'rejected' ? 'text-red-400' : 'text-[#E8AE3C]'}`}>
                                  {p.statusText}
                                </span>
                                <div className="text-[10px] text-white/40 mt-1">{p.timeRemaining}</div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                  {activeTab === 'tasks' && (
                    <div className="flex flex-col h-full animate-in fade-in duration-300">
                      <div className="flex justify-between items-center mb-4">
                        <div className="text-xs text-white/40 uppercase tracking-widest">Delegated Tasks</div>
                        <button 
                          onClick={() => setIsAssigningTask(!isAssigningTask)}
                          className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded flex items-center gap-1 transition-all ${isAssigningTask ? 'bg-white/10 text-white' : 'bg-[#E8AE3C]/10 text-[#E8AE3C] hover:bg-[#E8AE3C]/20 border border-[#E8AE3C]/20 shadow-[0_0_10px_rgba(232,174,60,0.1)]'}`}
                        >
                          {isAssigningTask ? <X size={12} /> : <Plus size={12} />} 
                          {isAssigningTask ? 'Cancel' : 'Assign Task'}
                        </button>
                      </div>

                      {isAssigningTask && (
                        <form onSubmit={handleAssignTask} className="mb-4 bg-black/40 border border-[#E8AE3C]/30 p-4 rounded-xl flex flex-col gap-3 animate-in fade-in slide-in-from-top-2">
                          <div>
                            <label className="text-[10px] text-white/60 uppercase tracking-widest mb-1 block">Task Name</label>
                            <input 
                              type="text" 
                              required
                              value={newTaskTitle}
                              onChange={(e) => setNewTaskTitle(e.target.value)}
                              placeholder="e.g., Audit building Q3 compliance..." 
                              className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#E8AE3C] transition-colors"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-white/60 uppercase tracking-widest mb-1 block">Due Date</label>
                            <input
                              type="date"
                              value={newTaskDue}
                              onChange={(e) => setNewTaskDue(e.target.value)}
                              className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#E8AE3C] transition-colors [color-scheme:dark]"
                            />
                          </div>
                          <button type="submit" disabled={isSavingTask} className="w-full mt-2 bg-[#E8AE3C] hover:bg-[#F7C64E] disabled:opacity-50 text-black font-medium py-2 rounded-lg text-sm transition-colors">
                            {isSavingTask ? "Saving…" : `Delegate to ${activeMember.name.split(' ')[0]}`}
                          </button>
                        </form>
                      )}

                      {activeMemberId !== 'current_user' ? (
                        <div className="text-xs text-white/40 italic text-center py-8">
                          This seat hasn&apos;t been activated yet — delegate tasks once they join.
                        </div>
                      ) : memberTasks === null ? (
                        <div className="text-xs text-white/40 italic text-center py-8">Loading tasks…</div>
                      ) : (
                        <>
                          {/* Open tasks — persisted crm_tasks rows */}
                          <div className="space-y-2">
                            {memberTasks.filter((t) => !t.completedAt).map((task) => {
                              const overdue = task.dueAt && new Date(task.dueAt) < new Date();
                              return (
                                <div key={task.id} className="group p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-white/20 transition-all flex flex-col gap-2 relative overflow-hidden">
                                  <div className="flex justify-between items-start gap-4">
                                    <div className="text-sm font-medium text-white">
                                      {task.title}
                                      {task.dealTitle && <span className="text-white/40 text-xs font-normal ml-2">· {task.dealTitle}</span>}
                                    </div>
                                    <button
                                      onClick={() => handleMarkTaskDone(task.id)}
                                      className="text-white/30 hover:text-green-400 transition-colors shrink-0"
                                      title="Mark as Done"
                                    >
                                      <CheckCircle size={14} />
                                    </button>
                                  </div>
                                  <div className={`flex items-center gap-1 text-[10px] uppercase tracking-widest ${overdue ? 'text-red-400' : 'text-white/40'}`}>
                                    <AlertCircle size={10} />
                                    {task.dueAt ? `Due ${new Date(task.dueAt).toLocaleDateString()}${overdue ? ' — overdue' : ''}` : 'No due date'}
                                  </div>
                                </div>
                              );
                            })}
                            {memberTasks.filter((t) => !t.completedAt).length === 0 && (
                              <div className="text-xs text-white/40 italic text-center py-6">No open tasks. Everything&apos;s done.</div>
                            )}
                          </div>

                          {/* Task history — completed crm_tasks rows */}
                          {memberTasks.filter((t) => t.completedAt).length > 0 && (
                            <div className="mt-6">
                              <button
                                onClick={() => setShowTaskHistory((s) => !s)}
                                className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-wider text-white/50 hover:text-white transition-colors"
                              >
                                <History size={12} />
                                Task History ({memberTasks.filter((t) => t.completedAt).length})
                                <ChevronDown size={12} className={`transition-transform ${showTaskHistory ? 'rotate-180' : ''}`} />
                              </button>
                              {showTaskHistory && (
                                <div className="space-y-1.5 mt-3 animate-in fade-in">
                                  {memberTasks
                                    .filter((t) => t.completedAt)
                                    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
                                    .map((task) => (
                                      <div key={task.id} className="p-2.5 bg-black/30 border border-white/5 rounded-lg flex items-center justify-between gap-3">
                                        <div className="text-xs text-white/50 line-through truncate">{task.title}</div>
                                        <div className="text-[10px] text-white/30 font-mono shrink-0">
                                          ✓ {new Date(task.completedAt).toLocaleDateString()}
                                        </div>
                                      </div>
                                    ))}
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-white/30 text-sm">
                Select a member
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
