'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Users, CheckCircle2, LogIn, ArrowLeft } from 'lucide-react';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
  battingStyle: z.enum(['Right', 'Left']),
  bowlingStyle: z.enum(['Fast', 'Spin', 'Medium']),
});
type FormData = z.infer<typeof schema>;

export default function JoinTeamPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();

  const [team, setTeam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [joined, setJoined] = useState(false);
  const [joinedName, setJoinedName] = useState('');
  const [serverError, setServerError] = useState('');
  const [battingStyle, setBattingStyle] = useState<'Right' | 'Left'>('Right');
  const [bowlingStyle, setBowlingStyle] = useState<'Fast' | 'Spin' | 'Medium'>('Medium');

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { battingStyle: 'Right', bowlingStyle: 'Medium' },
  });

  // Fetch team info
  useEffect(() => {
    fetch(`/api/join/team/${token}`)
      .then(async (r) => {
        if (!r.ok) { setNotFound(true); return; }
        setTeam(await r.json());
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [token]);

  // Auto-fill form from logged-in user's profile
  useEffect(() => {
    if (!session?.user) return;
    fetch('/api/profile')
      .then((r) => r.ok ? r.json() : null)
      .then((profile) => {
        if (!profile) return;
        reset({
          name: profile.name ?? '',
          phone: profile.phone ?? '',
          battingStyle: 'Right',
          bowlingStyle: 'Medium',
        });
      })
      .catch(() => {});
  }, [session, reset]);

  async function onSubmit(data: FormData) {
    setSaving(true);
    setServerError('');
    try {
      const res = await fetch(`/api/join/team/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        setServerError(result.error ?? 'Failed to join team');
        return;
      }
      setJoinedName(result.player.name);
      setJoined(true);
    } catch {
      setServerError('Network error, please try again');
    } finally {
      setSaving(false);
    }
  }

  if (loading || sessionStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background p-4">
        <button onClick={() => router.back()} className="absolute top-4 left-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <h1 className="text-2xl font-bold">Invalid Invite Link</h1>
        <p className="text-muted-foreground">This invite link is no longer valid.</p>
      </div>
    );
  }

  // Not logged in — show login prompt
  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <button onClick={() => router.back()} className="absolute top-4 left-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="w-full max-w-sm space-y-6">
          {/* Team header */}
          <div className="flex items-center gap-4">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-full text-xl font-bold text-white shrink-0"
              style={{ backgroundColor: team?.color ?? '#16a34a' }}
            >
              {team?.name?.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold">{team?.name}</h1>
              {team?.homeGround && <p className="text-sm text-muted-foreground">{team.homeGround}</p>}
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                <Users className="h-3.5 w-3.5" /> {team?._count?.players ?? 0} players
              </p>
            </div>
          </div>

          <Card>
            <CardContent className="pt-6 space-y-4 text-center">
              <LogIn className="h-10 w-10 mx-auto text-cricket-green" />
              <div>
                <p className="font-semibold">Sign in to join this team</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your profile details will be pre-filled automatically.
                </p>
              </div>
              <Button
                className="w-full bg-cricket-green hover:bg-cricket-green/90"
                onClick={() => router.push(`/login?callbackUrl=/join/team/${token}`)}
              >
                Sign In
              </Button>
              <Button variant="outline" className="w-full" onClick={() => router.push(`/signup?callbackUrl=/join/team/${token}`)}>
                Create Account
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (joined) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-background p-4">
        <CheckCircle2 className="h-16 w-16 text-cricket-green" />
        <div className="text-center">
          <h1 className="text-2xl font-bold">You're in!</h1>
          <p className="text-muted-foreground mt-1">
            <span className="font-semibold text-foreground">{joinedName}</span> has joined{' '}
            <span className="font-semibold text-foreground">{team?.name}</span>.
          </p>
        </div>
        <Button className="bg-cricket-green hover:bg-cricket-green/90" onClick={() => router.push('/teams')}>Go to Teams</Button>
        <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <button onClick={() => router.back()} className="absolute top-4 left-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <div className="w-full max-w-sm space-y-6">
        {/* Team header */}
        <div className="flex items-center gap-4">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full text-xl font-bold text-white shrink-0"
            style={{ backgroundColor: team?.color ?? '#16a34a' }}
          >
            {team?.name?.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold">{team?.name}</h1>
            {team?.homeGround && <p className="text-sm text-muted-foreground">{team.homeGround}</p>}
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
              <Users className="h-3.5 w-3.5" /> {team?._count?.players ?? 0} players
            </p>
          </div>
        </div>

        {/* Logged-in user pill */}
        <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-cricket-green text-black text-xs font-bold shrink-0">
            {session.user.name?.slice(0, 1).toUpperCase() ?? '?'}
          </div>
          <span className="flex-1 truncate text-foreground font-medium">{session.user.name ?? session.user.email}</span>
          <span className="text-xs text-muted-foreground">Signed in</span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Confirm your details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label>Your Name *</Label>
                <Input {...register('name')} className="mt-1" />
                {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <Label>Phone <span className="text-xs text-muted-foreground font-normal">(optional)</span></Label>
                <Input {...register('phone')} placeholder="+91 9876543210" className="mt-1" />
              </div>
              <div>
                <Label>Batting</Label>
                <Select
                  value={battingStyle}
                  onValueChange={(v) => { setBattingStyle(v as 'Right' | 'Left'); setValue('battingStyle', v as 'Right' | 'Left'); }}
                >
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Right">Right-hand</SelectItem>
                    <SelectItem value="Left">Left-hand</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Bowling</Label>
                <Select
                  value={bowlingStyle}
                  onValueChange={(v) => { setBowlingStyle(v as any); setValue('bowlingStyle', v as any); }}
                >
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fast">Fast</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Spin">Spin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {serverError && <p className="text-sm text-destructive">{serverError}</p>}
              <Button type="submit" className="w-full bg-cricket-green hover:bg-cricket-green/90" disabled={saving}>
                {saving ? 'Joining…' : 'Join Team'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
