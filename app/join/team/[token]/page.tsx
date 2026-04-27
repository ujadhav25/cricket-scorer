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
import { Users, LogIn, ArrowLeft, PartyPopper, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [profileChecked, setProfileChecked] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [joined, setJoined] = useState(false);
  const [alreadyMember, setAlreadyMember] = useState(false);
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

  // Fetch profile + auto-join if signed in
  useEffect(() => {
    if (!session?.user || !team) return;
    fetch('/api/profile')
      .then((r) => r.ok ? r.json() : null)
      .then((p) => {
        const name = p?.name?.trim() || session?.user?.name?.trim() || '';
        if (name) {
          // Auto-join: use existing player's batting/bowling if available, otherwise defaults
          doJoin({
            name,
            phone: p?.phone ?? undefined,
            battingStyle: p?.battingStyle ?? 'Right',
            bowlingStyle: p?.bowlingStyle ?? 'Medium',
          });
        } else {
          // Only show form if we truly have no name at all
          if (p) {
            reset({ name: '', phone: p.phone ?? '', battingStyle: 'Right', bowlingStyle: 'Medium' });
          }
          setProfileChecked(true);
        }
      })
      .catch(() => { setProfileChecked(true); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, team]);

  async function doJoin(data: FormData) {
    setSaving(true);
    setServerError('');
    try {
      const res = await fetch(`/api/join/team/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (res.status === 409 && result.code === 'ALREADY_MEMBER') {
        setAlreadyMember(true);
        return;
      }
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

  if (loading || sessionStatus === 'loading' || (session?.user && !team && !notFound) || (session?.user && team && !profileChecked && !saving && !joined && !alreadyMember)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-cricket-green border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
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

  // Not logged in
  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <button onClick={() => router.back()} className="absolute top-4 left-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="w-full max-w-sm space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full text-xl font-bold text-white shrink-0" style={{ backgroundColor: team?.color ?? '#16a34a' }}>
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
                <p className="text-sm text-muted-foreground mt-1">Your profile details will be pre-filled automatically.</p>
              </div>
              <Button className="w-full bg-cricket-green hover:bg-cricket-green/90" onClick={() => router.push(`/login?callbackUrl=/join/team/${token}`)}>
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

  // Already a member
  if (alreadyMember) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', bounce: 0.4, duration: 0.6 }}
          className="flex flex-col items-center gap-5 text-center max-w-xs"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-cricket-green/15">
            <ShieldCheck className="h-10 w-10 text-cricket-green" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Already a Member!</h1>
            <p className="text-muted-foreground mt-1">
              You're already part of <span className="font-semibold text-foreground">{team?.name}</span>.
            </p>
          </div>
          <div className="flex flex-col gap-2 w-full">
            <Button className="bg-cricket-green hover:bg-cricket-green/90" onClick={() => router.push('/teams')}>View Teams</Button>
            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Joined successfully — animated celebration
  if (joined) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 overflow-hidden">
        <AnimatePresence>
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', bounce: 0.5, duration: 0.7 }}
            className="flex flex-col items-center gap-5 text-center max-w-xs"
          >
            {/* Pulsing ring */}
            <div className="relative flex items-center justify-center">
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute h-24 w-24 rounded-full bg-cricket-green/30"
              />
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-cricket-green text-white">
                <PartyPopper className="h-10 w-10" />
              </div>
            </div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <h1 className="text-2xl font-bold">You're in!</h1>
              <p className="text-muted-foreground mt-1">
                <span className="font-semibold text-foreground">{joinedName}</span> has joined{' '}
                <span className="font-semibold text-foreground">{team?.name}</span>.
              </p>
            </motion.div>

            {/* Team badge */}
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-3 rounded-2xl border border-cricket-green/30 bg-cricket-green/10 px-4 py-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white shrink-0" style={{ backgroundColor: team?.color ?? '#16a34a' }}>
                {team?.name?.slice(0, 2).toUpperCase()}
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm">{team?.name}</p>
                {team?.homeGround && <p className="text-xs text-muted-foreground">{team.homeGround}</p>}
              </div>
            </motion.div>

            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="flex flex-col gap-2 w-full"
            >
              <Button className="bg-cricket-green hover:bg-cricket-green/90" onClick={() => router.push('/teams')}>View Teams</Button>
              <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // Auto-joining in progress (profile is complete, waiting for API)
  if (saving) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background p-4">
        <div className="h-10 w-10 rounded-full border-[3px] border-cricket-green border-t-transparent animate-spin" />
        <p className="text-muted-foreground text-sm">Joining {team?.name}…</p>
      </div>
    );
  }

  // Manual form (incomplete profile)
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <button onClick={() => router.back()} className="absolute top-4 left-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <div className="w-full max-w-sm space-y-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full text-xl font-bold text-white shrink-0" style={{ backgroundColor: team?.color ?? '#16a34a' }}>
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

        <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-cricket-green text-black text-xs font-bold shrink-0">
            {session.user.name?.slice(0, 1).toUpperCase() ?? '?'}
          </div>
          <span className="flex-1 truncate text-foreground font-medium">{session.user.name ?? session.user.email}</span>
          <span className="text-xs text-muted-foreground">Signed in</span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Complete your profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(doJoin)} className="space-y-4">
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
                <Select value={battingStyle} onValueChange={(v) => { setBattingStyle(v as 'Right' | 'Left'); setValue('battingStyle', v as 'Right' | 'Left'); }}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Right">Right-hand</SelectItem>
                    <SelectItem value="Left">Left-hand</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Bowling</Label>
                <Select value={bowlingStyle} onValueChange={(v) => { setBowlingStyle(v as any); setValue('bowlingStyle', v as any); }}>
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
