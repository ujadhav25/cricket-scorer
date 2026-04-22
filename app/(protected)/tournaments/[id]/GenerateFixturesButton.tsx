'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Zap } from 'lucide-react';
import { useToast } from '@/components/ui/toaster';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

interface GenerateFixturesButtonProps {
  tournamentId: string;
  teamCount: number;
  matchCount: number;
  format: string;
}

export function GenerateFixturesButton({ tournamentId, teamCount, matchCount, format }: GenerateFixturesButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  if (format === 'BILATERAL') return null;
  if (teamCount < 2) return null;

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/fixtures`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to generate fixtures');
      toast({ title: `Generated ${data.count} fixtures!`, variant: 'success' });
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  const expectedMatches = format === 'KNOCKOUT'
    ? teamCount - 1
    : (teamCount * (teamCount - 1)) / 2;

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Zap className="mr-1.5 h-4 w-4 text-amber-400" />
        Generate Fixtures
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Generate Fixtures</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {matchCount > 0 ? (
              <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-400">
                ⚠️ {matchCount} match{matchCount > 1 ? 'es' : ''} already exist. Generating will add remaining fixtures.
              </div>
            ) : null}
            <p className="text-sm text-muted-foreground">
              {format === 'KNOCKOUT'
                ? `This will create ${expectedMatches} knockout match${expectedMatches > 1 ? 'es' : ''} for ${teamCount} teams (single-elimination bracket).`
                : `This will create a round-robin schedule with ${expectedMatches} matches for ${teamCount} teams.`
              }
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancel</Button>
              <Button className="flex-1 bg-cricket-green hover:bg-cricket-green/90" onClick={generate} disabled={loading}>
                {loading ? 'Generating…' : 'Generate'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
