import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type AnimationType = 'four' | 'six' | 'wicket' | null;

interface ScoringState {
  // Active match
  matchId: string | null;
  currentInningsId: string | null;
  currentOverNumber: number;
  currentBallNumber: number;
  strikerId: string | null;
  nonStrikerId: string | null;
  currentBowlerId: string | null;

  // UI state
  activeAnimation: AnimationType;
  showWicketModal: boolean;
  showInningsModal: boolean;
  showNewBatsmanModal: boolean;
  isSubmitting: boolean;

  // Actions
  setMatchId: (id: string) => void;
  setCurrentInnings: (inningsId: string) => void;
  setOver: (over: number, ball: number) => void;
  setStriker: (id: string) => void;
  setNonStriker: (id: string) => void;
  setBowler: (id: string) => void;
  triggerAnimation: (type: AnimationType) => void;
  clearAnimation: () => void;
  setShowWicketModal: (show: boolean) => void;
  setShowInningsModal: (show: boolean) => void;
  setShowNewBatsmanModal: (show: boolean) => void;
  setIsSubmitting: (val: boolean) => void;
  rotateStrike: () => void;
  reset: () => void;
}

export const useScoringStore = create<ScoringState>()(
  devtools((set, get) => ({
    matchId: null,
    currentInningsId: null,
    currentOverNumber: 0,
    currentBallNumber: 0,
    strikerId: null,
    nonStrikerId: null,
    currentBowlerId: null,
    activeAnimation: null,
    showWicketModal: false,
    showInningsModal: false,
    showNewBatsmanModal: false,
    isSubmitting: false,

    setMatchId: (id) => set({ matchId: id }),
    setCurrentInnings: (inningsId) => set({ currentInningsId: inningsId }),
    setOver: (over, ball) => set({ currentOverNumber: over, currentBallNumber: ball }),
    setStriker: (id) => set({ strikerId: id }),
    setNonStriker: (id) => set({ nonStrikerId: id }),
    setBowler: (id) => set({ currentBowlerId: id }),
    triggerAnimation: (type) => set({ activeAnimation: type }),
    clearAnimation: () => set({ activeAnimation: null }),
    setShowWicketModal: (show) => set({ showWicketModal: show }),
    setShowInningsModal: (show) => set({ showInningsModal: show }),
    setShowNewBatsmanModal: (show) => set({ showNewBatsmanModal: show }),
    setIsSubmitting: (val) => set({ isSubmitting: val }),
    rotateStrike: () => {
      const { strikerId, nonStrikerId } = get();
      set({ strikerId: nonStrikerId, nonStrikerId: strikerId });
    },
    reset: () =>
      set({
        matchId: null,
        currentInningsId: null,
        currentOverNumber: 0,
        currentBallNumber: 0,
        strikerId: null,
        nonStrikerId: null,
        currentBowlerId: null,
        activeAnimation: null,
        showWicketModal: false,
        showInningsModal: false,
        showNewBatsmanModal: false,
        isSubmitting: false,
      }),
  }))
);
