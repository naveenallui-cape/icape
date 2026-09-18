"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/api";
import { OLYMPIAD_YEAR_LABEL } from "@/lib/registration-announcement";

type PublicationState = {
  published: boolean;
  publishedAt: string | null;
  updatedAt: string;
};

export default function AdminSettingsPage() {
  const [state, setState] = useState<PublicationState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    const res = await apiRequest<PublicationState>("/results/admin/publication");
    setLoading(false);
    if (!res.success || !res.data) {
      setError(res.message || "Could not load publication status");
      return;
    }
    setState(res.data);
  }

  useEffect(() => {
    void load();
  }, []);

  async function setPublished(published: boolean) {
    setSaving(true);
    setError("");
    setMessage("");
    const res = await apiRequest<PublicationState>("/results/admin/publication", {
      method: "PATCH",
      body: { published },
    });
    setSaving(false);
    if (!res.success || !res.data) {
      setError(res.message || "Could not update publication status");
      return;
    }
    setState(res.data);
    setMessage(res.message);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand">Settings</h1>
        <p className="mt-1 text-sm text-muted">
          Control when schools and the public can view olympiad results.
        </p>
      </div>

      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-brand">Result release</h2>
        <p className="mt-1 text-sm text-muted">
          Olympiad Year {OLYMPIAD_YEAR_LABEL}. Uploading or editing results in
          admin does not make them visible until you publish.
        </p>

        {loading ? (
          <p className="mt-4 text-sm text-muted">Loading…</p>
        ) : (
          <div className="mt-5 space-y-4">
            <div
              className={
                state?.published
                  ? "rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900"
                  : "rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
              }
            >
              <p className="font-semibold">
                {state?.published
                  ? "Results are published"
                  : "Results are not published"}
              </p>
              <p className="mt-1">
                {state?.published
                  ? "Schools and public student lookup can see results."
                  : "Schools and public student lookup cannot see results yet."}
              </p>
              {state?.publishedAt ? (
                <p className="mt-1 text-xs opacity-80">
                  Released{" "}
                  {new Date(state.publishedAt).toLocaleString("en-IN")}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              {state?.published ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={saving}
                  onClick={() => void setPublished(false)}
                >
                  {saving ? "Updating…" : "Unpublish results"}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="accent"
                  disabled={saving}
                  onClick={() => void setPublished(true)}
                >
                  {saving ? "Updating…" : "Publish results"}
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                disabled={loading || saving}
                onClick={() => void load()}
              >
                Refresh
              </Button>
            </div>
          </div>
        )}

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        {message ? <p className="mt-3 text-sm text-green-700">{message}</p> : null}
      </section>
    </div>
  );
}
