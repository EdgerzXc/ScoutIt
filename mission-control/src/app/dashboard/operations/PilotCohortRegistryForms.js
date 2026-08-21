"use client";

import { useActionState } from "react";
import {
  changePilotCohortStatus,
  confirmPilotAccountDeletion,
  createPilotCohort,
  enrollPilotParticipant,
  offboardPilotParticipant,
} from "./actions";

const fieldClass = "mt-2 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold";
const buttonClass = "rounded-lg bg-gold px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-gold-bright disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold";

function Result({ state }) {
  if (!state?.message) return null;
  return <p role={state.ok ? "status" : "alert"} className={`rounded-lg border p-3 text-sm ${state.ok ? "border-ok/30 bg-ok/10 text-ok" : "border-danger/30 bg-danger/10 text-danger"}`}>{state.message}</p>;
}

function ConfirmationFields({ phrase, reasonLabel = "Operational reason" }) {
  return <>
    <label className="block text-xs text-white/60">{reasonLabel}<textarea name="reason" required minLength={12} rows={2} className={fieldClass} /></label>
    <label className="block text-xs text-white/60">Type <span className="font-mono text-gold">{phrase}</span><input name="confirmation" required autoComplete="off" className={`${fieldClass} font-mono`} /></label>
  </>;
}

function CreateCohortForm({ phrase }) {
  const [state, action, pending] = useActionState(createPilotCohort, null);
  return <form action={action} className="space-y-4 rounded-lg border border-line bg-black/25 p-4">
    <h3 className="font-medium text-white">Create bounded cohort</h3>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="text-xs text-white/60">Cohort key<input name="cohortKey" required pattern="[a-z0-9][a-z0-9_-]{2,47}" placeholder="pilot_aug_2026" className={`${fieldClass} font-mono`} /></label>
      <label className="text-xs text-white/60">Internal name<input name="name" required minLength={3} maxLength={80} placeholder="August invited pilot" className={fieldClass} /></label>
      <label className="text-xs text-white/60">Starts at (optional)<input type="datetime-local" name="startsAt" className={fieldClass} /></label>
      <label className="text-xs text-white/60">Ends at (optional)<input type="datetime-local" name="endsAt" className={fieldClass} /></label>
    </div>
    <ConfirmationFields phrase={phrase} />
    <Result state={state} />
    <button disabled={pending} className={buttonClass}>{pending ? "Creating…" : "Create cohort"}</button>
  </form>;
}

function EnrollForm({ cohorts, phrase }) {
  const [state, action, pending] = useActionState(enrollPilotParticipant, null);
  const eligible = cohorts.filter((cohort) => ["planned", "active"].includes(cohort.status));
  return <form action={action} className="space-y-4 rounded-lg border border-line bg-black/25 p-4">
    <h3 className="font-medium text-white">Enroll verified tester</h3>
    <p className="text-xs leading-5 text-white/70">The tester must sign in once first. Enter only the Supabase Auth UUID; never enter or store their temporary email here.</p>
    <label className="block text-xs text-white/60">Cohort<select name="cohortId" required className={fieldClass} disabled={!eligible.length}><option value="">Choose cohort</option>{eligible.map((cohort) => <option key={cohort.id} value={cohort.id}>{cohort.name} · {cohort.status}</option>)}</select></label>
    <label className="block text-xs text-white/60">Tester Auth user ID<input name="userId" required placeholder="00000000-0000-0000-0000-000000000000" className={`${fieldClass} font-mono`} /></label>
    <fieldset><legend className="text-xs text-white/60">Pilot roles</legend><div className="mt-2 flex flex-wrap gap-3">{["owner", "seeker", "broker", "provider"].map((role) => <label key={role} className="inline-flex items-center gap-2 rounded border border-line px-3 py-2 text-xs text-white/70"><input type="checkbox" name="roles" value={role} />{role}</label>)}</div></fieldset>
    <ConfirmationFields phrase={phrase} />
    <Result state={state} />
    <button disabled={pending || !eligible.length} className={buttonClass}>{pending ? "Enrolling…" : "Enroll tester"}</button>
  </form>;
}

