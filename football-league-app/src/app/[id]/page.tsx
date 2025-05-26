"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TeamType } from "@/app/types/team";
import { PlayerType } from "@/app/types/player";

type TeamWithPlayers = TeamType & { players: PlayerType[] };

export default function TeamPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const teamId = parseInt(params.id);

  const [team, setTeam] = useState<TeamWithPlayers | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit modes and data for each section
  const [editInfoMode, setEditInfoMode] = useState(false);
  const [editStatsMode, setEditStatsMode] = useState(false);
  const [infoData, setInfoData] = useState<any>({});
  const [statsData, setStatsData] = useState<any>({});
  const [savingInfo, setSavingInfo] = useState(false);
  const [savingStats, setSavingStats] = useState(false);

  // 1. Add state:
  const [editingPlayerId, setEditingPlayerId] = useState<number | null>(null);
  const [playerEditData, setPlayerEditData] = useState<Partial<PlayerType>>({});
  const [savingPlayer, setSavingPlayer] = useState(false);

  // Add state for add player modal and new player data
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [newPlayer, setNewPlayer] = useState({ name: '', position: '', age: '', nationality: '' });
  const [addPlayerError, setAddPlayerError] = useState<string | null>(null);
  const [addingPlayer, setAddingPlayer] = useState(false);

  // 1. Add state for per-field errors:
  const [addPlayerFieldErrors, setAddPlayerFieldErrors] = useState<{ [key: string]: string }>({});
  const [editPlayerFieldErrors, setEditPlayerFieldErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (isNaN(teamId)) {
      setError("Invalid team ID");
      setLoading(false);
      return;
    }
    const fetchTeam = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('Fetching team with ID:', teamId);
        const res = await fetch(`/api/teams/${teamId}`);
        if (!res.ok) {
          const errorData = await res.json();
          console.error('Error response:', errorData);
          throw new Error(errorData.message || "Failed to fetch team");
        }
        const data = await res.json();
        console.log('Team data received:', data);
        setTeam(data as TeamWithPlayers);
        setInfoData({
          name: data.name,
          abbreviation: data.abbreviation || "",
          coach_name: data.coach_name,
          home_stadium: data.home_stadium,
          founded_year: data.founded_year,
          country: data.country,
        });
        setStatsData({
          wins: data.wins,
          draws: data.draws,
          losses: data.losses,
          goals_scored: data.goals_scored,
          goals_conceded: data.goals_conceded,
        });
      } catch (err: any) {
        console.error('Error fetching team:', err);
        setError(err.message || "Failed to load team");
      } finally {
        setLoading(false);
      }
    };
    fetchTeam();
  }, [teamId]);

  // Handlers for info section
  const handleInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInfoData({ ...infoData, [name]: value });
  };
  const handleInfoSave = async () => {
    if (infoData.abbreviation && infoData.abbreviation.length > 4) {
      setError("Abbreviation must be at most 4 characters long.");
      return;
    }
    setSavingInfo(true);
    setError(null);
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        router.push('/');
        return;
      }

      const user = JSON.parse(userStr);
      if (!user.id) {
        router.push('/');
        return;
      }

      const res = await fetch(`/api/teams/${teamId}?userId=${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...infoData }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to update team info");
      }
      const updated = await res.json();
      setTeam(prev => prev ? { ...prev, ...updated, players: prev.players } : updated);
      setEditInfoMode(false);
      setInfoData({
        name: updated.name,
        abbreviation: updated.abbreviation || "",
        coach_name: updated.coach_name,
        home_stadium: updated.home_stadium,
        founded_year: updated.founded_year,
        country: updated.country,
      });
    } catch (err: any) {
      setError(err.message || "Failed to update team info");
    } finally {
      setSavingInfo(false);
    }
  };

  // Handlers for stats section
  const handleStatsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setStatsData({
      ...statsData,
      [name]: type === "number" ? (value === "" ? "" : Number(value)) : value,
    });
  };
  const handleStatsSave = async () => {
    setSavingStats(true);
    setError(null);
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        router.push('/');
        return;
      }

      const user = JSON.parse(userStr);
      if (!user.id) {
        router.push('/');
        return;
      }

      const res = await fetch(`/api/teams/${teamId}?userId=${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...statsData }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to update team stats");
      }
      const updated = await res.json();
      setTeam(prev => prev ? { ...prev, ...updated, players: prev.players } : updated);
      setEditStatsMode(false);
      setStatsData({
        wins: updated.wins,
        draws: updated.draws,
        losses: updated.losses,
        goals_scored: updated.goals_scored,
        goals_conceded: updated.goals_conceded,
      });
    } catch (err: any) {
      setError(err.message || "Failed to update team stats");
    } finally {
      setSavingStats(false);
    }
  };

  // Add handlers:
  const handlePlayerEdit = (player: PlayerType) => {
    setEditingPlayerId(player.id);
    setPlayerEditData({ ...player });
  };
  const handlePlayerEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlayerEditData({ ...playerEditData, [e.target.name]: e.target.value });
  };
  const handlePlayerEditSave = async () => {
    if (!editingPlayerId) return;
    setSavingPlayer(true);
    setError(null);
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        router.push('/');
        return;
      }

      const user = JSON.parse(userStr);
      if (!user.id) {
        router.push('/');
        return;
      }

      if (!playerEditData.name?.trim() || !playerEditData.position?.trim() || !playerEditData.age?.toString().trim() || !playerEditData.nationality?.trim()) {
        setEditPlayerFieldErrors({
          name: !playerEditData.name?.trim() ? 'Name is required' : '',
          position: !playerEditData.position?.trim() ? 'Position is required' : '',
          age: !playerEditData.age?.toString().trim() ? 'Age is required' : '',
          nationality: !playerEditData.nationality?.trim() ? 'Nationality is required' : '',
        });
        setSavingPlayer(false);
        return;
      }
      if (!/^\d+$/.test(playerEditData.age?.toString() || '') || Number(playerEditData.age) <= 0) {
        setEditPlayerFieldErrors({
          age: 'Age must be a positive number',
        });
        setSavingPlayer(false);
        return;
      }
      const res = await fetch(`/api/players/${editingPlayerId}?userId=${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(playerEditData),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to update player");
      }
      const updated = await res.json();
      setTeam(prev => prev ? {
        ...prev,
        players: prev.players.map(p => p.id === updated.id ? updated : p)
      } : prev);
      setEditingPlayerId(null);
      setPlayerEditData({});
    } catch (err: any) {
      setError(err.message || "Failed to update player");
    } finally {
      setSavingPlayer(false);
    }
  };
  const handlePlayerEditCancel = () => {
    setEditingPlayerId(null);
    setPlayerEditData({});
  };

  // Add handler for opening modal
  const handleOpenAddPlayer = () => {
    setShowAddPlayerModal(true);
    setNewPlayer({ name: '', position: '', age: '', nationality: '' });
    setAddPlayerError(null);
  };
  const handleCloseAddPlayer = () => {
    setShowAddPlayerModal(false);
    setNewPlayer({ name: '', position: '', age: '', nationality: '' });
    setAddPlayerError(null);
  };

  // Add handler for input change
  const handleNewPlayerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewPlayer({ ...newPlayer, [e.target.name]: e.target.value });
  };

  // Add handler for submit
  const handleAddPlayer = async () => {
    setAddingPlayer(true);
    setError(null);
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        router.push('/');
        return;
      }

      const user = JSON.parse(userStr);
      if (!user.id) {
        router.push('/');
        return;
      }

      if (!newPlayer.name.trim() || !newPlayer.position.trim() || !newPlayer.age.trim() || !newPlayer.nationality.trim()) {
        setAddPlayerFieldErrors({
          name: !newPlayer.name.trim() ? 'Name is required' : '',
          position: !newPlayer.position.trim() ? 'Position is required' : '',
          age: !newPlayer.age.trim() ? 'Age is required' : '',
          nationality: !newPlayer.nationality.trim() ? 'Nationality is required' : '',
        });
        setAddingPlayer(false);
        return;
      }
      if (!/^\d+$/.test(newPlayer.age) || Number(newPlayer.age) <= 0) {
        setAddPlayerFieldErrors({
          age: 'Age must be a positive number',
        });
        setAddingPlayer(false);
        return;
      }
      const res = await fetch(`/api/players?userId=${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newPlayer,
          age: newPlayer.age ? Number(newPlayer.age) : null,
          team_id: teamId,
          userId: user.id
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to add player');
      }
      const created = await res.json();
      setTeam(prev => prev ? { ...prev, players: [...prev.players, created] } : prev);
      handleCloseAddPlayer();
    } catch (err: any) {
      setError(err.message || 'Failed to add player');
    } finally {
      setAddingPlayer(false);
    }
  };

  // Add handler for delete
  const handleDeletePlayer = async (playerId: number) => {
    if (!window.confirm('Are you sure you want to delete this player?')) return;
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        router.push('/');
        return;
      }

      const user = JSON.parse(userStr);
      if (!user.id) {
        router.push('/');
        return;
      }

      const res = await fetch(`/api/players/${playerId}?userId=${user.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to delete player');
      }
      setTeam(prev => prev ? { ...prev, players: prev.players.filter(p => p.id !== playerId) } : prev);
    } catch (err: any) {
      setError(err.message || 'Failed to delete player');
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="bg-[#1d1d1d] p-8 rounded-lg shadow-lg">
          <h1 className="text-2xl font-semibold text-white">Loading...</h1>
        </div>
      </div>
    );
  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="bg-[#1d1d1d] p-8 rounded-lg shadow-lg">
          <h1 className="text-2xl font-semibold text-red-500 mb-2">{error}</h1>
        </div>
      </div>
    );
  if (!team) return null;

  return (
    <div className="min-h-screen bg-black py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Team Header */}
        <div className="bg-[#1d1d1d] rounded-lg shadow-lg p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                {editInfoMode ? (
                  <input
                    name="name"
                    value={infoData.name}
                    onChange={handleInfoChange}
                    className="text-4xl font-bold text-white mb-2 bg-gray-800 border border-gray-600 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors w-full max-w-md"
                  />
                ) : (
                  <h1 className="text-4xl font-bold text-white mb-2">{team.name}</h1>
                )}
                {editInfoMode ? (
                  <input
                    name="abbreviation"
                    value={infoData.abbreviation}
                    onChange={handleInfoChange}
                    className="ml-2 bg-gray-800 border border-gray-600 rounded p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors w-32 cursor-pointer"
                    placeholder="Abbreviation"
                    maxLength={4}
                  />
                ) : (
                  team.abbreviation && <span className="ml-2 text-lg text-blue-400 font-mono">({team.abbreviation})</span>
                )}
                <button
                  onClick={() => setEditInfoMode((v) => !v)}
                  className="ml-2 p-2 rounded hover:bg-gray-700 cursor-pointer"
                  title="Edit team info"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-400 hover:text-blue-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-2.828 0L9 13zm0 0L4 19l5-1 1-5z"
                    />
                  </svg>
                </button>
              </div>
              <div className="flex flex-wrap gap-4 text-gray-400 mt-2">
                <p className="flex items-center">
                  <span className="font-medium text-gray-300">Coach:</span>
                  {editInfoMode ? (
                    <input
                      name="coach_name"
                      value={infoData.coach_name}
                      onChange={handleInfoChange}
                      className="ml-2 bg-gray-800 border border-gray-600 rounded p-1 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  ) : (
                    <span className="ml-2">{team.coach_name}</span>
                  )}
                </p>
                <p className="flex items-center">
                  <span className="font-medium text-gray-300">Stadium:</span>
                  {editInfoMode ? (
                    <input
                      name="home_stadium"
                      value={infoData.home_stadium}
                      onChange={handleInfoChange}
                      className="ml-2 bg-gray-800 border border-gray-600 rounded p-1 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  ) : (
                    <span className="ml-2">{team.home_stadium}</span>
                  )}
                </p>
                <p className="flex items-center">
                  <span className="font-medium text-gray-300">Founded:</span>
                  {editInfoMode ? (
                    <input
                      name="founded_year"
                      value={infoData.founded_year}
                      onChange={handleInfoChange}
                      className="ml-2 bg-gray-800 border border-gray-600 rounded p-1 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors w-20"
                    />
                  ) : (
                    <span className="ml-2">{team.founded_year}</span>
                  )}
                </p>
                <p className="flex items-center">
                  <span className="font-medium text-gray-300">Country:</span>
                  {editInfoMode ? (
                    <input
                      name="country"
                      value={infoData.country}
                      onChange={handleInfoChange}
                      className="ml-2 bg-gray-800 border border-gray-600 rounded p-1 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  ) : (
                    <span className="ml-2">{team.country}</span>
                  )}
                </p>
              </div>
              {editInfoMode && (
                <div className="flex gap-4 mt-4">
                  <button
                    onClick={handleInfoSave}
                    className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 cursor-pointer"
                    disabled={savingInfo}
                  >
                    {savingInfo ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={() => {
                      setEditInfoMode(false);
                      setInfoData({
                        name: team.name,
                        abbreviation: team.abbreviation || "",
                        coach_name: team.coach_name,
                        home_stadium: team.home_stadium,
                        founded_year: team.founded_year,
                        country: team.country,
                      });
                    }}
                    className="px-4 py-2 rounded bg-gray-600 text-white hover:bg-gray-700 cursor-pointer"
                    disabled={savingInfo}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Team Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-[#1d1d1d] rounded-lg shadow-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-white">Team Statistics</h2>
              <button
                onClick={() => setEditStatsMode((v) => !v)}
                className="ml-2 p-2 rounded hover:bg-gray-700 cursor-pointer"
                title="Edit team stats"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-400 hover:text-blue-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-2.828 0L9 13zm0 0L4 19l5-1 1-5z"
                  />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-6">
              {[
                { label: "Wins", name: "wins", color: "text-blue-400" },
                { label: "Draws", name: "draws", color: "text-green-400" },
                { label: "Losses", name: "losses", color: "text-red-400" },
                { label: "Goals Scored", name: "goals_scored", color: "text-purple-400" },
                { label: "Goals Conceded", name: "goals_conceded", color: "text-orange-400" },
              ].map((stat) => (
                <div key={stat.name} className="bg-gray-800 rounded-lg p-4">
                  <p className={`text-sm font-medium ${stat.color}`}>{stat.label}</p>
                  {editStatsMode ? (
                    <input
                      type="number"
                      min="0"
                      name={stat.name}
                      value={statsData[stat.name]}
                      onChange={handleStatsChange}
                      className="w-full p-2 rounded bg-gray-900 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  ) : (
                    <p className="text-3xl font-bold text-white">
                      {stat.name === "wins" && team.wins}
                      {stat.name === "draws" && team.draws}
                      {stat.name === "losses" && team.losses}
                      {stat.name === "goals_scored" && team.goals_scored}
                      {stat.name === "goals_conceded" && team.goals_conceded}
                    </p>
                  )}
                </div>
              ))}
            </div>
            {editStatsMode && (
              <div className="flex gap-4 mt-4">
                <button
                  onClick={handleStatsSave}
                  className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 cursor-pointer"
                  disabled={savingStats}
                >
                  {savingStats ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => {
                    setEditStatsMode(false);
                    setStatsData({
                      wins: team.wins,
                      draws: team.draws,
                      losses: team.losses,
                      goals_scored: team.goals_scored,
                      goals_conceded: team.goals_conceded,
                    });
                  }}
                  className="px-4 py-2 rounded bg-gray-600 text-white hover:bg-gray-700 cursor-pointer"
                  disabled={savingStats}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Squad Overview */}
          <div className="bg-[#1d1d1d] rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-white mb-6">Squad Overview</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Total Players</span>
                <span className="text-2xl font-bold text-white">{team.players ? team.players.length : 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Average Age</span>
                <span className="text-2xl font-bold text-white">
                  {team.players && team.players.length > 0
                    ? Math.round(
                        team.players.reduce((acc: number, player: PlayerType) => acc + (player.age || 0), 0) / team.players.length
                      )
                    : "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Players Table */}
        <div className="bg-[#1d1d1d] rounded-lg shadow-lg overflow-hidden">
          <div className="p-8">
            <h2 className="text-2xl font-semibold text-white mb-6">Squad Players</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-700">
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">
                    Age
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">
                    Nationality
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {team.players.map((player: PlayerType) => (
                  editingPlayerId === player.id ? (
                    <tr key={player.id} className="hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">
                          <input
                            name="name"
                            value={playerEditData.name ?? ""}
                            onChange={handlePlayerEditChange}
                            className="text-white bg-gray-800 border border-gray-600 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors w-full max-w-md"
                          />
                          {editPlayerFieldErrors.name && <p className="text-red-500 text-xs mt-1">{editPlayerFieldErrors.name}</p>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-400">
                          <input
                            name="position"
                            value={playerEditData.position ?? ""}
                            onChange={handlePlayerEditChange}
                            className="text-white bg-gray-800 border border-gray-600 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors w-full max-w-md"
                          />
                          {editPlayerFieldErrors.position && <p className="text-red-500 text-xs mt-1">{editPlayerFieldErrors.position}</p>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-400">
                          <input
                            name="age"
                            value={playerEditData.age?.toString() ?? ""}
                            onChange={handlePlayerEditChange}
                            className="text-white bg-gray-800 border border-gray-600 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors w-full max-w-md"
                          />
                          {editPlayerFieldErrors.age && <p className="text-red-500 text-xs mt-1">{editPlayerFieldErrors.age}</p>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-400">
                          <input
                            name="nationality"
                            value={playerEditData.nationality ?? ""}
                            onChange={handlePlayerEditChange}
                            className="text-white bg-gray-800 border border-gray-600 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors w-full max-w-md"
                          />
                          {editPlayerFieldErrors.nationality && <p className="text-red-500 text-xs mt-1">{editPlayerFieldErrors.nationality}</p>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-400">
                          <button
                            onClick={handlePlayerEditSave}
                            disabled={savingPlayer}
                            className="text-white bg-gray-800 border border-gray-600 rounded p-2 hover:bg-gray-700 transition-colors cursor-pointer"
                          >
                            Save
                          </button>
                          <button
                            onClick={handlePlayerEditCancel}
                            disabled={savingPlayer}
                            className="text-white bg-gray-800 border border-gray-600 rounded p-2 hover:bg-gray-700 transition-colors ml-2 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={player.id} className="hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">{player.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-400">{player.position ?? "N/A"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-400">{player.age ?? "Unknown"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-400">{player.nationality ?? "Unknown"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-400">
                          <button
                            onClick={() => handlePlayerEdit(player)}
                            className="text-white bg-gray-800 border border-gray-600 rounded p-2 hover:bg-gray-700 transition-colors cursor-pointer"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 text-gray-400 hover:text-blue-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-2.828 0L9 13zm0 0L4 19l5-1 1-5z"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-400">
                          <button
                            onClick={() => handleDeletePlayer(player.id)}
                            className="ml-2 p-2 rounded hover:bg-red-700 cursor-pointer"
                            title="Delete player"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 text-red-500 hover:text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Player Button */}
        <div className="mt-8">
          <button
            onClick={handleOpenAddPlayer}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow cursor-pointer"
          >
            Add Player
          </button>
        </div>
      </div>

      {/* Add Player Modal */}
      {showAddPlayerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-[#1d1d1d] p-6 rounded-lg shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">Add Player</h2>
              <button onClick={handleCloseAddPlayer} className="text-gray-400 hover:text-white cursor-pointer">✕</button>
            </div>
            <div className="space-y-4">
              <input name="name" value={newPlayer.name} onChange={handleNewPlayerChange} placeholder="Name" className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" />
              {addPlayerFieldErrors.name && <p className="text-red-500 text-xs mt-1">{addPlayerFieldErrors.name}</p>}
              <input name="position" value={newPlayer.position} onChange={handleNewPlayerChange} placeholder="Position" className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" />
              {addPlayerFieldErrors.position && <p className="text-red-500 text-xs mt-1">{addPlayerFieldErrors.position}</p>}
              <input name="age" value={newPlayer.age} onChange={handleNewPlayerChange} placeholder="Age" type="number" min="0" className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" />
              {addPlayerFieldErrors.age && <p className="text-red-500 text-xs mt-1">{addPlayerFieldErrors.age}</p>}
              <input name="nationality" value={newPlayer.nationality} onChange={handleNewPlayerChange} placeholder="Nationality" className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" />
              {addPlayerFieldErrors.nationality && <p className="text-red-500 text-xs mt-1">{addPlayerFieldErrors.nationality}</p>}
              {addPlayerError && <p className="text-red-500 text-sm">{addPlayerError}</p>}
            </div>
            <div className="flex justify-end gap-4 mt-6 border-t border-gray-700 pt-4">
              <button onClick={handleCloseAddPlayer} className="px-4 py-2 rounded bg-gray-600 cursor-pointer">Cancel</button>
              <button onClick={handleAddPlayer} className="px-4 py-2 rounded bg-green-600 cursor-pointer" disabled={addingPlayer}>{addingPlayer ? 'Adding...' : 'Add Player'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}