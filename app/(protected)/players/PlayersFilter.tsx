'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { useRef, useCallback } from 'react';

export default function PlayersFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const formRef = useRef<HTMLFormElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function submit() {
    if (!formRef.current) return;
    const data = new FormData(formRef.current);
    const params = new URLSearchParams();
    for (const [key, value] of data.entries()) {
      if (value) params.set(key, value as string);
    }
    router.push(`/players?${params.toString()}`);
  }

  const debouncedSubmit = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(submit, 300);
  }, []);

  return (
    <form ref={formRef} className="flex gap-2" onSubmit={(e) => { e.preventDefault(); submit(); }}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          name="search"
          defaultValue={searchParams.get('search') ?? ''}
          placeholder="Search by name or phone…"
          className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          onChange={debouncedSubmit}
        />
      </div>
      <select
        name="battingStyle"
        defaultValue={searchParams.get('battingStyle') ?? ''}
        className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        onChange={() => submit()}
      >
        <option value="">All batting</option>
        <option value="Right">Right</option>
        <option value="Left">Left</option>
      </select>
      <select
        name="bowlingStyle"
        defaultValue={searchParams.get('bowlingStyle') ?? ''}
        className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        onChange={() => submit()}
      >
        <option value="">All bowling</option>
        <option value="Fast">Fast</option>
        <option value="Medium">Medium</option>
        <option value="Spin">Spin</option>
      </select>
    </form>
  );
}