function CohortLifecycleForm({ cohort, command, phrase }) {
  const [state, action, pending] = useActionState(changePilotCohortStatus, null);
  return <form action={action} className="space-y-3 rounded-lg border border-line bg-black/20 p-3">
    <input type="hidden" name="cohortId" value={cohort.id} /><input type="hidden" name="command" value={command} />
    <ConfirmationFields phrase={phrase} reasonLabel={command === "activate" ? "Activation reason" : "Closure reason"} />
    <Result state={state} /><button disabled={pending} className={buttonClass}>{pending ? "Verifying…" : command === "activate" ? "Activate cohort" : "Close cohort"}</button>
  </form>;
}

function ParticipantAction({ participant, actionKind, phrase }) {
  const serverAction = actionKind === "offboard" ? offboardPilotParticipant : confirmPilotAccountDeletion;
  const [state, action, pending] = useActionState(serverAction, null);
  return <form action={action} className="mt-3 space-y-3 rounded border border-line bg-black/25 p-3">
    <input type="hidden" name="cohortId" value={participant.cohort_id} /><input type="hidden" name="userId" value={participant.user_id} />
    {actionKind === "offboard" && <label className="block text-xs text-white/60">Cleanup note (no personal data)<input name="cleanupNote" maxLength={500} className={fieldClass} /></label>}
    <ConfirmationFields phrase={phrase} reasonLabel={actionKind === "offboard" ? "Offboarding reason" : "Deletion-verification reason"} />
    <Result state={state} /><button disabled={pending} className={buttonClass}>{pending ? "Verifying…" : actionKind === "offboard" ? "Offboard tester" : "Verify Auth deletion"}</button>
  </form>;
}

export default function PilotCohortRegistryForms({ registry, confirmations }) {
  const { cohorts, participants } = registry;
  const byCohort = new Map(cohorts.map((cohort) => [cohort.id, participants.filter((participant) => participant.cohort_id === cohort.id)]));
  return <div className="mt-6 space-y-6">
    <div className="grid gap-4 xl:grid-cols-2"><CreateCohortForm phrase={confirmations.create} /><EnrollForm cohorts={cohorts} phrase={confirmations.enroll} /></div>
    <div className="space-y-4">{cohorts.map((cohort) => {
      const members = byCohort.get(cohort.id) || [];
      const active = members.filter((member) => !member.offboarded_at);
      return <article key={cohort.id} className="rounded-lg border border-line bg-black/20 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-medium text-white">{cohort.name}</h3><p className="mt-1 font-mono text-[12px] text-white/70">{cohort.cohort_key} · {cohort.id}</p></div><span className="label-mono rounded border border-gold-muted/50 px-2 py-1 text-gold">{cohort.status}</span></div>
        <dl className="mt-4 grid gap-3 sm:grid-cols-3"><div><dt className="label-mono text-white/70">Members</dt><dd className="mt-1 text-white/80">{members.length}</dd></div><div><dt className="label-mono text-white/70">Active</dt><dd className="mt-1 text-white/80">{active.length}</dd></div><div><dt className="label-mono text-white/70">Deletion verified</dt><dd className="mt-1 text-white/80">{members.filter((member) => member.account_deleted_at).length}</dd></div></dl>
        {members.length > 0 && <div className="mt-4 space-y-3">{members.map((participant) => <div key={participant.user_id} className="rounded-lg border border-line p-3"><div className="flex flex-wrap justify-between gap-2"><code className="text-xs text-white/65">{participant.user_id}</code><span className="text-xs text-white/70">{participant.roles.join(" · ")}</span></div><p className="mt-2 text-xs text-white/70">{participant.account_deleted_at ? "Auth deletion verified" : participant.offboarded_at ? "Offboarded; Auth deletion pending" : "Active tester"}</p>{!participant.offboarded_at && <ParticipantAction participant={participant} actionKind="offboard" phrase={confirmations.offboard} />}{participant.offboarded_at && !participant.account_deleted_at && <ParticipantAction participant={participant} actionKind="confirmDeletion" phrase={confirmations.confirmDeletion} />}</div>)}</div>}
        {cohort.status === "planned" && <div className="mt-4"><CohortLifecycleForm cohort={cohort} command="activate" phrase={confirmations.activate} /></div>}
        {["planned", "active"].includes(cohort.status) && active.length === 0 && <div className="mt-4"><CohortLifecycleForm cohort={cohort} command="close" phrase={confirmations.close} /></div>}
      </article>;
    })}{!cohorts.length && <p className="rounded-lg border border-line bg-black/20 p-6 text-sm text-white/70">No cohort exists yet. Create the first bounded pilot only after the migration and live recovery evidence are green.</p>}</div>
  </div>;
}

