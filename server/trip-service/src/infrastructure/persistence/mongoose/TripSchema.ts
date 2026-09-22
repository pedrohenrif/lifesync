import mongoose, { Schema } from "mongoose";
import { PACKING_CATEGORIES } from "../../../domain/entities/Trip.js";

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

export interface PersistedTrip {
  _id: string;
  userId: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  notes: string | null;
  isArchived: boolean;
  packingItems: PersistedPackingItem[];
  checklistItems: PersistedChecklistItem[];
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

/**
 * Bagagem e pendências ficam embutidas porque são sempre carregadas junto da
 * viagem — uma requisição entrega a tela inteira, o que importa quando a
 * conexão é ruim. Mesmo padrão das sub-tarefas em goals-service.
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
    isArchived: { type: Boolean, required: true, default: false },
    packingItems: { type: [packingItemSchema], default: [] },
    checklistItems: { type: [checklistItemSchema], default: [] },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { collection: "trips", versionKey: false },
);

tripSchema.index({ userId: 1, isArchived: 1, startDate: -1 });

export const TripModel = mongoose.model<PersistedTrip>("Trip", tripSchema);
