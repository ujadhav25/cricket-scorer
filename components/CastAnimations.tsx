'use client';

import { useEffect, useState } from 'react';
import { BoundaryAnim } from '@/components/animations/BoundaryAnim';
import { SixAnim } from '@/components/animations/SixAnim';
import { WicketAnim } from '@/components/animations/WicketAnim';

type AnimationType = 'four' | 'six' | 'wicket' | null;

const ANIM_DURATION = 3200; // ms

export function CastAnimations({ matchId }: { matchId: string }) {
  const [anim, setAnim] = useState<AnimationType>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const es = new EventSource(`/api/matches/${matchId}/live`);

    es.addEventListener('ball-recorded', (e: MessageEvent) => {
      try {
        const delivery = JSON.parse(e.data ?? '{}');
        let next: AnimationType = null;
        if (delivery.isWicket) {
          next = 'wicket';
        } else if (!delivery.isWide && !delivery.isNoBall && delivery.runs === 6) {
          next = 'six';
        } else if (!delivery.isWide && !delivery.isNoBall && delivery.runs === 4) {
          next = 'four';
        }
        if (next) {
          setAnim(null);
          clearTimeout(timer);
          requestAnimationFrame(() => {
            setAnim(next);
            timer = setTimeout(() => setAnim(null), ANIM_DURATION);
          });
        }
      } catch {
        // malformed payload — ignore
      }
    });

    return () => {
      clearTimeout(timer);
      es.close();
    };
  }, [matchId]);

  return (
    <>
      <BoundaryAnim visible={anim === 'four'} />
      <SixAnim visible={anim === 'six'} />
      <WicketAnim visible={anim === 'wicket'} />
    </>
  );
}
