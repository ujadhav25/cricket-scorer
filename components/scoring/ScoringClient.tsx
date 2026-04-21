'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { BallInput, type BallEvent } from '@/components/scoring/BallInput';
import { ScoreBoard } from '@/components/scoring/ScoreBoard';
import { OverSummary } from '@/components/scoring/OverSummary';
import { WicketModal } from '@/components/scoring/WicketModal';
import { BoundaryAnim } from '@/components/animations/BoundaryAnim';
import { SixAnim } from '@/components/animations/SixAnim';
import { WicketAnim } from '@/components/animations/WicketAnim';
import { useScoringStore } from '@/store/scoring';
import { useToast } from '@/components/ui/toaster';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { calcStrikeRate, formatOvers, legalBallCount, legalBallCountForBowler } from '@/lib/utils';
import { ArrowLeft, Undo2, Share2 } from 'lucide-react';
import { getPusherClient, matchChannel, PUSHER_EVENTS } from '@/lib/pusher';
import React from 'react';
import { ShareMatchButton } from '@/components/ShareMatchButton';

interface ScoringClientProps {
  match: any;
}

export function ScoringClient({ match }: ScoringClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const store = useScoringStore();
  const animTimer = useRef<NodeJS.Timeout | null>(null);
  const [optimisticDeliveries, setOptimisticDeliveries] = React.useState<any[]>([]);
  // Saved authoritative innings 1 total — set when innings 1 ends (avoids relying on stale match prop for tie detection)
  const [innings1FinalScore, setInnings1FinalScore] = React.useState<number | null>(
    () => match.innings.find((i: any) => i.inningsNumber === 1 && i.isCompleted)?.totalRuns ?? null
  );
  // Saved super-over innings 3 final score
  const [innings3FinalScore, setInnings3FinalScore] = React.useState<number | null>(
    () => match.innings.find((i: any) => i.inningsNumber === 3 && i.isCompleted)?.totalRuns ?? null
  );
  // Explicit innings-2 setup flag — set when innings 1 ends, cleared when innings 2 exists on server
  const [needsInnings2, setNeedsInnings2] = React.useState(
    () => Boolean(match.innings.find((i: any) => i.inningsNumber === 1)?.isCompleted &&
      !match.innings.find((i: any) => i.inningsNumber === 2))
  );

  const innings1 = match.innings.find((i: any) => i.inningsNumber === 1);
  const innings2 = match.innings.find((i: any) => i.inningsNumber === 2);
  const innings3 = match.innings.find((i: any) => i.inningsNumber === 3);
  const innings4 = match.innings.find((i: any) => i.inningsNumber === 4);
  const innings1Completed = innings1?.isCompleted ?? false;
  // Use React state OR server state — once innings 2 exists on server, clear the React flag
  const effectiveNeedsInnings2 = needsInnings2 || (innings1Completed && !innings2);

  // Super over: triggered when innings 2 ends in a tie
  const [needsSuperOver, setNeedsSuperOver] = React.useState(
    () => Boolean(match.status === 'LIVE' && innings2?.isCompleted && !innings3)
  );
  const [needsSuperOverInnings4, setNeedsSuperOverInnings4] = React.useState(
    () => Boolean(innings3?.isCompleted && !innings4)
  );
  const effectiveSuperOverSetup = needsSuperOver || Boolean(match.status === 'LIVE' && innings2?.isCompleted && !innings3);
  const effectiveSuperOverInnings4Setup = needsSuperOverInnings4 || Boolean(innings3?.isCompleted && !innings4);

  // Clear flags once server confirms innings exist
  React.useEffect(() => {
    if (innings2 && needsInnings2) setNeedsInnings2(false);
  }, [innings2?.id]);
  React.useEffect(() => { if (innings3 && needsSuperOver) setNeedsSuperOver(false); }, [innings3?.id]);
  React.useEffect(() => { if (innings4 && needsSuperOverInnings4) setNeedsSuperOverInnings4(false); }, [innings4?.id]);

  // Active innings: null during any innings setup phase (avoids showing stale data)
  const currentInnings = (effectiveNeedsInnings2 || effectiveSuperOverSetup || effectiveSuperOverInnings4Setup)
    ? null
    : (match.innings.find((i: any) => !i.isCompleted) ?? match.innings[match.innings.length - 1] ?? null);
  const isSuperOver = effectiveSuperOverSetup || effectiveSuperOverInnings4Setup || (currentInnings?.inningsNumber ?? 0) >= 3;

  // Merge server deliveries with optimistic ones.
  // Dedup key includes isWide+isNoBall so a Wide(ball=3) doesn't knock out legal(ball=3)
  const serverDeliveries: any[] = currentInnings?.deliveries ?? [];
  const mergedDeliveries = [
    ...serverDeliveries,
    ...optimisticDeliveries.filter(
      (od) => !serverDeliveries.some(
        (sd) => sd.overNumber === od.overNumber
          && sd.ballNumber === od.ballNumber
          && Boolean(sd.isWide) === Boolean(od.isWide)
          && Boolean(sd.isNoBall) === Boolean(od.isNoBall)
      )
    ),
  ];

  // Always derive current over from mergedDeliveries — single source of truth
  const allLegal = mergedDeliveries.filter((d: any) => !d.isWide && !d.isNoBall);
  const maxOver = allLegal.length > 0 ? Math.max(...allLegal.map((d: any) => d.overNumber)) : 0;
  const maxOverBalls = allLegal.filter((d: any) => d.overNumber === maxOver);
  const derivedCurrentOver = maxOverBalls.length >= 6 ? maxOver + 1 : maxOver;
  // Use the shared utility so scoring page and public page use identical logic
  const consistentTotalBalls = legalBallCount(mergedDeliveries);

  // Clear optimistic deliveries once server data catches up (same dedup key)
  React.useEffect(() => {
    if (optimisticDeliveries.length > 0) {
      const allSynced = optimisticDeliveries.every((od) =>
        serverDeliveries.some(
          (sd) => sd.overNumber === od.overNumber
            && sd.ballNumber === od.ballNumber
            && Boolean(sd.isWide) === Boolean(od.isWide)
            && Boolean(sd.isNoBall) === Boolean(od.isNoBall)
        )
      );
      if (allSynced) setOptimisticDeliveries([]);
    }
  }, [serverDeliveries.length]);

  // Determine batting team players — swap teams for innings 2 / super over setup
  const battingTeam = effectiveNeedsInnings2
    ? (innings1!.battingTeamId === match.teamAId ? match.teamB : match.teamA)
    : effectiveSuperOverSetup
      // Super over innings 3: same batting order as innings 1 (original first batting team)
      ? (innings1!.battingTeamId === match.teamAId ? match.teamA : match.teamB)
      : effectiveSuperOverInnings4Setup
        // Super over innings 4: same batting order as innings 2
        ? (innings2!.battingTeamId === match.teamAId ? match.teamA : match.teamB)
        : currentInnings
          ? (currentInnings.battingTeamId === match.teamAId ? match.teamA : match.teamB)
          : match.teamA;
  const fieldingTeam = battingTeam.id === match.teamAId ? match.teamB : match.teamA;

  // Initialize store — always sync from match data (handles page refresh)
  // Reset store if navigating to a different match
  useEffect(() => {
    if (store.matchId && store.matchId !== match.id) {
      store.reset();
    }
    store.setMatchId(match.id);

    // Only sync innings ID when the innings is active (not completed)
    if (currentInnings?.id && !currentInnings.isCompleted) {
      store.setCurrentInnings(currentInnings.id);
    } else if (effectiveNeedsInnings2 || effectiveSuperOverSetup || effectiveSuperOverInnings4Setup) {
      // Clear stale innings ID so ensureInnings creates the next innings
      store.setCurrentInnings('');
    }

    if (currentInnings) {
      // Sync store over number from derived value
      if (store.currentOverNumber !== derivedCurrentOver) {
        store.setOver(derivedCurrentOver, maxOverBalls.length % 6);
      }

      // Auto-populate batsmen from scores (not out players)
      const activeBatsmen = currentInnings.batterScores?.filter((bs: any) => !bs.isOut) ?? [];
      if (activeBatsmen.length >= 1 && !store.strikerId) {
        store.setStriker(activeBatsmen[0].playerId);
      }
      if (activeBatsmen.length >= 2 && !store.nonStrikerId) {
        store.setNonStriker(activeBatsmen[1].playerId);
      }

      // Auto-populate bowler only if current over has balls but is not complete
      const isCurrentOverComplete = maxOverBalls.length >= 6;
      if (!store.currentBowlerId && !isCurrentOverComplete && allLegal.length > 0) {
        const lastBall = allLegal[allLegal.length - 1];
        store.setBowler(lastBall.bowlerId);
      }
    }
  }, [match.id, currentInnings?.id, mergedDeliveries.length]);

  // Clear bowler when over advances — single source of truth
  const prevOverRef = React.useRef<number | null>(null);
  // Derive the last over's bowler directly from deliveries — survives page refresh and manual "Change"
  const lastCompletedOver = derivedCurrentOver > 0 ? derivedCurrentOver - 1 : null;
  const prevBowlerId = lastCompletedOver !== null
    ? (mergedDeliveries.find((d: any) => d.overNumber === lastCompletedOver && !d.isWide && !d.isNoBall)?.bowlerId ?? null)
    : null;
  // Keep a ref so the useEffect below can read it without being in its dep array
  const prevBowlerIdRef = React.useRef<string | null>(prevBowlerId);
  prevBowlerIdRef.current = prevBowlerId;
  useEffect(() => {
    if (prevOverRef.current !== null && derivedCurrentOver > prevOverRef.current) {
      store.setBowler('');
    }
    prevOverRef.current = derivedCurrentOver;
  }, [derivedCurrentOver]);

  // Pusher real-time
  useEffect(() => {
    const pusher = getPusherClient();
    const channel = pusher.subscribe(matchChannel(match.id));
    channel.bind(PUSHER_EVENTS.BALL_RECORDED, () => router.refresh());
    channel.bind(PUSHER_EVENTS.SCORE_UPDATE, () => router.refresh());
    return () => { channel.unbind_all(); pusher.unsubscribe(matchChannel(match.id)); };
  }, [match.id, router]);

  function triggerAnim(type: 'four' | 'six' | 'wicket') {
    store.triggerAnimation(type);
    if (animTimer.current) clearTimeout(animTimer.current);
    const duration = type === 'six' ? 2500 : 2000;
    animTimer.current = setTimeout(() => store.clearAnimation(), duration);
  }

  async function ensureInnings(): Promise<string | null> {
    const existing = store.currentInningsId || currentInnings?.id;
    // Don't reuse a completed innings ID when setting up the next innings
    if (existing && !effectiveNeedsInnings2 && !effectiveSuperOverSetup && !effectiveSuperOverInnings4Setup) return existing;

    if (!store.strikerId || !store.nonStrikerId || !store.currentBowlerId) return null;

    const inningsNumber = effectiveSuperOverInnings4Setup ? 4 : effectiveSuperOverSetup ? 3 : effectiveNeedsInnings2 ? 2 : 1;
    const res = await fetch(`/api/matches/${match.id}/innings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        battingTeamId: battingTeam.id,
        inningsNumber,
        openingBatsmanIds: [store.strikerId, store.nonStrikerId],
        openingBowlerId: store.currentBowlerId,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast({ title: 'Failed to start innings', description: err.error ?? 'Server error', variant: 'destructive' });
      return null;
    }
    const innings = await res.json();
    store.setCurrentInnings(innings.id);
    return innings.id;
  }

  async function handleBall(event: BallEvent) {
    if (!store.strikerId || !store.currentBowlerId || !store.nonStrikerId) {
      toast({ title: 'Setup needed', description: 'Select batsmen and bowler first', variant: 'destructive' });
      return;
    }

    // Super over is capped at 1 over; regular innings use match.overs
    const activeOvers = isSuperOver ? 1 : match.overs;

    // Block if all overs are done for the current active innings
    if (!effectiveNeedsInnings2 && !effectiveSuperOverSetup && !effectiveSuperOverInnings4Setup && derivedCurrentOver >= activeOvers) {
      toast({ title: 'Innings complete', description: `All ${activeOvers} overs have been bowled`, variant: 'destructive' });
      return;
    }

    if (event.isWicket) {
      store.setShowWicketModal(true);
      return;
    }

    store.setIsSubmitting(true);
    const inningsId = await ensureInnings();
    if (!inningsId) {
      toast({ title: 'Setup needed', description: 'Select batsmen and bowler first', variant: 'destructive' });
      store.setIsSubmitting(false);
      return;
    }

    try {
      // Use derivedCurrentOver — always accurate, computed from mergedDeliveries
      const overBalls = allLegal.filter((d: any) => d.overNumber === derivedCurrentOver);
      const nextBall = (overBalls.length % 6) + 1;
      const isEndOfOver = nextBall === 6 && !event.isWide && !event.isNoBall;

      const res = await fetch(`/api/matches/${match.id}/ball`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inningsId,
          overNumber: derivedCurrentOver,
          ballNumber: nextBall,
          batsmanId: store.strikerId,
          bowlerId: store.currentBowlerId,
          ...event,
        }),
      });

      if (!res.ok) throw new Error('Failed to record ball');

      // Use DB-returned innings total — ground truth, immune to stale client state
      const { innings: updatedInnings } = await res.json();
      const dbTotalRuns: number = updatedInnings.totalRuns;

      // Optimistically add ball to display immediately
      setOptimisticDeliveries((prev) => [
        ...prev,
        {
          overNumber: derivedCurrentOver,
          ballNumber: nextBall,
          runs: event.runs,
          isWide: event.isWide ?? false,
          isNoBall: event.isNoBall ?? false,
          isWicket: false,
          bowlerId: store.currentBowlerId ?? '',
          batsmanId: store.strikerId ?? '',
        },
      ]);

      // Trigger animations
      if (event.runs === 4) triggerAnim('four');
      else if (event.runs === 6) triggerAnim('six');

      // Toast
      const label = event.isWide ? 'Wide' : event.isNoBall ? 'No Ball' : event.isLegBye ? 'Leg Bye' : event.isBye ? 'Bye' : `${event.runs} run${event.runs !== 1 ? 's' : ''}`;
      toast({ title: label, variant: 'default' });

      // Rotate strike for odd runs
      if (!event.isWide && !event.isNoBall && event.runs % 2 === 1) store.rotateStrike();

      // Check if target chased (innings 2 or super over innings 4 win condition)
      // Use dbTotalRuns (from DB response) — not client-computed value which can be stale
      if (targetRuns && (currentInnings?.inningsNumber === 2 || currentInnings?.inningsNumber === 4)) {
        if (dbTotalRuns >= targetRuns) {
          try { await fetch(`/api/matches/${match.id}/complete`, { method: 'PUT' }); } catch (_) {}
          toast({ title: 'Match won!', description: `${battingTeam.name} win by ${10 - (optimisticInnings?.totalWickets ?? 0)} wickets`, variant: 'default' });
          router.push(`/matches/${match.id}`);
          router.refresh();
          return;
        }
      }

      // End of over: rotate strike only (bowler clearing handled by derivedCurrentOver useEffect)
      if (isEndOfOver) {
        store.rotateStrike();

        // overs are 0-indexed: over 0 = first over. After this over, oversCompleted = derivedCurrentOver + 1
        const oversCompleted = derivedCurrentOver + 1;
        const activeOvers = isSuperOver ? 1 : match.overs;
        if (oversCompleted >= activeOvers) {
          const activeInningsNumber = currentInnings?.inningsNumber ?? 1;
          if (activeInningsNumber === 1) {
            // End of innings 1 — save authoritative score, set up innings 2
            setInnings1FinalScore(dbTotalRuns);
            setNeedsInnings2(true);
            store.setStriker('');
            store.setNonStriker('');
            store.setBowler('');
            store.setCurrentInnings('');
            setOptimisticDeliveries([]);
            const target = dbTotalRuns + 1;
            toast({ title: 'Innings 1 complete!', description: `Target for 2nd innings: ${target}`, variant: 'default' });
          } else if (activeInningsNumber === 2) {
            // End of innings 2 — use DB total vs saved innings1 score for tie detection
            const inn1Score = innings1FinalScore ?? innings1?.totalRuns ?? -1;
            if (dbTotalRuns === inn1Score) {
              setNeedsSuperOver(true);
              store.setStriker('');
              store.setNonStriker('');
              store.setBowler('');
              store.setCurrentInnings('');
              setOptimisticDeliveries([]);
              toast({ title: "It's a Tie! 🏏", description: 'Super Over will decide the winner!', variant: 'default' });
            } else {
              try { await fetch(`/api/matches/${match.id}/complete`, { method: 'PUT' }); } catch (_) {}
              toast({ title: 'Match complete!', variant: 'default' });
              router.push(`/matches/${match.id}`);
              router.refresh();
            }
          } else if (activeInningsNumber === 3) {
            // End of super over innings 3 — save score, set up innings 4
            setInnings3FinalScore(dbTotalRuns);
            setNeedsSuperOverInnings4(true);
            store.setStriker('');
            store.setNonStriker('');
            store.setBowler('');
            store.setCurrentInnings('');
            setOptimisticDeliveries([]);
            const soTarget = dbTotalRuns + 1;
            toast({ title: 'Super Over 1st innings done!', description: `Target: ${soTarget} runs`, variant: 'default' });
          } else {
            // End of super over innings 4 — match complete
            try { await fetch(`/api/matches/${match.id}/complete`, { method: 'PUT' }); } catch (_) {}
            toast({ title: 'Super Over done! Match complete!', variant: 'default' });
            router.push(`/matches/${match.id}`);
            router.refresh();
          }
          return;
        }
      }

      router.refresh();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      store.setIsSubmitting(false);
    }
  }

  async function handleWicketConfirm(data: { wicketType: string; fielderId?: string; nextBatsmanId: string }) {
    store.setShowWicketModal(false);
    store.setIsSubmitting(true);
    const inningsId = await ensureInnings();
    if (!inningsId) { store.setIsSubmitting(false); return; }
    try {
      const overBalls = allLegal.filter((d: any) => d.overNumber === derivedCurrentOver);
      const nextBall = (overBalls.length % 6) + 1;

      const wicketRes = await fetch(`/api/matches/${match.id}/ball`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inningsId,
          overNumber: derivedCurrentOver,
          ballNumber: nextBall,
          batsmanId: store.strikerId,
          bowlerId: store.currentBowlerId,
          runs: 0,
          isWicket: true,
          wicketType: data.wicketType,
          fielderId: data.fielderId,
        }),
      });

      // Get DB-authoritative innings total (wicket ball has 0 runs but keep consistent pattern)
      const { innings: wicketUpdatedInnings } = wicketRes.ok ? await wicketRes.json() : { innings: null };
      const wicketInningsTotal: number = wicketUpdatedInnings?.totalRuns ?? optimisticInnings?.totalRuns ?? 0;

      triggerAnim('wicket');
      toast({ title: `Wicket! ${data.wicketType}`, variant: 'destructive' });

      // All-out check — innings ends when last batsman can't bat alone
      // threshold = team size - 1 (not hardcoded 10)
      const teamSize = allBattingPlayers.length;
      const newWickets = (optimisticInnings?.totalWickets ?? 0) + 1;
      if (newWickets >= teamSize - 1 || !data.nextBatsmanId) {
        const inningsNum = currentInnings?.inningsNumber ?? 1;
        if (inningsNum === 1) {
          setInnings1FinalScore(wicketInningsTotal);
          setNeedsInnings2(true);
          store.setStriker('');
          store.setNonStriker('');
          store.setBowler('');
          store.setCurrentInnings('');
          setOptimisticDeliveries([]);
          const target = wicketInningsTotal + 1;
          toast({ title: 'All out! Innings 1 over.', description: `Target: ${target}`, variant: 'default' });
        } else if (inningsNum === 2) {
          const inn1Score = innings1FinalScore ?? innings1?.totalRuns ?? -1;
          if (wicketInningsTotal === inn1Score) {
            setNeedsSuperOver(true);
            store.setStriker('');
            store.setNonStriker('');
            store.setBowler('');
            store.setCurrentInnings('');
            setOptimisticDeliveries([]);
            toast({ title: "All out! It's a Tie! 🏏", description: 'Super Over will decide the winner!', variant: 'default' });
          } else {
            try { await fetch(`/api/matches/${match.id}/complete`, { method: 'PUT' }); } catch (_) {}
            toast({ title: 'All out! Match over.', variant: 'default' });
            router.push(`/matches/${match.id}`);
            router.refresh();
          }
        } else if (inningsNum === 3) {
          setInnings3FinalScore(wicketInningsTotal);
          setNeedsSuperOverInnings4(true);
          store.setStriker('');
          store.setNonStriker('');
          store.setBowler('');
          store.setCurrentInnings('');
          setOptimisticDeliveries([]);
          const soTarget = wicketInningsTotal + 1;
          toast({ title: 'All out! Super Over 1st innings done.', description: `Target: ${soTarget} runs`, variant: 'default' });
        } else {
          try { await fetch(`/api/matches/${match.id}/complete`, { method: 'PUT' }); } catch (_) {}
          toast({ title: 'All out! Super Over done!', variant: 'default' });
          router.push(`/matches/${match.id}`);
          router.refresh();
        }
        return;
      }

      store.setStriker(data.nextBatsmanId);
      router.refresh();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      store.setIsSubmitting(false);
    }
  }

  async function handleUndo() {
    try {
      const res = await fetch(`/api/matches/${match.id}/ball/last`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Nothing to undo');
      toast({ title: 'Last ball undone', variant: 'success' });
      router.refresh();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  }

  const strikerScore = currentInnings?.batterScores?.find((b: any) => b.playerId === store.strikerId);
  const nonStrikerScore = currentInnings?.batterScores?.find((b: any) => b.playerId === store.nonStrikerId);
  const bowlerScore = currentInnings?.bowlerScores?.find((b: any) => b.playerId === store.currentBowlerId);

  // Add runs from optimistic deliveries not yet persisted to server
  const syncedDeliveries = currentInnings?.deliveries ?? [];
  const optimisticBowlerRuns = optimisticDeliveries
    .filter((od) => od.bowlerId === store.currentBowlerId && !syncedDeliveries.some(
      (sd: any) => sd.overNumber === od.overNumber && sd.ballNumber === od.ballNumber
        && Boolean(sd.isWide) === Boolean(od.isWide) && Boolean(sd.isNoBall) === Boolean(od.isNoBall)
    ))
    .reduce((sum: number, od: any) => sum + (od.runs ?? 0), 0);
  const bowlerDisplayRuns = (bowlerScore?.runs ?? 0) + optimisticBowlerRuns;

  const allBattingPlayers = battingTeam.players.map((tp: any) => tp.player);
  const availableBatsmen = allBattingPlayers.filter(
    (p: any) => !currentInnings?.batterScores?.some((bs: any) => bs.playerId === p.id && bs.isOut)
      && p.id !== store.strikerId
      && p.id !== store.nonStrikerId
  );

  const targetRuns = (() => {
    if (currentInnings?.inningsNumber === 4 || effectiveSuperOverInnings4Setup) {
      const base = innings3FinalScore ?? innings3?.totalRuns;
      return base !== undefined && base !== null ? base + 1 : undefined;
    }
    if (currentInnings?.inningsNumber === 2 || effectiveNeedsInnings2) {
      const base = innings1FinalScore ?? innings1?.totalRuns;
      return base !== undefined && base !== null ? base + 1 : undefined;
    }
    return undefined;
  })();

  // Compute optimistic innings totals from mergedDeliveries
  const optimisticInnings = currentInnings ? (() => {
    const legalBalls = mergedDeliveries.filter((d: any) => !d.isWide && !d.isNoBall);
    const totalRuns = mergedDeliveries.reduce((sum: number, d: any) => {
      const extra = d.isWide || d.isNoBall ? 1 : 0;
      return sum + d.runs + extra;
    }, 0);
    const totalWickets = mergedDeliveries.filter((d: any) => d.isWicket).length;
    const totalOvers = legalBalls.length / 6;
    const extras = mergedDeliveries.filter((d: any) => d.isWide || d.isNoBall).length;
    const wides = mergedDeliveries.filter((d: any) => d.isWide).reduce((s: number, d: any) => s + 1 + d.runs, 0);
    const noBalls = mergedDeliveries.filter((d: any) => d.isNoBall).length;
    const legByes = mergedDeliveries.filter((d: any) => d.isLegBye).reduce((s: number, d: any) => s + d.runs, 0);
    const byes = mergedDeliveries.filter((d: any) => d.isBye).reduce((s: number, d: any) => s + d.runs, 0);
    return { ...currentInnings, totalRuns, totalWickets, totalOvers, extras, wides, noBalls, legByes, byes };
  })() : currentInnings;

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Animations */}
      <BoundaryAnim visible={store.activeAnimation === 'four'} />
      <SixAnim visible={store.activeAnimation === 'six'} />
      <WicketAnim visible={store.activeAnimation === 'wicket'} />

      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/matches/${match.id}`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <span className="font-semibold text-sm">{match.teamA.name} vs {match.teamB.name}</span>
        <div className="flex items-center gap-1">
          <ShareMatchButton shareToken={match.shareToken} matchTitle={`${match.teamA.name} vs ${match.teamB.name}`} />
          <Button variant="ghost" size="icon" onClick={handleUndo}>
            <Undo2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Super Over banner */}
      {isSuperOver && (
        <div className="bg-yellow-500/20 border-b border-yellow-500/40 px-4 py-1.5 text-center text-xs font-bold text-yellow-400 tracking-widest">
          ⚡ SUPER OVER
        </div>
      )}

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Scoreboard */}
        <ScoreBoard
          teamAName={match.teamA.name}
          teamBName={match.teamB.name}
          battingTeamId={currentInnings?.battingTeamId ?? battingTeam.id}
          teamAId={match.teamAId}
          innings={(effectiveNeedsInnings2 || effectiveSuperOverSetup || effectiveSuperOverInnings4Setup) ? null : optimisticInnings}
          totalOvers={isSuperOver ? 1 : match.overs}
          totalBalls={consistentTotalBalls}
          targetRuns={targetRuns}
          inningsNumber={effectiveSuperOverInnings4Setup ? 4 : effectiveSuperOverSetup ? 3 : effectiveNeedsInnings2 ? 2 : (currentInnings?.inningsNumber ?? 1)}
        />

        {/* Batsmen setup */}
        {!store.strikerId || !store.nonStrikerId ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-3">
            <p className="font-semibold text-amber-400">Select Opening Batsmen</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Striker *</Label>
                <Select onValueChange={(v) => store.setStriker(v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Striker" /></SelectTrigger>
                  <SelectContent>
                    {allBattingPlayers.map((p: any) => (
                      <SelectItem key={p.id} value={p.id} disabled={p.id === store.nonStrikerId}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Non-Striker *</Label>
                <Select onValueChange={(v) => store.setNonStriker(v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Non-striker" /></SelectTrigger>
                  <SelectContent>
                    {allBattingPlayers.map((p: any) => (
                      <SelectItem key={p.id} value={p.id} disabled={p.id === store.strikerId}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {/* Striker */}
            <div className="rounded-lg border border-border bg-card p-3">
              <div className="flex items-center gap-1 text-xs text-cricket-green font-semibold mb-1">
                <span>⚡</span> STRIKER
              </div>
              <p className="font-semibold truncate">{allBattingPlayers.find((p: any) => p.id === store.strikerId)?.name ?? '—'}</p>
              {strikerScore && (
                <p className="text-lg font-bold">{strikerScore.runs}<span className="text-sm text-muted-foreground">({strikerScore.balls})</span></p>
              )}
            </div>
            {/* Non-striker */}
            <div className="rounded-lg border border-border bg-card p-3">
              <div className="text-xs text-muted-foreground font-semibold mb-1">NON-STRIKER</div>
              <p className="font-semibold truncate">{allBattingPlayers.find((p: any) => p.id === store.nonStrikerId)?.name ?? '—'}</p>
              {nonStrikerScore && (
                <p className="text-lg font-bold">{nonStrikerScore.runs}<span className="text-sm text-muted-foreground">({nonStrikerScore.balls})</span></p>
              )}
            </div>
          </div>
        )}

        {/* Bowler setup */}
        {!store.currentBowlerId ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
            <p className="mb-2 font-semibold text-amber-400">Select Bowler</p>
            <Select onValueChange={(v) => store.setBowler(v)}>
              <SelectTrigger><SelectValue placeholder="Select bowler" /></SelectTrigger>
              <SelectContent>
                {[...fieldingTeam.players].sort((a: any, b: any) => {
                  if (a.player.id === prevBowlerId) return 1;
                  if (b.player.id === prevBowlerId) return -1;
                  return 0;
                }).map((tp: any) => {
                  const isPrev = tp.player.id === prevBowlerId;
                  const isBatting = tp.player.id === store.strikerId || tp.player.id === store.nonStrikerId;
                  const isDisabled = isPrev || isBatting;
                  return (
                    <SelectItem key={tp.player.id} value={tp.player.id} disabled={isDisabled}>
                      <span className="flex items-center gap-2">
                        {tp.player.name}
                        {isPrev && (
                          <span className="text-xs text-muted-foreground">(bowled last over)</span>
                        )}
                        {isBatting && (
                          <span className="text-xs text-muted-foreground">(currently batting)</span>
                        )}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground font-semibold mb-1">BOWLER</div>
                <p className="font-semibold">{fieldingTeam.players.find((tp: any) => tp.player.id === store.currentBowlerId)?.player.name ?? '—'}</p>
                {bowlerScore && (
                  <p className="text-sm text-muted-foreground">{formatOvers(legalBallCountForBowler(mergedDeliveries, store.currentBowlerId ?? ''))} ov · {bowlerDisplayRuns} runs · {bowlerScore.wickets}W</p>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={() => store.setBowler('')}>Change</Button>
            </div>
          </div>
        )}

        {/* Over summary */}
        <OverSummary
          deliveries={mergedDeliveries}
          currentOver={derivedCurrentOver}
        />

        {/* Ball input */}
        <BallInput onBall={handleBall} disabled={store.isSubmitting || !store.strikerId || !store.currentBowlerId} />
      </div>

      {/* Wicket modal */}
      <WicketModal
        open={store.showWicketModal}
        onClose={() => store.setShowWicketModal(false)}
        onConfirm={handleWicketConfirm}
        fieldingPlayers={fieldingTeam.players.map((tp: any) => tp.player)}
        availableBatsmen={availableBatsmen}
        bowlerId={store.currentBowlerId ?? ''}
      />
    </div>
  );
}
