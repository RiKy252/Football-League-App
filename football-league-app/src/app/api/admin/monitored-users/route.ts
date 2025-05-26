import { NextResponse } from 'next/server';
import { getMonitoredUsers } from '@/lib/monitoring';

// Mark this route as dynamic
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const userData = request.headers.get('user-data');
    if (!userData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = JSON.parse(userData);
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const monitoredUsers = await getMonitoredUsers();
    return NextResponse.json(monitoredUsers);
  } catch (error) {
    console.error('Error fetching monitored users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 