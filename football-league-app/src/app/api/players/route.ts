import { PrismaClient } from '@prisma/client';
import { logAction } from '@/lib/monitoring';
import { NextRequest } from 'next/server';

const prisma = new PrismaClient();

// GET /api/players?teamId=1
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const teamId = searchParams.get('teamId');
  const userId = searchParams.get('userId');
  let where = {};
  if (teamId) {
    const tid = parseInt(teamId);
    if (!isNaN(tid)) {
      where = { team_id: tid };
    }
  }
  try {
    const players = await prisma.player.findMany({ where });
    if (userId) {
      await logAction(parseInt(userId), 'READ', 'Player');
    }
    return new Response(JSON.stringify(players), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('GET /api/players error:', error);
    return new Response(JSON.stringify({ message: 'Internal server error' }), { status: 500 });
  }
}

// POST /api/players
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const { name, position, age, nationality, team_id } = body;
    
    if (!userId) {
      return new Response(JSON.stringify({ message: 'User ID is required' }), { status: 400 });
    }
    
    if (!name || !team_id) {
      return new Response(JSON.stringify({ message: 'Player name and team_id are required' }), { status: 400 });
    }

    // Verify that the team belongs to the user
    const team = await prisma.team.findUnique({
      where: { id: Number(team_id) }
    });

    if (!team) {
      return new Response(JSON.stringify({ message: 'Team not found' }), { status: 404 });
    }

    if (team.userId !== parseInt(userId)) {
      return new Response(JSON.stringify({ message: 'Unauthorized to add player to this team' }), { status: 403 });
    }

    const newPlayer = await prisma.player.create({
      data: {
        name,
        position,
        age: age !== undefined ? Number(age) : null,
        nationality,
        team_id: Number(team_id),
      },
    });

    // Log the create action
    await logAction(parseInt(userId), 'CREATE', 'Player', newPlayer.id, `Created player: ${name}`);

    return new Response(JSON.stringify(newPlayer), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('POST /api/players error:', error);
    return new Response(JSON.stringify({ message: 'Internal server error' }), { status: 500 });
  }
} 