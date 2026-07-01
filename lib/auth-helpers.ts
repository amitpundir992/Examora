import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * Get the current authenticated user session.
 * Returns null if not authenticated.
 */
export async function getSession() {
  return await auth();
}

/**
 * Require authentication for API routes.
 * Returns user session if authenticated, or error response if not.
 */
export async function requireAuth() {
  const session = await getSession();
  
  if (!session?.user?.id) {
    return {
      error: NextResponse.json(
        { error: "Unauthorized. Please sign in to continue." },
        { status: 401 }
      ),
      user: null,
    };
  }

  return {
    error: null,
    user: {
      id: session.user.id,
      email: session.user.email!,
      name: session.user.name,
      image: session.user.image,
    },
  };
}
