"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { API_PATHS } from "@pc-booking/shared";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import type { PublicUser } from "@/lib/types";

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const data = await api<{ user: PublicUser }>(API_PATHS.auth.login, {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setUser(data.user);
      router.push("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="font-display text-3xl">Log in</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Email">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="field"
          />
        </Field>
        <Field label="Password">
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field"
          />
        </Field>
        {error ? <p className="text-sm text-status-reserved">{error}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-accent py-3 font-medium text-ink-950 hover:bg-accent-dim disabled:opacity-60"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="text-sm text-ink-500">
        No account?{" "}
        <Link href="/register" className="text-accent hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="text-ink-300">{label}</span>
      <div className="[&_.field]:w-full [&_.field]:rounded-lg [&_.field]:border [&_.field]:border-ink-700 [&_.field]:bg-ink-900/80 [&_.field]:px-3 [&_.field]:py-2.5 [&_.field]:text-ink-100 [&_.field]:focus:border-accent">
        {children}
      </div>
    </label>
  );
}
