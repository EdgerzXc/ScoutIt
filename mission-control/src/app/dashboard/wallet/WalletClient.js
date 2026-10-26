"use client";

import { useState, useTransition } from "react";
import { lookupUserWallet, refundConnectsAction, grantDiscretionaryConnectsAction } from "./actions";
import { formatTransactionKind } from "@/lib/walletPolicy.mjs";
import { Search, Coins, ArrowDownLeft, ShieldAlert, CheckCircle2, AlertCircle, RefreshCw, PlusCircle } from "lucide-react";

export default function WalletClient({ staffTier }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [data, setData] = useState(null);
  const [, startTransition] = useTransition();

  // Refund Modal state
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState(1);
  const [refundReason, setRefundReason] = useState("");
  const [refundRefId, setRefundRefId] = useState("");
  const [modalLoading, setModalLoading] = useState(false);

  // Grant Modal state
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [grantAmount, setGrantAmount] = useState(10);
  const [grantReason, setGrantReason] = useState("");
  const [grantRole, setGrantRole] = useState("seeker");

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;

    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const res = await lookupUserWallet({ query: query.trim() });
      if (res.error) {
        setError(res.error);
        setData(null);
      } else {
        setData(res);
      }
    } catch (err) {
      setError(err.message || "Failed to query wallet.");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteRefund = async (e) => {
    e.preventDefault();
    if (!data?.user?.id) return;

    setError(null);
    setSuccess(null);
    setModalLoading(true);

    try {
      const res = await refundConnectsAction({
        userId: data.user.id,
        amount: Number(refundAmount),
        reason: refundReason.trim(),
        refId: refundRefId.trim() || null,
      });

      if (res.error) {
        setError(res.error);
      } else {
        setSuccess(`Successfully credited ${res.amount} Connects to ${data.user.displayName}.`);
        setShowRefundModal(false);
        setRefundReason("");
        setRefundRefId("");
        // Reload wallet
        startTransition(() => {
          handleSearch();
        });
      }
    } catch (err) {
      setError(err.message || "Refund execution failed.");
    } finally {
      setModalLoading(false);
    }
  };

  const handleExecuteGrant = async (e) => {
    e.preventDefault();
    if (!data?.user?.id) return;

    setError(null);
    setSuccess(null);
    setModalLoading(true);

    try {
      const res = await grantDiscretionaryConnectsAction({
        userId: data.user.id,
        amount: Number(grantAmount),
        reason: grantReason.trim(),
        role: grantRole,
      });

      if (res.error) {
        setError(res.error);
      } else {
        setSuccess(`Successfully granted ${res.amount} Connects to ${data.user.displayName}.`);
        setShowGrantModal(false);
        setGrantReason("");
        // Reload wallet
        startTransition(() => {
          handleSearch();
        });
      }
    } catch (err) {
      setError(err.message || "Grant execution failed.");
    } finally {
      setModalLoading(false);
    }
  };

  const isOpsManager = staffTier >= 2;
  const isSuperAdmin = staffTier >= 3;

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="p-6 rounded-xl border border-line bg-surface">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-white/60" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by User UUID or Email Address..."
              className="w-full pl-10 pr-4 py-2 bg-black/60 border border-line rounded-lg text-sm text-white placeholder-white/40 focus:outline-none focus:border-gold"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-6 py-2 rounded-lg bg-gold text-black font-medium text-xs uppercase tracking-wider hover:bg-gold/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Lookup Wallet"}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mt-4 p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-mono flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}
      </div>

      {data && (
        <div className="space-y-6">
          {/* User & Wallet Overview Card */}
          <div className="p-6 rounded-xl border border-line bg-surface">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-line">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-white/60">
                    Account Ledger Record
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs font-mono uppercase tracking-wider bg-gold/10 text-gold border border-gold/30">
                    {data.wallet.authority} Authority
                  </span>
                </div>
                <h2 className="text-xl font-medium tracking-tight text-white mt-1">
                  {data.user.displayName}
                </h2>
                <div className="text-xs font-mono text-white/60 mt-1 flex flex-wrap gap-4">
                  <span>UUID: {data.user.id}</span>
                  <span>Email: {data.user.email}</span>
                  <span>Plan: {data.user.subscriptionTier}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {isOpsManager && (
                  <button
                    onClick={() => setShowRefundModal(true)}
                    className="px-4 py-2 rounded-lg border border-gold/40 bg-gold/10 text-gold text-xs font-medium uppercase tracking-wider hover:bg-gold/20 transition-colors flex items-center gap-2"
                  >
                    <ArrowDownLeft className="w-4 h-4" />
                    System Refund
                  </button>
                )}
                {isSuperAdmin && (
                  <button
                    onClick={() => setShowGrantModal(true)}
                    className="px-4 py-2 rounded-lg border border-line hover:border-gold/40 bg-black/40 text-xs font-mono text-white hover:text-gold transition-colors flex items-center gap-2"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Discretionary Grant
                  </button>
                )}
              </div>
            </div>

            {/* Balances Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              <div className="p-4 rounded-lg border border-gold/30 bg-gold/5">
                <div className="text-xs font-mono uppercase tracking-wider text-gold/80">
                  Spendable Balance
                </div>
                <div className="text-2xl font-mono text-gold font-medium mt-1">
                  {data.wallet.spendable}
                </div>
                <div className="text-xs text-white/60 mt-1">Total active Connects</div>
              </div>

              <div className="p-4 rounded-lg border border-line bg-black/40">
                <div className="text-xs font-mono uppercase tracking-wider text-white/60">
                  Purchased
                </div>
                <div className="text-2xl font-mono text-white font-medium mt-1">
                  {data.wallet.purchased}
                </div>
                <div className="text-xs text-white/60 mt-1">Permanent balance</div>
              </div>

              <div className="p-4 rounded-lg border border-line bg-black/40">
                <div className="text-xs font-mono uppercase tracking-wider text-white/60">
                  Rewards
                </div>
                <div className="text-2xl font-mono text-white font-medium mt-1">
                  {data.wallet.rewards}
                </div>
                <div className="text-xs text-white/60 mt-1">Earned bounties</div>
              </div>

              <div className="p-4 rounded-lg border border-line bg-black/40">
                <div className="text-xs font-mono uppercase tracking-wider text-white/60">
                  Monthly Grants
                </div>
                <div className="text-2xl font-mono text-white font-medium mt-1">
                  {data.wallet.grants}
                </div>
                <div className="text-xs text-white/60 mt-1">Role tier allotment</div>
              </div>
            </div>

            {data.wallet.holds?.length > 0 && (
              <div className="mt-4 p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-mono flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
                <span>Active reconciliation hold on account: balance migration verification pending.</span>
              </div>
            )}
          </div>

            {/* Transactions Ledger */}
          <div className="p-6 rounded-xl border border-line bg-surface">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-white/60">
                  Audit History
                </span>
                <h3 className="text-base font-medium text-white">Connects Transaction Ledger</h3>
              </div>
              <span className="text-xs font-mono text-white/60">{data.transactions.length} rows</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-line text-white/60 font-mono text-xs uppercase tracking-wider">
                    <th className="pb-2">Timestamp</th>
                    <th className="pb-2">Type</th>
                    <th className="pb-2">Role</th>
                    <th className="pb-2 text-right">Amount</th>
                    <th className="pb-2 pl-4">Reason &amp; Source</th>
                    <th className="pb-2">Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/40">
                  {data.transactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-white/60 font-mono">
                        No recorded ledger transactions for this account.
                      </td>
                    </tr>
                  ) : (
                    data.transactions.map((tx) => {
                      const kindInfo = formatTransactionKind(tx.kind);
                      return (
                        <tr key={tx.id} className="hover:bg-white/[0.02]">
                          <td className="py-2.5 font-mono text-white/60">
                            {new Date(tx.createdAt).toLocaleString("en-US", {
                              month: "short",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="py-2.5">
                            <span className="font-mono uppercase text-xs px-1.5 py-0.5 rounded bg-white/5 text-white/80">
                              {kindInfo.label}
                            </span>
                          </td>
                          <td className="py-2.5 font-mono text-white/60">{tx.role}</td>
                          <td className={`py-2.5 text-right font-mono font-medium ${
                            kindInfo.sign === "+" ? "text-emerald-400" : "text-rose-400"
                          }`}>
                            {kindInfo.sign}{tx.amount}
                          </td>
                          <td className="py-2.5 pl-4 max-w-xs truncate text-white/80">
                            {tx.reason || tx.source}
                          </td>
                          <td className="py-2.5 font-mono text-xs text-white/60 truncate max-w-[120px]">
                            {tx.referenceId || "—"}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* System Refund Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-xl border border-line bg-surface space-y-4">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-gold" />
              <h3 className="text-base font-medium text-white">Issue System-Error Refund</h3>
            </div>
            <p className="text-xs text-white/60">
              Policy §38.3: Refunds are granted ONLY for verifiable ScoutIt system errors (e.g., failed delivery, double debit).
            </p>

            <form onSubmit={handleExecuteRefund} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-white/70 mb-1">
                  Refund Amount (Connects)
                </label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-black/60 border border-line rounded-lg text-sm font-mono text-white focus:outline-none focus:border-gold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-white/70 mb-1">
                  Justification / System Error Details (Min 10 chars)
                </label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Detail the verifiable platform glitch, double-charge ID, or failed delivery..."
                  rows={3}
                  className="w-full px-3 py-2 bg-black/60 border border-line rounded-lg text-xs text-white placeholder-white/40 focus:outline-none focus:border-gold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-white/70 mb-1">
                  Incident Reference ID (Optional)
                </label>
                <input
                  type="text"
                  value={refundRefId}
                  onChange={(e) => setRefundRefId(e.target.value)}
                  placeholder="INC-2026-xxxx or tx reference"
                  className="w-full px-3 py-2 bg-black/60 border border-line rounded-lg text-xs font-mono text-white placeholder-white/40 focus:outline-none focus:border-gold"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowRefundModal(false)}
                  className="px-4 py-2 rounded-lg border border-line text-xs font-mono text-white/70 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading || refundReason.trim().length < 10}
                  className="px-5 py-2 rounded-lg bg-gold text-black font-medium text-xs uppercase tracking-wider hover:bg-gold/90 transition-colors disabled:opacity-50"
                >
                  {modalLoading ? "Crediting..." : "Confirm Refund"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Discretionary Grant Modal (Super Admin) */}
      {showGrantModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-xl border border-line bg-surface space-y-4">
            <div className="flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-gold" />
              <h3 className="text-base font-medium text-white">Discretionary Connects Grant</h3>
            </div>
            <p className="text-xs text-white/60">
              Super Admin authority: Issue promotional, compensation, or founding partner bonus Connects.
            </p>

            <form onSubmit={handleExecuteGrant} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-white/70 mb-1">
                  Grant Amount
                </label>
                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={grantAmount}
                  onChange={(e) => setGrantAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-black/60 border border-line rounded-lg text-sm font-mono text-white focus:outline-none focus:border-gold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-white/70 mb-1">
                  Target Role Wallet
                </label>
                <select
                  value={grantRole}
                  onChange={(e) => setGrantRole(e.target.value)}
                  className="w-full px-3 py-2 bg-black/60 border border-line rounded-lg text-xs font-mono text-white focus:outline-none focus:border-gold"
                >
                  <option value="seeker">Seeker</option>
                  <option value="owner">Owner</option>
                  <option value="broker">Broker</option>
                  <option value="developer">Developer</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-white/70 mb-1">
                  Reason / Purpose (Min 5 chars)
                </label>
                <textarea
                  value={grantReason}
                  onChange={(e) => setGrantReason(e.target.value)}
                  placeholder="Partner promotion, customer delight, service onboarding bonus..."
                  rows={3}
                  className="w-full px-3 py-2 bg-black/60 border border-line rounded-lg text-xs text-white placeholder-white/40 focus:outline-none focus:border-gold"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowGrantModal(false)}
                  className="px-4 py-2 rounded-lg border border-line text-xs font-mono text-white/70 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading || grantReason.trim().length < 5}
                  className="px-5 py-2 rounded-lg bg-gold text-black font-medium text-xs uppercase tracking-wider hover:bg-gold/90 transition-colors disabled:opacity-50"
                >
                  {modalLoading ? "Granting..." : "Execute Grant"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
