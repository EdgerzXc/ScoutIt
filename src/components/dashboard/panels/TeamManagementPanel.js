"use client";

import { useState, useEffect } from "react";
import { Users, Shield, Clock, X, ChevronDown, Check, Activity, Mail, CheckSquare, Plus, AlertCircle, Key, CheckCircle } from "lucide-react";
import { useDashboard } from "../../../context/DashboardContext";

const ROLES = ["Admin", "Head of Finances", "Location Manager", "Agent", "Viewer"];

export default function TeamManagementPanel({ currentUser = null, properties = [] }) {
  const { addToast } = useDashboard();
  const [teamList, setTeamList] = useState([]);
  
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

    // Inject the real user
    if (currentUser) {
      list.push({
        id: "current_user",
        name: currentUser.user_metadata?.full_name || currentUser.email || "You",
        email: currentUser.email || "user@scoutit.com",
        role: "Admin",
        avatar: currentUser.user_metadata?.avatar_url || "https://picsum.photos/seed/admin/100/100",
        lastActive: "Just now",
        activities: [
          { id: 1, action: "Approved Listing", target: properties.length > 0 ? properties[0].title : "One Roxas Triangle", time: "10 mins ago" },
          { id: 2, action: "Invited Member", target: "sarah@scoutit.com", time: "2 hrs ago" },
        ],
        tasks: [
          { id: 1, title: "Review Q3 Expansion Strategy", status: "To Do", priority: "High", due: "Today" },
          { id: 2, title: "Approve Enterprise Contracts", status: "In Progress", priority: "Medium", due: "Tomorrow" },
          { id: 3, title: "Weekly Sync with Finances", status: "Done", priority: "Low", due: "Yesterday" }
        ],
        permissions: defaultPermissions.map(p => ({ ...p, granted: true }))
      });
    }

    // Add logical dummy data
    list.push({
      id: "user_2",
      name: "Sarah Chen",
      email: "sarah@scoutit.com",
      role: "Head of Finances",
      avatar: "https://picsum.photos/seed/sarah/100/100",
      lastActive: "2 hours ago",
      activities: [
        { id: 1, action: "Exported Report", target: "Q3 Revenue Projections", time: "2 hrs ago" },
        { id: 2, action: "Updated Billing", target: "Corporate Card ending in 4421", time: "3 hrs ago" },
      ],
      tasks: [
        { id: 1, title: "Export Weekly Revenue Report", status: "Done", priority: "High", due: "Yesterday" },
        { id: 2, title: "Audit Commission Payouts", status: "In Progress", priority: "High", due: "Today" },
        { id: 3, title: "Prepare Q4 Budget Forecast", status: "To Do", priority: "Medium", due: "Next Week" }
      ],
      permissions: defaultPermissions.map(p => ({ 
        ...p, 
        granted: ["view_financials", "manage_finance", "export_data"].includes(p.id) 
      }))
    });

    list.push({
      id: "user_3",
      name: "David Park",
      email: "david@scoutit.com",
      role: "Location Manager",
      avatar: "https://picsum.photos/seed/david/100/100",
      lastActive: "1 day ago",
      activities: [
        { id: 1, action: "Connected with", target: "John Doe (Broker)", time: "1 day ago" },
        { id: 2, action: "Updated Details", target: properties.length > 1 ? properties[1].title : "BGC Corporate Center", time: "2 days ago" },
      ],
      tasks: [
        { id: 1, title: "Onboard new BGC building", status: "To Do", priority: "High", due: "Tomorrow" },
        { id: 2, title: "Update Floor Plans for Tower A", status: "To Do", priority: "Medium", due: "Next Week" }
      ],
      permissions: defaultPermissions.map(p => ({ 
        ...p, 
        granted: ["manage_listings", "delegate_units", "publish_airtable", "manage_projects"].includes(p.id) 
      }))
    });

    // Set state
    setTeamList(list);
  }, [currentUser, properties]);

  const [activeMemberId, setActiveMemberId] = useState("user_2");
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [activeTab, setActiveTab] = useState("permissions"); // "activity" | "tasks" | "permissions"
  
  // Task assignment state
  const [isAssigningTask, setIsAssigningTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("Medium");
  const [newTaskDue, setNewTaskDue] = useState("");

  const activeMember = teamList.find(m => m.id === activeMemberId) || teamList[0];

  const handleAssignTask = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask = {
      id: Date.now(),
      title: newTaskTitle,
      status: "To Do",
      priority: newTaskPriority,
      due: newTaskDue || "No Date"
    };

    setTeamList(prev => prev.map(m => 
      m.id === activeMemberId ? { ...m, tasks: [newTask, ...(m.tasks || [])] } : m
    ));

    addToast(`Delegated "${newTaskTitle}" to ${activeMember.name.split(" ")[0]}`, "✅");

    setIsAssigningTask(false);
    setNewTaskTitle("");
    setNewTaskPriority("Medium");
    setNewTaskDue("");
  };

  const handleMarkTaskDone = (taskId) => {
    setTeamList(prev => prev.map(m => 
      m.id === activeMemberId 
        ? { ...m, tasks: m.tasks.map(t => t.id === taskId ? { ...t, status: "Done" } : t) }
        : m
    ));
    addToast("Task marked as Done", "✅");
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case "High": return "text-red-400 border-red-400/30 bg-red-400/10";
      case "Medium": return "text-yellow-400 border-yellow-400/30 bg-yellow-400/10";
      case "Low": return "text-green-400 border-green-400/30 bg-green-400/10";
      default: return "text-white/50 border-white/10 bg-white/5";
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case "Done": return "text-[#E8AE3C] opacity-50 line-through";
      case "In Progress": return "text-white";
      case "To Do": return "text-white";
      default: return "text-white/50";
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
      avatar: `https://picsum.photos/seed/${inviteEmail}/100/100`,
      lastActive: "Just joined",
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
          <div className="w-1/2 border-r border-white/5 flex flex-col">
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
                  onClick={() => { setActiveMemberId(member.id); setEditingRoleId(null); }}
                  className={`p-3 rounded-lg cursor-pointer transition-all flex items-center gap-3 border ${
                    activeMemberId === member.id 
                      ? 'bg-white/10 border-white/20' 
                      : 'bg-transparent border-transparent hover:bg-white/5'
                  }`}
                >
                  <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <div className="text-sm text-white font-medium truncate">{member.name}</div>
                      {/* Task Load Indicator */}
                      {member.tasks?.filter(t => t.status !== "Done").length > 0 && (
                        <div className="text-[9px] font-mono bg-[#E8AE3C]/20 text-[#E8AE3C] px-1.5 py-0.5 rounded">
                          {member.tasks.filter(t => t.status !== "Done").length} Tasks
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
          <div className="w-1/2 md:w-2/3 flex flex-col bg-surface/50 border-l border-white/5">
            {activeMember ? (
              <>
                <div className="p-6 border-b border-white/5 flex flex-col items-center text-center relative">
                  <img src={activeMember.avatar} alt={activeMember.name} className="w-20 h-20 rounded-full object-cover border-2 border-white/10 shadow-lg mb-4" />
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
                          const overrideKey = `${activeMember.id}_${perm.id}`;
                          const isGranted = permissionOverrides[overrideKey] !== undefined ? permissionOverrides[overrideKey] : perm.granted;
                          
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
                      {activeMember.activities.map(act => (
                        <div key={act.id} className="relative pl-4 border-l border-white/10 pb-4 last:pb-0">
                          <div className="absolute w-2 h-2 rounded-full bg-[#E8AE3C] -left-[4.5px] top-1.5 ring-4 ring-[#121212]"></div>
                          <div className="text-xs text-white/80">
                            <span className="font-medium text-white">{act.action}</span> {act.target}
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-white/40 mt-1 uppercase tracking-widest">
                            <Clock size={10} /> {act.time}
                          </div>
                        </div>
                      ))}
                      {activeMember.activities.length === 0 && (
                        <div className="text-xs text-white/40 italic">No recent activity.</div>
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
                          <div className="flex gap-3">
                            <div className="flex-1">
                              <label className="text-[10px] text-white/60 uppercase tracking-widest mb-1 block">Priority</label>
                              <select 
                                value={newTaskPriority}
                                onChange={(e) => setNewTaskPriority(e.target.value)}
                                className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#E8AE3C] transition-colors"
                              >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                                <option value="Urgent">Urgent</option>
                              </select>
                            </div>
                            <div className="flex-1">
                              <label className="text-[10px] text-white/60 uppercase tracking-widest mb-1 block">Due Date</label>
                              <input 
                                type="text" 
                                value={newTaskDue}
                                onChange={(e) => setNewTaskDue(e.target.value)}
                                placeholder="e.g., Next Friday" 
                                className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#E8AE3C] transition-colors"
                              />
                            </div>
                          </div>
                          <button type="submit" className="w-full mt-2 bg-[#E8AE3C] hover:bg-[#F7C64E] text-black font-medium py-2 rounded-lg text-sm transition-colors">
                            Delegate to {activeMember.name.split(' ')[0]}
                          </button>
                        </form>
                      )}

                      <div className="space-y-2 flex-1">
                        {activeMember.tasks?.map(task => (
                          <div key={task.id} className="group p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-white/20 transition-all flex flex-col gap-2 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#E8AE3C]/5 to-transparent -translate-x-[100%] group-hover:animate-shimmer" />
                            <div className="flex justify-between items-start gap-4 relative z-10">
                              <div className={`text-sm font-medium ${getStatusColor(task.status)}`}>
                                {task.title}
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {task.status !== "Done" && (
                                  <button 
                                    onClick={() => handleMarkTaskDone(task.id)}
                                    className="text-white/30 hover:text-green-400 transition-colors"
                                    title="Mark as Done"
                                  >
                                    <CheckCircle size={14} />
                                  </button>
                                )}
                                <span className={`text-[9px] uppercase tracking-wider font-mono px-1.5 py-0.5 rounded border ${getPriorityColor(task.priority)}`}>
                                  {task.priority}
                                </span>
                              </div>
                            </div>
                            <div className="flex justify-between items-center relative z-10">
                              <div className="flex items-center gap-1 text-[10px] text-white/40 uppercase tracking-widest">
                                <AlertCircle size={10} /> Due: {task.due}
                              </div>
                              <div className="text-[10px] font-mono text-white/30 border border-white/10 px-1 rounded">
                                {task.status}
                              </div>
                            </div>
                          </div>
                        ))}
                        {(!activeMember.tasks || activeMember.tasks.length === 0) && (
                          <div className="text-xs text-white/40 italic text-center py-8">No tasks delegated yet.</div>
                        )}
                      </div>
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
