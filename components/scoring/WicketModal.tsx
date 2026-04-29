'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useLocale } from '@/components/LocaleProvider';

const DISMISSAL_TYPES = ['Bowled', 'Caught', 'LBW', 'RunOut', 'Stumped', 'HitWicket', 'RetiredHurt', 'RetiredOut'];

// RetiredHurt = batsman leaves (injury), counted NOT out, can return
// RetiredOut = batsman retires, counted as out
const RETIRED_TYPES = ['RetiredHurt', 'RetiredOut'];

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
    isRetiredHurt?: boolean;
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
  const isRetired = RETIRED_TYPES.includes(wicketType);
  const isLastWicket = availableBatsmen.length === 0;
  const { t } = useLocale();

  function handleConfirm() {
    if (!isLastWicket && !isRetired && !nextBatsmanId) return;
    if (isRetired && !nextBatsmanId && availableBatsmen.length > 0) return;
    onConfirm({
      wicketType,
      fielderId: needsFielder && fielderId ? fielderId : undefined,
      nextBatsmanId: isLastWicket ? '' : nextBatsmanId,
      isRetiredHurt: wicketType === 'RetiredHurt',
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
            <Label className="mb-1 block">{t('scoring.dismissalType')}</Label>
            <div className="grid grid-cols-3 gap-2">
              {DISMISSAL_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => setWicketType(type)}
                  className={`rounded-lg border py-2 text-sm font-medium transition-colors ${
                    wicketType === type
                      ? RETIRED_TYPES.includes(type)
                        ? 'border-amber-500 bg-amber-600 text-white'
                        : 'border-red-500 bg-red-600 text-white'
                      : 'border-border text-muted-foreground hover:border-red-400'
                  }`}
                >
                  {type === 'RetiredHurt' ? 'Ret. Hurt' : type === 'RetiredOut' ? 'Ret. Out' : type}
                </button>
              ))}
            </div>
            {isRetired && (
              <p className="text-xs text-amber-400 mt-2">
                {wicketType === 'RetiredHurt'
                  ? '⚠️ Retired Hurt — batsman leaves due to injury, NOT counted as out.'
                  : '⚠️ Retired Out — batsman retires voluntarily, counted as OUT.'}
              </p>
            )}
          </div>

          {needsFielder && (
            <div>
              <Label className="mb-1 block">Fielder</Label>
              <Select value={fielderId} onValueChange={setFielderId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('scoring.fielder')} />
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
            <Label className="mb-1 block">{isRetired ? `${t('scoring.nextBatsman')} (replacement)` : t('scoring.nextBatsman')}</Label>
            {isLastWicket ? (
              <p className="text-sm text-red-400 font-semibold py-2">{t('scoring.allOut')}</p>
            ) : (
              <Select value={nextBatsmanId} onValueChange={setNextBatsmanId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('scoring.nextBatsman')} />
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
            <Button variant="outline" className="flex-1" onClick={onClose}>{t('action.cancel')}</Button>
            <Button
              variant={isRetired ? 'outline' : 'destructive'}
              className={`flex-1 ${isRetired ? 'border-amber-500 text-amber-400 hover:bg-amber-500/10' : ''}`}
              onClick={handleConfirm}
              disabled={!isLastWicket && !isRetired && !nextBatsmanId}
            >
              {t('scoring.confirm')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
