export interface Slot {
  id: number;
  name: string;
  date: string;         // "2026-07-10" formatida
  startTime: string;    // "09:00:00" formatida
  endTime: string;      // "18:00:00" formatida
  courier?: {
    id: number;
    name: string;
    email: string;
    phone?: string;
  } | null;
  bookedBy?: {
    id: number;
    name: string;
    email: string;
    phone?: string;
  } | null;
  bookedAt?: string | null;
  started: boolean;
  finished: boolean;
  cancelled: boolean;
  penaltyAmount?: number;
  penaltyApplied: boolean;
  startedAt?: string | null;
  finishedAt?: string | null;
  cancelledAt?: string | null;
  createdAt?: string;
}

export interface SlotRequest {
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  courierId?: number | null;
}

export interface ActiveSlotResponse {
  hasActiveSlot: boolean;
  slot?: Slot;
}

export interface CancelResult {
  slot: Slot;
  penaltyAmount: number;
}
