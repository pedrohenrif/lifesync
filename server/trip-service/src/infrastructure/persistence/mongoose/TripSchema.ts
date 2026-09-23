import mongoose, { Schema } from "mongoose";
import {
  PACKING_CATEGORIES,
  RESERVATION_TYPES,
} from "../../../domain/entities/Trip.js";

export interface PersistedPackingItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  isPacked: boolean;
  createdAt: Date;
}

export interface PersistedChecklistItem {
  id: string;
  title: string;
  dueDate: string | null;
  isDone: boolean;
  createdAt: Date;
}

export interface PersistedReservation {
  id: string;
  type: string;
  title: string;
  provider: string | null;
  confirmationCode: string | null;
  url: string | null;
  startAt: string | null;
  endAt: string | null;
  address: string | null;
  notes: string | null;
  createdAt: Date;
}

export interface PersistedItineraryItem {
  id: string;
  date: string;
  time: string | null;
  title: string;
  description: string | null;
  location: string | null;
  createdAt: Date;
}

export interface PersistedTrip {
  _id: string;
  userId: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  notes: string | null;
  budgetAmount: number | null;
  isArchived: boolean;
  packingItems: PersistedPackingItem[];
  checklistItems: PersistedChecklistItem[];
  reservations: PersistedReservation[];
  itineraryItems: PersistedItineraryItem[];
  createdAt: Date;
  updatedAt: Date;
}

const packingItemSchema = new Schema<PersistedPackingItem>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, enum: PACKING_CATEGORIES, default: "OUTRO" },
    quantity: { type: Number, required: true, default: 1 },
    isPacked: { type: Boolean, required: true, default: false },
    createdAt: { type: Date, required: true },
  },
  { _id: false },
);

const checklistItemSchema = new Schema<PersistedChecklistItem>(
  {
    id: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    dueDate: { type: String, default: null },
    isDone: { type: Boolean, required: true, default: false },
    createdAt: { type: Date, required: true },
  },
  { _id: false },
);

const reservationSchema = new Schema<PersistedReservation>(
  {
    id: { type: String, required: true },
    type: { type: String, enum: RESERVATION_TYPES, default: "OTHER" },
    title: { type: String, required: true, trim: true },
    provider: { type: String, default: null },
    confirmationCode: { type: String, default: null },
    url: { type: String, default: null },
    startAt: { type: String, default: null },
    endAt: { type: String, default: null },
    address: { type: String, default: null },
    notes: { type: String, default: null },
    createdAt: { type: Date, required: true },
  },
  { _id: false },
);

const itineraryItemSchema = new Schema<PersistedItineraryItem>(
  {
    id: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, default: null },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: null },
    location: { type: String, default: null },
    createdAt: { type: Date, required: true },
  },
  { _id: false },
);

/**
 * Bagagem, pendências, reservas e roteiro ficam embutidos porque são sempre
 * carregados junto da viagem — uma requisição entrega a tela inteira, o que
 * importa quando a conexão é ruim. Mesmo padrão das sub-tarefas em goals-service.
 */
const tripSchema = new Schema<PersistedTrip>(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    destination: { type: String, required: true, trim: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    notes: { type: String, default: null },
    budgetAmount: { type: Number, default: null },
    isArchived: { type: Boolean, required: true, default: false },
    packingItems: { type: [packingItemSchema], default: [] },
    checklistItems: { type: [checklistItemSchema], default: [] },
    reservations: { type: [reservationSchema], default: [] },
    itineraryItems: { type: [itineraryItemSchema], default: [] },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { collection: "trips", versionKey: false },
);

tripSchema.index({ userId: 1, isArchived: 1, startDate: -1 });

export const TripModel = mongoose.model<PersistedTrip>("Trip", tripSchema);
