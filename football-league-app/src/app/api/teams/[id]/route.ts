import { PrismaClient } from '@/generated/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { logAction } from '@/lib/monitoring';

const prisma = new PrismaClient();

type RouteContext = {
  params: {
    id: string;
  };
};

export async function GET(
  req: NextRequest,
  context: RouteContext
) {
  const id = context.params.id;
  console.log("Fetching team with ID:", id);

  const teamId = parseInt(id);
  if (isNaN(teamId)) {
    return new Response(JSON.stringify({ message: "Invalid team ID" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { players: true },
    });

    if (!team) {
      return new Response(JSON.stringify({ message: "Team not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Log the read action
    await logAction(team.userId, 'READ', 'Team', teamId);

    return new Response(JSON.stringify(team), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching team:", error);
    return new Response(JSON.stringify({ message: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function PATCH(
  req: NextRequest,
  context: RouteContext
) {
  const id = context.params.id;
  const teamId = parseInt(id);

  if (isNaN(teamId)) {
    return new Response(JSON.stringify({ message: "Invalid team ID" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { 
      name, 
      abbreviation, 
      coach_name, 
      home_stadium, 
      founded_year, 
      country, 
      wins, 
      draws, 
      losses, 
      goals_scored, 
      goals_conceded 
    } = body;

    // Check if team exists first
    const existingTeam = await prisma.team.findUnique({
      where: { id: teamId },
      include: { players: true },
    });

    if (!existingTeam) {
      return new Response(JSON.stringify({ message: "Team not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate abbreviation if provided
    if (abbreviation && abbreviation.length > 4) {
      return new Response(JSON.stringify({ message: "Abbreviation must be at most 4 characters long." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create update data object with only provided fields
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (abbreviation !== undefined) updateData.abbreviation = abbreviation;
    if (coach_name !== undefined) updateData.coach_name = coach_name;
    if (home_stadium !== undefined) updateData.home_stadium = home_stadium;
    if (founded_year !== undefined) updateData.founded_year = founded_year;
    if (country !== undefined) updateData.country = country;
    if (wins !== undefined) updateData.wins = Number(wins);
    if (draws !== undefined) updateData.draws = Number(draws);
    if (losses !== undefined) updateData.losses = Number(losses);
    if (goals_scored !== undefined) updateData.goals_scored = Number(goals_scored);
    if (goals_conceded !== undefined) updateData.goals_conceded = Number(goals_conceded);

    // Update team with only the provided fields
    const updatedTeam = await prisma.team.update({
      where: { id: teamId },
      data: updateData,
      include: { players: true },
    });

    // Log the update action
    await logAction(existingTeam.userId, 'UPDATE', 'Team', teamId, `Updated team: ${name || existingTeam.name}`);

    return new Response(JSON.stringify(updatedTeam), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating team:", error);
    return new Response(JSON.stringify({ message: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

interface UpdateTeamData {
  name?: string;
  city?: string;
  stadium?: string;
  // Add other fields that can be updated
}

const updateData: UpdateTeamData = {};

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const teamId = parseInt(context.params.id);
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    if (team.userId !== parseInt(userId)) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this team' },
        { status: 403 }
      );
    }

    await prisma.team.delete({
      where: { id: teamId },
    });

    // Log the delete action
    await logAction(parseInt(userId), 'DELETE', 'Team', teamId, `Deleted team: ${team.name}`);

    return NextResponse.json({ message: 'Team deleted successfully' });
  } catch (error) {
    console.error('Error deleting team:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}