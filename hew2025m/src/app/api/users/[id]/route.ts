import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { sanitizeUserInput } from '@/lib/sanitize';
import { requireAuth } from '@/lib/simpleAuth';

const MAX_DISPLAY_NAME_LENGTH = 15;
const MAX_BIO_LENGTH = 140;
const MAX_PHOTO_URL_LENGTH = 2048;
const ALLOWED_PATCH_KEYS = new Set(['displayName', 'bio', 'photoURL']);

type ProfilePatchInput = {
  displayName?: string;
  bio?: string;
  photoURL?: string;
};

function validateProfilePatch(input: Record<string, unknown>): { updates?: ProfilePatchInput; error?: string } {
  const keys = Object.keys(input);

  if (keys.length === 0) {
    return { error: 'No fields provided' };
  }

  if (keys.some((key) => !ALLOWED_PATCH_KEYS.has(key))) {
    return { error: 'Unsupported fields in request body' };
  }

  const updates: ProfilePatchInput = {};

  if ('displayName' in input) {
    if (typeof input.displayName !== 'string') {
      return { error: 'displayName must be a string' };
    }
    const displayName = input.displayName.trim();
    if (displayName.length > MAX_DISPLAY_NAME_LENGTH) {
      return { error: `displayName must be ${MAX_DISPLAY_NAME_LENGTH} characters or less` };
    }
    updates.displayName = displayName;
  }

  if ('bio' in input) {
    if (typeof input.bio !== 'string') {
      return { error: 'bio must be a string' };
    }
    const bio = input.bio.trim();
    if (bio.length > MAX_BIO_LENGTH) {
      return { error: `bio must be ${MAX_BIO_LENGTH} characters or less` };
    }
    updates.bio = bio;
  }

  if ('photoURL' in input) {
    if (typeof input.photoURL !== 'string') {
      return { error: 'photoURL must be a string' };
    }
    const photoURL = input.photoURL.trim();
    if (photoURL.length > MAX_PHOTO_URL_LENGTH) {
      return { error: 'photoURL is too long' };
    }
    updates.photoURL = photoURL;
  }

  if (Object.keys(updates).length === 0) {
    return { error: 'No valid fields provided' };
  }

  return { updates };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userIdOrError = await requireAuth(request);
    if (userIdOrError instanceof Response) {
      return userIdOrError;
    }

    const authUserId = userIdOrError as string;
    const { id } = await params;

    if (authUserId !== id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const rawBody = await request.json();
    if (!rawBody || typeof rawBody !== 'object' || Array.isArray(rawBody)) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const sanitizedBody = sanitizeUserInput(rawBody) as Record<string, unknown>;
    const validation = validateProfilePatch(sanitizedBody);
    if (!validation.updates) {
      return NextResponse.json(
        { error: validation.error ?? 'Invalid update payload' },
        { status: 400 }
      );
    }

    await adminDb.collection('users').doc(authUserId).set(
      {
        ...validation.updates,
        updatedAt: new Date(),
      },
      { merge: true }
    );

    return NextResponse.json({
      success: true,
      profile: validation.updates,
    });
  } catch (error) {
    console.error('Update user profile error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
