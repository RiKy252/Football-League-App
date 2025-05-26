import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';
import { logAction } from '@/lib/monitoring';

const prisma = new PrismaClient();

type RouteContext = {
  params: {
    id: string;
  };
};

export async function GET(
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

    const playerId = parseInt(context.params.id);
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: { team: true },
    });

    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    if (player.team.userId !== parseInt(userId)) {
      return NextResponse.json(
        { error: 'Unauthorized to view this player' },
        { status: 403 }
      );
    }

    // Log the read action
    await logAction(parseInt(userId), 'READ', 'Player', playerId);

    return NextResponse.json(player);
  } catch (error) {
    console.error('Error fetching player:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    const playerId = parseInt(context.params.id);
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: { team: true },
    });

    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    if (player.team.userId !== parseInt(userId)) {
      return NextResponse.json(
        { error: 'Unauthorized to update this player' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, position, age, nationality } = body;

    // Create update data object with only provided fields
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (position !== undefined) updateData.position = position;
    if (age !== undefined) updateData.age = Number(age);
    if (nationality !== undefined) updateData.nationality = nationality;

    const updatedPlayer = await prisma.player.update({
      where: { id: playerId },
      data: updateData,
    });

    // Log the update action
    await logAction(parseInt(userId), 'UPDATE', 'Player', playerId, `Updated player: ${name || player.name}`);

    return NextResponse.json(updatedPlayer);
  } catch (error) {
    console.error('Error updating player:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

interface UpdatePlayerData {
  name?: string;
  position?: string;
  teamId?: string;
  // Add other fields that can be updated
}

const updateData: UpdatePlayerData = {};

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

    const playerId = parseInt(context.params.id);
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: { team: true },
    });

    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    if (player.team.userId !== parseInt(userId)) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this player' },
        { status: 403 }
      );
    }

    await prisma.player.delete({
      where: { id: playerId },
    });

    // Log the delete action
    await logAction(parseInt(userId), 'DELETE', 'Player', playerId, `Deleted player: ${player.name}`);

    return NextResponse.json({ message: 'Player deleted successfully' });
  } catch (error) {
    console.error('Error deleting player:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 