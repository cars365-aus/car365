"use client";

import { useState } from "react";
import { createApiKey, revokeApiKey } from "@/app/vendor/settings/api-key-actions";
import { Key, Plus, Trash2, Loader2 } from "lucide-react";

type ApiKeyRow = {
  id: string;
  label: string;
  key_prefix: string;
  created_at: string;
  last_used_at: string | null;
  revoked: boolean;
};

interface ApiKeysPanelProps {
  organizationId: string;
  keys: ApiKeyRow[];
  hasAccess: boolean;
}

export function ApiKeysPanel({ organizationId, keys, hasAccess }: ApiKeysPanelProps) {
  const [newKey, setNewKey] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!hasAccess) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900">API access</h2>
        <p className="mt-2 text-sm text-slate-500">
          Fleet API keys are available on the Pro plan.{" "}
          <a href="/vendor/billing?plan=pro" className="font-semibold text-[#ea580c] hover:underline">
            Upgrade to Pro
          </a>
        </p>
      </div>
    );
  }

  async function handleCreate() {
    setIsCreating(true);
    setError(null);
    try {
      const result = await createApiKey(organizationId, label || "Default");
      setNewKey(result.key);
      setLabel("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create key");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleRevoke(keyId: string) {
    setRevokingId(keyId);
    setError(null);
    try {
      await revokeApiKey(keyId, organizationId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to revoke key");
    } finally {
      setRevokingId(null);
    }
  }

  const activeKeys = keys.filter((k) => !k.revoked);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
          <Key className="h-4.5 w-4.5 text-slate-600" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">API keys</h2>
          <p className="text-xs text-slate-400">
            Sync your fleet via{" "}
            <a href="/for-vendors/api" className="text-[#ea580c] hover:underline">
              REST API docs
            </a>
          </p>
        </div>
      </div>

      {newKey && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
          <p className="font-bold text-amber-900">Copy your new API key now — it won&apos;t be shown again:</p>
          <code className="mt-2 block break-all rounded-lg bg-white px-3 py-2 font-mono text-xs border border-amber-200">
            {newKey}
          </code>
        </div>
      )}

      {error && (
        <p className="mb-4 text-sm text-red-600">{error}</p>
      )}

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Key label (e.g. Fleet sync)"
          className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={handleCreate}
          disabled={isCreating}
          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Create key
        </button>
      </div>

      {activeKeys.length === 0 ? (
        <p className="text-sm text-slate-500">No active API keys.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {activeKeys.map((key) => (
            <li key={key.id} className="flex items-center justify-between py-3 text-sm">
              <div>
                <p className="font-semibold text-slate-900">{key.label}</p>
                <p className="text-xs text-slate-400 font-mono">{key.key_prefix}••••••••</p>
              </div>
              <button
                type="button"
                onClick={() => handleRevoke(key.id)}
                disabled={revokingId === key.id}
                className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                {revokingId === key.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                Revoke
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
