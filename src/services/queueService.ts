import {
  doc,
  onSnapshot,
  runTransaction,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from '../firebase.ts';
import { QueueState, RepItem, ActivityEvent } from '../types.ts';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const QUEUE_DOC_PATH = 'queue_state';
const QUEUE_DOC_ID = 'current';

export const DEFAULT_PRESETS = [
  'Steve', 'Josh', 'Zarina', 'Derek', 'Devyn',
  'Taylor', 'Amber', 'Takaiya', 'JP', 'Jesse', 'John'
];

export const INITIAL_STATE: QueueState = {
  reps: [
    { id: 'rep-mueup4dsyu2n', name: 'Steve', checked: false, status: 'available', upCount: 0, statusChangedAt: Date.now() },
    { id: 'rep-mueup6g0xlzs', name: 'Derek', checked: false, status: 'available', upCount: 0, statusChangedAt: Date.now() },
    { id: 'rep-mueup78nbsd6', name: 'Devyn', checked: false, status: 'available', upCount: 0, statusChangedAt: Date.now() }
  ],
  activity: [
    { id: 'act-init', timestamp: Date.now(), text: 'Store floor board online', type: 'reset' }
  ],
  presets: DEFAULT_PRESETS,
  lastResetDate: getStoreTodayString(),
  autoResetEnabled: true,
  timezone: 'America/Los_Angeles'
};

export function getStoreTodayString(tz?: string): string {
  const storeTz = tz || 'America/Los_Angeles';
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: storeTz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date());
  } catch {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}

export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as any;
  }
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map(sanitizeForFirestore) as any;
  }
  if (typeof data === 'object') {
    const clean: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        clean[key] = sanitizeForFirestore(value);
      }
    }
    return clean as any;
  }
  return data;
}

function checkDailyReset(state: QueueState): { updated: boolean; state: QueueState } {
  const today = getStoreTodayString(state.timezone);
  if (state.lastResetDate !== today) {
    const updatedReps = state.reps.map((r) => ({
      ...r,
      upCount: 0,
      statusChangedAt: Date.now()
    }));
    const newActivity: ActivityEvent = {
      id: 'act-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      timestamp: Date.now(),
      text: 'Midnight daily reset: Up counts zeroed & floor times reset',
      type: 'reset'
    };
    return {
      updated: true,
      state: {
        ...state,
        reps: updatedReps,
        lastResetDate: today,
        activity: [newActivity, ...state.activity.slice(0, 49)]
      }
    };
  }
  return { updated: false, state };
}

// Subscribe to real-time updates from Firestore
export function subscribeToQueue(
  onUpdate: (state: QueueState) => void,
  onError?: (err: Error) => void
): () => void {
  const docRef = doc(db, QUEUE_DOC_PATH, QUEUE_DOC_ID);

  const unsubscribe = onSnapshot(
    docRef,
    async (snapshot) => {
      if (!snapshot.exists()) {
        // First run: Initialize document with default state
        try {
          await setDoc(docRef, sanitizeForFirestore({
            ...INITIAL_STATE,
            undoStack: [],
            updatedAt: Date.now()
          }));
        } catch (e) {
          console.error('Failed to initialize queue document in Firestore:', e);
          handleFirestoreError(e, OperationType.WRITE, `${QUEUE_DOC_PATH}/${QUEUE_DOC_ID}`);
        }
        return;
      }

      const data = snapshot.data();
      const rawState: QueueState = {
        reps: Array.isArray(data.reps) ? data.reps : INITIAL_STATE.reps,
        activity: Array.isArray(data.activity) ? data.activity : INITIAL_STATE.activity,
        presets: Array.isArray(data.presets) ? data.presets : INITIAL_STATE.presets,
        lastResetDate: data.lastResetDate || getStoreTodayString(),
        autoResetEnabled: true,
        timezone: data.timezone || 'America/Los_Angeles'
      };

      // Check if daily midnight reset needs to run
      const resetCheck = checkDailyReset(rawState);
      if (resetCheck.updated) {
        // Trigger server update for midnight rollover
        executeQueueAction({ type: 'INTERNAL_MIDNIGHT_RESET' }).catch(() => {});
      }

      onUpdate(resetCheck.state);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, `${QUEUE_DOC_PATH}/${QUEUE_DOC_ID}`);
    }
  );

  return unsubscribe;
}

