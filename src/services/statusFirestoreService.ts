import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  Unsubscribe,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import type { StatusItem } from '../types';

function clampString(value: string, maxLen: number): string {
  return value.trim().slice(0, maxLen);
}

function sanitizeId(value: string): string {
  const cleaned = value.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  return cleaned || `id_${Date.now()}`;
}

export function sanitizeReactions(
  reactions: { emoji: string; userId: string }[]
): { emoji: string; userId: string }[] {
  return reactions
    .slice(-100)
    .filter((r) => typeof r.emoji === 'string' && r.emoji.length > 0 && typeof r.userId === 'string')
    .map((r) => ({
      emoji: clampString(r.emoji, 16),
      userId: sanitizeId(r.userId),
    }));
}

export function sanitizeViewers(
  viewers: { userId: string; userName: string; timestamp: number }[]
): { userId: string; userName: string; timestamp: number }[] {
  return viewers.slice(-100).map((v) => ({
    userId: sanitizeId(v.userId),
    userName: clampString(v.userName || 'User', 80),
    timestamp: Number(v.timestamp) || Date.now(),
  }));
}

export function subscribeToStatuses(
  onUpdate: (statuses: StatusItem[]) => void
): Unsubscribe {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    return () => {};
  }

  const statusesQuery = query(
    collection(db, 'statuses'),
    where('visibility', '==', 'everyone')
  );

  return onSnapshot(
    statusesQuery,
    (snapshot) => {
      const items: StatusItem[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          userId: String(data.userId || ''),
          userName: String(data.userName || 'User'),
          userAvatar: String(data.userAvatar || ''),
          type: (data.type as StatusItem['type']) || 'text',
          content: String(data.content || ''),
          caption: typeof data.caption === 'string' ? data.caption : undefined,
          backgroundColor: typeof data.backgroundColor === 'string' ? data.backgroundColor : undefined,
          musicTitle: typeof data.musicTitle === 'string' ? data.musicTitle : undefined,
          timestamp: Number(data.timestamp) || Date.now(),
          expiresAt: Number(data.expiresAt) || Date.now() + 86400000,
          viewers: Array.isArray(data.viewers) ? data.viewers : [],
          reactions: Array.isArray(data.reactions) ? data.reactions : [],
        };
      });
      items.sort((a, b) => b.timestamp - a.timestamp);
      onUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'statuses');
    }
  );
}

export async function createStatusInFirestore(status: StatusItem): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) return;

  const statusId = sanitizeId(status.id);
  const path = `statuses/${statusId}`;
  const statusRef = doc(db, 'statuses', statusId);

  const payload: Record<string, unknown> = {
    id: statusId,
    userId: sanitizeId(currentUser.uid),
    userName: clampString(status.userName || currentUser.displayName || 'User', 80),
    userAvatar: clampString(status.userAvatar || currentUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250', 500),
    type: status.type,
    content: clampString(status.content, 2000),
    visibility: 'everyone',
    timestamp: Number(status.timestamp) || Date.now(),
    expiresAt: Number(status.expiresAt) || Date.now() + 86400000,
    reactions: sanitizeReactions(status.reactions || []),
    viewers: sanitizeViewers(status.viewers || []),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (status.caption) {
    payload.caption = clampString(status.caption, 300);
  }
  if (status.backgroundColor) {
    payload.backgroundColor = clampString(status.backgroundColor, 20);
  }
  if (status.musicTitle) {
    payload.musicTitle = clampString(status.musicTitle, 100);
  }

  try {
    await setDoc(statusRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateStatusReactionsInFirestore(
  statusId: string,
  reactions: { emoji: string; userId: string }[]
): Promise<boolean> {
  const currentUser = auth.currentUser;
  if (!currentUser) return false;

  const safeId = sanitizeId(statusId);
  const path = `statuses/${safeId}`;
  const statusRef = doc(db, 'statuses', safeId);

  let existsInFirestore = false;
  try {
    const snap = await getDoc(statusRef);
    existsInFirestore = snap.exists();
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }

  if (!existsInFirestore) {
    return false;
  }

  try {
    await updateDoc(statusRef, {
      reactions: sanitizeReactions(reactions),
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
