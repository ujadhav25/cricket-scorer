'use client';

import { Button } from '@/components/ui/button';
import { analytics } from '@/lib/analytics';

interface Props {
  formAction: () => Promise<void>;
}

export default function SignOutButton({ formAction }: Props) {
  return (
    <form action={formAction}>
      <Button
        type="submit"
        variant="destructive"
        className="w-full"
        onClick={() => analytics.logout()}
      >
        Sign Out
      </Button>
    </form>
  );
}
