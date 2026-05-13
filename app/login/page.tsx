'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, type FormEvent } from 'react';
import { Button } from '@/components/Button';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });
      const result = (await response.json()) as { ok: boolean; error?: string };

      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? 'Login failed');
      }

      router.replace(searchParams.get('next') || '/inventory');
      router.refresh();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-page px-6 py-10 text-primaryText">
      <section className="w-full max-w-[380px] rounded-xl border border-border bg-white p-5 shadow-soft">
        <div className="mb-5">
          <h1 className="font-title text-[22px] font-semibold">GT Orders & Stocks</h1>
          <p className="mt-1 text-sm text-secondaryText">Internal role login</p>
        </div>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-primaryText">Username</span>
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="h-[34px] w-full rounded-md border border-border bg-white px-3 text-sm text-primaryText"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-primaryText">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-[34px] w-full rounded-md border border-border bg-white px-3 text-sm text-primaryText"
            />
          </label>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              {error}
            </div>
          ) : null}

          <Button type="submit" variant="primary" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Login'}
          </Button>
        </form>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