// Pure action reducer applied inside a transaction to guarantee latest server state
export function applyAction(
  currentState: QueueState,
  action: any
): { success: boolean; state: QueueState; message?: string } {
  // Clone state to prevent in-place mutation issues
  const state: QueueState = {
    ...currentState,
    reps: currentState.reps.map((r) => ({ ...r })),
    activity: [...currentState.activity],
    presets: [...currentState.presets]
  };

  const logActivity = (text: string, type: ActivityEvent['type'], repName?: string) => {
    const event: ActivityEvent = {
      id: 'act-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      timestamp: Date.now(),
      text,
      type
    };
    if (repName) {
      event.repName = repName;
    }
    state.activity.unshift(event);
    if (state.activity.length > 50) {
      state.activity.pop();
    }
  };

  switch (action.type) {
    case 'TOGGLE': {
      const { repId } = action;
      const index = state.reps.findIndex((r) => r.id === repId);
      if (index === -1) return { success: false, state, message: 'Rep not found' };

      const [rep] = state.reps.splice(index, 1);
      const willBeChecked = !rep.checked;
      rep.checked = willBeChecked;
      rep.statusChangedAt = Date.now();

      if (willBeChecked) {
        rep.status = 'busy';
        rep.upCount = (rep.upCount || 0) + 1;
        const boundary = state.reps.findIndex((r) => r.checked);
        if (boundary === -1) state.reps.push(rep);
        else state.reps.splice(boundary, 0, rep);
        logActivity(`${rep.name} checked`, 'toggle', rep.name);
      } else {
        rep.status = 'available';
        const boundary = state.reps.findIndex((r) => r.checked);
        if (boundary === -1) state.reps.push(rep);
        else state.reps.splice(boundary, 0, rep);
        logActivity(`${rep.name} returned to floor`, 'toggle', rep.name);
      }
      break;
    }

    case 'ASSIGN_WALKIN': {
      const nextIndex = state.reps.findIndex((r) => !r.checked);
      if (nextIndex === -1) return { success: false, state, message: 'No names available on the floor' };

      const [rep] = state.reps.splice(nextIndex, 1);
      rep.checked = true;
      rep.status = 'busy';
      rep.upCount = (rep.upCount || 0) + 1;
      rep.statusChangedAt = Date.now();

      const boundary = state.reps.findIndex((r) => r.checked);
      if (boundary === -1) state.reps.push(rep);
      else state.reps.splice(boundary, 0, rep);

      logActivity(`${rep.name} checked`, 'walkin', rep.name);
      break;
    }

    case 'ASSIGN_APPOINTMENT': {
      const { repId, note } = action;
      const index = state.reps.findIndex((r) => r.id === repId);
      if (index === -1) return { success: false, state, message: 'Rep not found' };

      const [rep] = state.reps.splice(index, 1);
      rep.checked = true;
      rep.status = 'appointment';
      rep.upCount = (rep.upCount || 0) + 1;
      rep.statusChangedAt = Date.now();
      if (note) rep.note = note;

      const boundary = state.reps.findIndex((r) => r.checked);
      if (boundary === -1) state.reps.push(rep);
      else state.reps.splice(boundary, 0, rep);

      logActivity(
        `${rep.name} checked${note ? ` (${note})` : ''}`,
        'appointment',
        rep.name
      );
      break;
    }

    case 'ADD_REP': {
      const { name, checked = false } = action;
      if (!name || typeof name !== 'string' || !name.trim()) {
        return { success: false, state, message: 'Name cannot be blank' };
      }
      const cleanName = name.trim();
      const newRep: RepItem = {
        id: 'rep-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        name: cleanName,
        checked: Boolean(checked),
        status: checked ? 'busy' : 'available',
        upCount: 0,
        statusChangedAt: Date.now()
      };

      if (!checked) {
        const boundary = state.reps.findIndex((r) => r.checked);
        if (boundary === -1) state.reps.push(newRep);
        else state.reps.splice(boundary, 0, newRep);
      } else {
        state.reps.push(newRep);
      }

      logActivity(`${cleanName} added`, 'add', cleanName);
      break;
    }

    case 'REMOVE_REP': {
      const { repId } = action;
      const target = state.reps.find((r) => r.id === repId);
      if (!target) return { success: false, state, message: 'Rep not found' };

      state.reps = state.reps.filter((r) => r.id !== repId);
      logActivity(`${target.name} removed`, 'remove', target.name);
      break;
    }

    case 'MOVE_REP': {
      const { repId, direction } = action;
      const index = state.reps.findIndex((r) => r.id === repId);
      if (index === -1) return { success: false, state, message: 'Rep not found' };

      const target = state.reps[index];
      const targetSection = target.checked;
      const swapIndex = direction === 'up' ? index - 1 : index + 1;

      if (
        swapIndex >= 0 &&
        swapIndex < state.reps.length &&
        state.reps[swapIndex].checked === targetSection
      ) {
        const [moved] = state.reps.splice(index, 1);
        state.reps.splice(swapIndex, 0, moved);
        logActivity(`${target.name} moved`, 'reorder', target.name);
      } else {
        return { success: false, state, message: 'Cannot move past section boundary' };
      }
      break;
    }

    case 'SET_STATUS': {
      const { repId, status } = action;
      const index = state.reps.findIndex((r) => r.id === repId);
      if (index === -1) return { success: false, state, message: 'Rep not found' };

      const rep = state.reps[index];
      rep.status = status;
      rep.statusChangedAt = Date.now();
      if (status === 'available' && rep.checked) {
        rep.checked = false;
        state.reps.splice(index, 1);
        const boundary = state.reps.findIndex((r) => r.checked);
        if (boundary === -1) state.reps.push(rep);
        else state.reps.splice(boundary, 0, rep);
      } else if (status !== 'available' && !rep.checked) {
        rep.checked = true;
        state.reps.splice(index, 1);
        const boundary = state.reps.findIndex((r) => r.checked);
        if (boundary === -1) state.reps.push(rep);
        else state.reps.splice(boundary, 0, rep);
      }
      logActivity(`${rep.name} set to ${status}`, 'toggle', rep.name);
      break;
    }

    case 'RESET_QUEUE': {
      const { mode } = action;
      if (mode === 'daily_reset') {
        state.reps.forEach((r) => {
          r.upCount = 0;
          r.statusChangedAt = Date.now();
        });
        state.lastResetDate = getStoreTodayString(state.timezone);
        logActivity('Daily stats reset (Ups zeroed & floor times reset)', 'reset');
      } else if (mode === 'all_ready') {
        state.reps.forEach((r) => {
          r.checked = false;
          r.status = 'available';
          r.statusChangedAt = Date.now();
        });
        logActivity('All set to available', 'reset');
      } else if (mode === 'clear') {
        state.reps = [];
        logActivity('Board cleared', 'reset');
      }
      break;
    }

    case 'INTERNAL_MIDNIGHT_RESET': {
      state.reps.forEach((r) => {
        r.upCount = 0;
        r.statusChangedAt = Date.now();
      });
      state.lastResetDate = getStoreTodayString(state.timezone);
      logActivity('Midnight daily reset: Up counts zeroed & floor times reset', 'reset');
      break;
    }

    case 'UPDATE_PRESETS': {
      const { presets } = action;
      if (Array.isArray(presets)) {
        state.presets = presets.map((p: string) => String(p).trim()).filter(Boolean);
      }
      break;
    }

    case 'SYNC_TIMEZONE': {
      if (action.timezone && typeof action.timezone === 'string') {
        try {
          Intl.DateTimeFormat(undefined, { timeZone: action.timezone });
          state.timezone = action.timezone;
        } catch {
          // ignore
        }
      }
      break;
    }

    default:
      return { success: false, state, message: `Unknown action: ${action.type}` };
  }

  return { success: true, state };
}

