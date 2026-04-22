'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Users } from 'lucide-react';

interface Team { id: string; name: string }
interface GroupTeam { teamId: string; team: Team }
interface Group { id: string; name: string; groupOrder: number; teams: GroupTeam[] }

interface Props {
  tournamentId: string;
  isOwner: boolean;
  allTeams: Team[];
  groups: Group[];
}

export function GroupStageManager({ tournamentId, isOwner, allTeams, groups: initialGroups }: Props) {
  const [groups, setGroups] = useState<Group[]>(initialGroups);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const assignedTeamIds = new Set(groups.flatMap((g) => g.teams.map((gt) => gt.teamId)));

  const handleCreate = async () => {
    if (!newGroupName.trim() || selectedTeams.length < 2) {
      setError('Group name and at least 2 teams are required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newGroupName.trim(), teamIds: selectedTeams }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Failed to create group');
        return;
      }
      const group = await res.json();
      setGroups((prev) => [...prev, group]);
      setNewGroupName('');
      setSelectedTeams([]);
      setShowCreateForm(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (groupId: string) => {
    if (!confirm('Delete this group?')) return;
    setLoading(true);
    try {
      await fetch(`/api/tournaments/${tournamentId}/groups`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId }),
      });
      setGroups((prev) => prev.filter((g) => g.id !== groupId));
    } finally {
      setLoading(false);
    }
  };

  const toggleTeam = (id: string) => {
    setSelectedTeams((prev) => prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]);
  };

  const unassignedTeams = allTeams.filter((t) => !assignedTeamIds.has(t.id));

  return (
    <div className="mt-4 space-y-4">
      {groups.length === 0 && (
        <p className="text-center text-muted-foreground py-8">
          No groups created yet.{isOwner && ' Create groups to organize teams for group stage play.'}
        </p>
      )}

      {groups.map((group) => (
        <div key={group.id} className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-bold">{group.name}</h3>
              <span className="text-xs text-muted-foreground">({group.teams.length} teams)</span>
            </div>
            {isOwner && (
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-400" onClick={() => handleDelete(group.id)} disabled={loading}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="p-4 flex flex-wrap gap-2">
            {group.teams.map((gt) => (
              <span key={gt.teamId} className="rounded-full border border-border bg-muted/30 px-3 py-1 text-sm font-medium">
                {gt.team.name}
              </span>
            ))}
          </div>
        </div>
      ))}

      {isOwner && !showCreateForm && (
        <Button variant="outline" size="sm" onClick={() => setShowCreateForm(true)} disabled={unassignedTeams.length < 2}>
          <Plus className="h-4 w-4 mr-1.5" />
          Create Group
          {unassignedTeams.length < 2 && <span className="ml-1 text-xs text-muted-foreground">(all teams assigned)</span>}
        </Button>
      )}

      {isOwner && showCreateForm && (
        <div className="rounded-xl border border-cricket-green/30 bg-cricket-green/5 p-4 space-y-3">
          <h4 className="font-semibold text-sm">New Group</h4>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <Input
            placeholder="Group name (e.g. Group A)"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            maxLength={50}
          />
          <div>
            <p className="text-xs text-muted-foreground mb-2">Select teams for this group:</p>
            <div className="flex flex-wrap gap-2">
              {unassignedTeams.map((t) => (
                <button
                  key={t.id}
                  onClick={() => toggleTeam(t.id)}
                  className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
                    selectedTeams.includes(t.id)
                      ? 'border-cricket-green bg-cricket-green/20 text-cricket-green'
                      : 'border-border bg-muted/30 hover:border-cricket-green/50'
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleCreate} disabled={loading} className="bg-cricket-green hover:bg-cricket-green/90">
              {loading ? 'Creating...' : 'Create Group'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setShowCreateForm(false); setError(''); setSelectedTeams([]); setNewGroupName(''); }}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
