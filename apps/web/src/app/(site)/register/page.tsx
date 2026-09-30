"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState, type ReactNode } from "react";
import { API_PATHS, type UserRole } from "@pc-booking/shared";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import type { PublicUser } from "@/lib/types";
import { useT } from "@/components/locale-provider";

export default function RegisterPage() {
  const router = useRouter();
  const { setUser } = useAuth();
  const t = useT();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("CUSTOMER");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const data = await api<{ user: PublicUser }>(API_PATHS.auth.register, {
        method: "POST",
        body: JSON.stringify({
          name,
          email,
          phone: phone || undefined,
          password,
          role: role === "CAFE_OWNER" ? "CAFE_OWNER" : "CUSTOMER",
        }),
      });
      setUser(data.user);
      router.push(role === "CAFE_OWNER" ? "/owner/cafes/new" : "/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("auth.registerFailed"));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="font-display text-3xl">{t("auth.registerTitle")}</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label={t("auth.name")}>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="field"
          />
        </Field>
        <Field label={t("auth.email")}>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="field"
          />
        </Field>
        <Field label={t("auth.phoneOptional")}>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="field"
            placeholder="+976…"
          />
        </Field>
        <Field label={t("auth.password")}>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field"
          />
        </Field>
        <Field label={t("auth.roleLabel")}>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="field"
          >
            <option value="CUSTOMER">{t("auth.roleCustomer")}</option>
            <option value="CAFE_OWNER">{t("auth.roleOwner")}</option>
          </select>
        </Field>
        {error ? <p className="text-sm text-status-reserved">{error}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-accent py-3 font-medium text-ink-950 hover:bg-accent-dim disabled:opacity-60"
        >
          {pending ? t("auth.creating") : t("auth.signUp")}
        </button>
      </form>
      <p className="text-sm text-ink-500">
        {t("auth.hasAccount")}{" "}
        <Link href="/login" className="text-accent hover:underline">
          {t("auth.signIn")}
        </Link>
      </p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="text-ink-300">{label}</span>
      <div className="[&_.field]:w-full [&_.field]:rounded-lg [&_.field]:border [&_.field]:border-ink-700 [&_.field]:bg-ink-900/80 [&_.field]:px-3 [&_.field]:py-2.5 [&_.field]:text-ink-100 [&_.field]:focus:border-accent">
        {children}
      </div>
    </label>
  );
}