// Executes an action inside a Firestore transaction to guarantee latest server state
export async function executeQueueAction(action: any): Promise<{ success: boolean; message?: string }> {
  const docRef = doc(db, QUEUE_DOC_PATH, QUEUE_DOC_ID);

  try {
    return await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(docRef);
      let currentState: QueueState;
      let undoStack: QueueState[] = [];

      if (!snapshot.exists()) {
        currentState = { ...INITIAL_STATE };
      } else {
        const data = snapshot.data();
        currentState = {
          reps: Array.isArray(data.reps) ? data.reps : INITIAL_STATE.reps,
          activity: Array.isArray(data.activity) ? data.activity : INITIAL_STATE.activity,
          presets: Array.isArray(data.presets) ? data.presets : INITIAL_STATE.presets,
          lastResetDate: data.lastResetDate || getStoreTodayString(),
          autoResetEnabled: true,
          timezone: data.timezone || 'America/Los_Angeles'
        };
        if (Array.isArray(data.undoStack)) {
          undoStack = data.undoStack;
        }
      }

      // Handle UNDO separately
      if (action.type === 'UNDO') {
        if (undoStack.length === 0) {
          return { success: false, message: 'Nothing to undo' };
        }
        const previous = undoStack.pop()!;
        previous.activity = [
          {
            id: 'act-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            timestamp: Date.now(),
            text: 'Last action undone',
            type: 'undo'
          },
          ...(previous.activity || []).slice(0, 49)
        ];
        transaction.set(docRef, sanitizeForFirestore({
          ...previous,
          undoStack,
          updatedAt: Date.now()
        }));
        return { success: true };
      }

      // Check daily reset on latest server state before applying new mutation
      const resetCheck = checkDailyReset(currentState);
      const stateToMutate = resetCheck.state;

      // Save to undo stack before mutative actions (exclude purely internal resets or timezone sync)
      if (action.type !== 'SYNC_TIMEZONE' && action.type !== 'INTERNAL_MIDNIGHT_RESET') {
        undoStack.push({
          reps: stateToMutate.reps.map((r) => ({ ...r })),
          activity: [...stateToMutate.activity],
          presets: [...stateToMutate.presets],
          lastResetDate: stateToMutate.lastResetDate,
          autoResetEnabled: true,
          timezone: stateToMutate.timezone
        });
        if (undoStack.length > 20) {
          undoStack.shift();
        }
      }

      const result = applyAction(stateToMutate, action);
      if (!result.success) {
        return { success: false, message: result.message };
      }

      transaction.set(docRef, sanitizeForFirestore({
        ...result.state,
        undoStack,
        updatedAt: Date.now()
      }));

      return { success: true };
    });
  } catch (error: any) {
    console.error('Firestore transaction failed:', error);
    if (error?.code === 'permission-denied' || error?.message?.includes('permission')) {
      handleFirestoreError(error, OperationType.WRITE, `${QUEUE_DOC_PATH}/${QUEUE_DOC_ID}`);
    }
    return { success: false, message: error.message || 'Action failed' };
  }
}
