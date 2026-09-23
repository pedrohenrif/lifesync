import {
  isPackingCategory,
  isReservationType,
  Trip,
  type ChecklistItem,
  type ItineraryItem,
  type PackingItem,
  type Reservation,
} from "../../domain/entities/Trip.js";
import type { ITripRepository, TripFilter } from "../../domain/repositories/ITripRepository.js";
import {
  buildPaginated,
  toSkip,
  type Paginated,
  type PaginationParams,
} from "../../domain/pagination.js";
import {
  TripModel,
  type PersistedChecklistItem,
  type PersistedItineraryItem,
  type PersistedPackingItem,
  type PersistedReservation,
  type PersistedTrip,
} from "./mongoose/TripSchema.js";

function toPackingItem(doc: PersistedPackingItem): PackingItem {
  return {
    id: doc.id,
    name: doc.name,
    // Categoria desconhecida (enum alterado depois) não deve derrubar a leitura.
    category: isPackingCategory(doc.category) ? doc.category : "OUTRO",
    quantity: doc.quantity,
    isPacked: doc.isPacked,
    createdAt: doc.createdAt,
  };
}

function toChecklistItem(doc: PersistedChecklistItem): ChecklistItem {
  return {
    id: doc.id,
    title: doc.title,
    dueDate: doc.dueDate,
    isDone: doc.isDone,
    createdAt: doc.createdAt,
  };
}

function toReservation(doc: PersistedReservation): Reservation {
  return {
    id: doc.id,
    type: isReservationType(doc.type) ? doc.type : "OTHER",
    title: doc.title,
    provider: doc.provider,
    confirmationCode: doc.confirmationCode,
    url: doc.url,
    startAt: doc.startAt,
    endAt: doc.endAt,
    address: doc.address,
    notes: doc.notes,
    createdAt: doc.createdAt,
  };
}

function toItineraryItem(doc: PersistedItineraryItem): ItineraryItem {
  return {
    id: doc.id,
    date: doc.date,
    time: doc.time,
    title: doc.title,
    description: doc.description,
    location: doc.location,
    createdAt: doc.createdAt,
  };
}

function toDomain(doc: PersistedTrip): Trip {
  const result = Trip.create({
    id: doc._id,
    userId: doc.userId,
    name: doc.name,
    destination: doc.destination,
    startDate: doc.startDate,
    endDate: doc.endDate,
    notes: doc.notes,
    budgetAmount: doc.budgetAmount ?? null,
    isArchived: doc.isArchived,
    packingItems: (doc.packingItems ?? []).map(toPackingItem),
    checklistItems: (doc.checklistItems ?? []).map(toChecklistItem),
    reservations: (doc.reservations ?? []).map(toReservation),
    itineraryItems: (doc.itineraryItems ?? []).map(toItineraryItem),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  });

  if (!result.ok) {
    throw new Error(`Invalid trip persisted: ${result.error.code}`);
  }
  return result.trip;
}

function toPersistedFields(trip: Trip) {
  return {
    userId: trip.userId,
    name: trip.name,
    destination: trip.destination,
    startDate: trip.startDate,
    endDate: trip.endDate,
    notes: trip.notes,
    budgetAmount: trip.budgetAmount,
    isArchived: trip.isArchived,
    packingItems: trip.packingItems.map((item) => ({ ...item })),
    checklistItems: trip.checklistItems.map((item) => ({ ...item })),
    reservations: trip.reservations.map((item) => ({ ...item })),
    itineraryItems: trip.itineraryItems.map((item) => ({ ...item })),
    createdAt: trip.createdAt,
    updatedAt: trip.updatedAt,
  };
}

export class MongoTripRepository implements ITripRepository {
  async save(trip: Trip): Promise<void> {
    await TripModel.create({ _id: trip.id, ...toPersistedFields(trip) });
  }

  async findById(id: string): Promise<Trip | null> {
    const doc = await TripModel.findById(id).lean<PersistedTrip>().exec();
    return doc === null ? null : toDomain(doc);
  }

  async findByUserId(
    userId: string,
    filter: TripFilter,
    pagination: PaginationParams,
  ): Promise<Paginated<Trip>> {
    const query: Record<string, unknown> = { userId };
    if (!filter.includeArchived) {
      query.isArchived = false;
    }

    const [docs, total] = await Promise.all([
      TripModel.find(query)
        // Viagem mais próxima primeiro é o que interessa na lista.
        .sort({ startDate: -1 })
        .skip(toSkip(pagination))
        .limit(pagination.pageSize)
        .lean<PersistedTrip[]>()
        .exec(),
      TripModel.countDocuments(query).exec(),
    ]);

    return buildPaginated(docs.map(toDomain), total, pagination);
  }

  async update(trip: Trip): Promise<void> {
    await TripModel.updateOne(
      { _id: trip.id },
      { $set: toPersistedFields(trip) },
    ).exec();
  }

  async delete(id: string): Promise<void> {
    await TripModel.deleteOne({ _id: id }).exec();
  }
}
