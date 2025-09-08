/**
 * POST /api/auth/user - Simple User Authentication/Creation
 * Creates or authenticates users for progress tracking
 */

import { authQueries } from '../../../../../lib/database/queries';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, guestId, preferredName } = body;

    // Validate that we have either email or guestId
    if (!email && !guestId) {
      return Response.json({ 
        error: 'Either email or guestId is required' 
      }, { status: 400 });
    }

    const userData = await authQueries.createOrAuthenticateUser({
      email,
      guestId,
      preferredName
    });

    return Response.json(userData);

  } catch (error) {
    console.error('Error in /api/auth/user:', error);
    return Response.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}