'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const DISMISSAL_TYPES = ['Bowled', 'Caught', 'LBW', 'RunOut', 'Stumped', 'HitWicket'];

interface Player {
  id: string;
  name: string;
}

interface WicketModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: {
    wicketType: string;
    fielderId?: string;
    nextBatsmanId: string;
  }) => void;
  fieldingPlayers: Player[];
  availableBatsmen: Player[];
  bowlerId: string;
}

export function WicketModal({
  open,
  onClose,
  onConfirm,
  fieldingPlayers,
  availableBatsmen,
  bowlerId,
}: WicketModalProps) {
  const [wicketType, setWicketType] = useState('Bowled');
  const [fielderId, setFielderId] = useState<string>('');
  const [nextBatsmanId, setNextBatsmanId] = useState<string>('');

  const needsFielder = ['Caught', 'RunOut', 'Stumped'].includes(wicketType);
  const isLastWicket = availableBatsmen.length === 0;

  function handleConfirm() {
    // If last wicket, no next batsman needed — pass empty string, caller handles innings end
    if (!isLastWicket && !nextBatsmanId) return;
    onConfirm({
      wicketType,
      fielderId: needsFielder && fielderId ? fielderId : undefined,
      nextBatsmanId: isLastWicket ? '' : nextBatsmanId,
    });
    setWicketType('Bowled');
    setFielderId('');
    setNextBatsmanId('');
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>🏏 Wicket!</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="mb-1 block">Dismissal Type</Label>
            <div className="grid grid-cols-3 gap-2">
              {DISMISSAL_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => setWicketType(type)}
                  className={`rounded-lg border py-2 text-sm font-medium transition-colors ${
                    wicketType === type
                      ? 'border-red-500 bg-red-600 text-white'
                      : 'border-border text-muted-foreground hover:border-red-400'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {needsFielder && (
            <div>
              <Label className="mb-1 block">Fielder</Label>
              <Select value={fielderId} onValueChange={setFielderId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select fielder" />
                </SelectTrigger>
                <SelectContent>
                  {fieldingPlayers.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label className="mb-1 block">Next Batsman</Label>
            {isLastWicket ? (
              <p className="text-sm text-red-400 font-semibold py-2">All out! No more batsmen available.</p>
            ) : (
              <Select value={nextBatsmanId} onValueChange={setNextBatsmanId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select next batsman" />
                </SelectTrigger>
                <SelectContent>
                  {availableBatsmen.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleConfirm}
              disabled={!isLastWicket && !nextBatsmanId}
            >
              Confirm
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
