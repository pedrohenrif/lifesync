export const PACKING_CATEGORIES = [
  "ROUPA",
  "HIGIENE",
  "ELETRONICO",
  "DOCUMENTO",
  "SAUDE",
  "OUTRO",
] as const;

export type PackingCategory = (typeof PACKING_CATEGORIES)[number];

export function isPackingCategory(value: string): value is PackingCategory {
  return (PACKING_CATEGORIES as readonly string[]).includes(value);
}

export const RESERVATION_TYPES = [
  "FLIGHT",
  "LODGING",
  "TRANSPORT",
  "ACTIVITY",
  "OTHER",
] as const;

export type ReservationType = (typeof RESERVATION_TYPES)[number];

export function isReservationType(value: string): value is ReservationType {
  return (RESERVATION_TYPES as readonly string[]).includes(value);
}

export interface PackingItem {
  readonly id: string;
  readonly name: string;
  readonly category: PackingCategory;
  readonly quantity: number;
  readonly isPacked: boolean;
  readonly createdAt: Date;
}

export interface ChecklistItem {
  readonly id: string;
  readonly title: string;
  /** YYYY-MM-DD ou null quando a pendência não tem prazo. */
  readonly dueDate: string | null;
  readonly isDone: boolean;
  readonly createdAt: Date;
}

export interface Reservation {
  readonly id: string;
  readonly type: ReservationType;
  readonly title: string;
  readonly provider: string | null;
  readonly confirmationCode: string | null;
  readonly url: string | null;
  /**
   * YYYY-MM-DDTHH:mm sem fuso, na hora local do destino. Guardar em UTC
   * deslocaria o horário do voo dependendo de onde o app fosse aberto.
   */
  readonly startAt: string | null;
  readonly endAt: string | null;
  readonly address: string | null;
  readonly notes: string | null;
  readonly createdAt: Date;
}

export interface ItineraryItem {
  readonly id: string;
  /** YYYY-MM-DD: o dia da viagem a que o item pertence. */
  readonly date: string;
  /** HH:mm ou null quando é algo do dia sem hora marcada. */
  readonly time: string | null;
  readonly title: string;
  readonly description: string | null;
  readonly location: string | null;
  readonly createdAt: Date;
}

export interface TripProps {
  readonly id: string;
  readonly userId: string;
  readonly name: string;
  readonly destination: string;
  /** YYYY-MM-DD: viagem não precisa de hora, e assim não há surpresa de fuso. */
  readonly startDate: string;
  readonly endDate: string;
  readonly notes: string | null;
  readonly isArchived: boolean;
  readonly packingItems: readonly PackingItem[];
  readonly checklistItems: readonly ChecklistItem[];
  readonly reservations: readonly Reservation[];
  readonly itineraryItems: readonly ItineraryItem[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export type TripChanges = {
  readonly name?: string;
  readonly destination?: string;
  readonly startDate?: string;
  readonly endDate?: string;
  readonly notes?: string | null;
  readonly isArchived?: boolean;
};

export type PackingItemDraft = {
  readonly id: string;
  readonly name: string;
  readonly category: PackingCategory;
  readonly quantity: number;
  readonly createdAt: Date;
};

export type PackingItemChanges = {
  readonly name?: string;
  readonly category?: string;
  readonly quantity?: number;
  readonly isPacked?: boolean;
};

export type ChecklistItemDraft = {
  readonly id: string;
  readonly title: string;
  readonly dueDate: string | null;
  readonly createdAt: Date;
};

export type ChecklistItemChanges = {
  readonly title?: string;
  readonly dueDate?: string | null;
  readonly isDone?: boolean;
};

export type ReservationDraft = {
  readonly id: string;
  readonly type: string;
  readonly title: string;
  readonly provider: string | null;
  readonly confirmationCode: string | null;
  readonly url: string | null;
  readonly startAt: string | null;
  readonly endAt: string | null;
  readonly address: string | null;
  readonly notes: string | null;
  readonly createdAt: Date;
};

export type ReservationChanges = {
  readonly type?: string;
  readonly title?: string;
  readonly provider?: string | null;
  readonly confirmationCode?: string | null;
  readonly url?: string | null;
  readonly startAt?: string | null;
  readonly endAt?: string | null;
  readonly address?: string | null;
  readonly notes?: string | null;
};

export type ItineraryItemDraft = {
  readonly id: string;
  readonly date: string;
  readonly time: string | null;
  readonly title: string;
  readonly description: string | null;
  readonly location: string | null;
  readonly createdAt: Date;
};

export type ItineraryItemChanges = {
  readonly date?: string;
  readonly time?: string | null;
  readonly title?: string;
  readonly description?: string | null;
  readonly location?: string | null;
};

export type TripValidationError =
  | { readonly code: "USER_ID_REQUIRED" }
  | { readonly code: "NAME_REQUIRED" }
  | { readonly code: "DESTINATION_REQUIRED" }
  | { readonly code: "INVALID_DATE" }
  | { readonly code: "END_BEFORE_START" }
  | { readonly code: "ITEM_TITLE_REQUIRED" }
  | { readonly code: "INVALID_QUANTITY" }
  | { readonly code: "INVALID_CATEGORY" }
  | { readonly code: "INVALID_RESERVATION_TYPE" }
  | { readonly code: "INVALID_DATETIME" }
  | { readonly code: "INVALID_TIME" }
  | { readonly code: "RESERVATION_END_BEFORE_START" }
  | { readonly code: "ITEM_NOT_FOUND" };

export type TripResult =
  | { readonly ok: true; readonly trip: Trip }
  | { readonly ok: false; readonly error: TripValidationError };

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const NAIVE_DATETIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const TIME_PATTERN = /^\d{2}:\d{2}$/;

function isValidDateOnly(value: string): boolean {
  return DATE_ONLY_PATTERN.test(value) && !Number.isNaN(Date.parse(value));
}

function isValidNaiveDateTime(value: string): boolean {
  return NAIVE_DATETIME_PATTERN.test(value) && !Number.isNaN(Date.parse(value));
}

function isValidTime(value: string): boolean {
  if (!TIME_PATTERN.test(value)) return false;
  const [hours, minutes] = value.split(":").map((part) => Number.parseInt(part, 10));
  return hours !== undefined && minutes !== undefined && hours < 24 && minutes < 60;
}

function validateWindow(
  startDate: string,
  endDate: string,
): TripValidationError | null {
  if (!isValidDateOnly(startDate) || !isValidDateOnly(endDate)) {
    return { code: "INVALID_DATE" };
  }
  if (Date.parse(endDate) < Date.parse(startDate)) {
    return { code: "END_BEFORE_START" };
  }
  return null;
}

/** Campo opcional de texto: `undefined` mantém, `null` limpa, string vazia limpa. */
function resolveOptionalText(
  incoming: string | null | undefined,
  current: string | null,
): string | null {
  if (incoming === undefined) return current;
  if (incoming === null) return null;
  const trimmed = incoming.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export class Trip {
  private constructor(private readonly props: TripProps) {}

  static create(props: TripProps): TripResult {
    if (props.userId.trim().length === 0) {
      return { ok: false, error: { code: "USER_ID_REQUIRED" } };
    }

    const name = props.name.trim();
    if (name.length === 0) {
      return { ok: false, error: { code: "NAME_REQUIRED" } };
    }

    const destination = props.destination.trim();
    if (destination.length === 0) {
      return { ok: false, error: { code: "DESTINATION_REQUIRED" } };
    }

    const invalidWindow = validateWindow(props.startDate, props.endDate);
    if (invalidWindow !== null) {
      return { ok: false, error: invalidWindow };
    }

    const notes = props.notes?.trim() ?? null;

    return {
      ok: true,
      trip: new Trip({
        ...props,
        name,
        destination,
        notes: notes !== null && notes.length > 0 ? notes : null,
      }),
    };
  }

  get id(): string { return this.props.id; }
  get userId(): string { return this.props.userId; }
  get name(): string { return this.props.name; }
  get destination(): string { return this.props.destination; }
  get startDate(): string { return this.props.startDate; }
  get endDate(): string { return this.props.endDate; }
  get notes(): string | null { return this.props.notes; }
  get isArchived(): boolean { return this.props.isArchived; }
  get packingItems(): readonly PackingItem[] { return this.props.packingItems; }
  get checklistItems(): readonly ChecklistItem[] { return this.props.checklistItems; }
  get reservations(): readonly Reservation[] { return this.props.reservations; }
  get itineraryItems(): readonly ItineraryItem[] { return this.props.itineraryItems; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  get packedCount(): number {
    return this.props.packingItems.filter((item) => item.isPacked).length;
  }

  get doneChecklistCount(): number {
    return this.props.checklistItems.filter((item) => item.isDone).length;
  }

  withChanges(changes: TripChanges): TripResult {
    return Trip.create({
      ...this.props,
      name: changes.name ?? this.props.name,
      destination: changes.destination ?? this.props.destination,
      startDate: changes.startDate ?? this.props.startDate,
      endDate: changes.endDate ?? this.props.endDate,
      notes: changes.notes !== undefined ? changes.notes : this.props.notes,
      isArchived: changes.isArchived ?? this.props.isArchived,
      updatedAt: new Date(),
    });
  }

  withPackingItem(draft: PackingItemDraft): TripResult {
    const name = draft.name.trim();
    if (name.length === 0) {
      return { ok: false, error: { code: "ITEM_TITLE_REQUIRED" } };
    }
    if (!Number.isInteger(draft.quantity) || draft.quantity < 1) {
      return { ok: false, error: { code: "INVALID_QUANTITY" } };
    }

    const item: PackingItem = { ...draft, name, isPacked: false };
    return this.replaced({ packingItems: [...this.props.packingItems, item] });
  }

  withUpdatedPackingItem(itemId: string, changes: PackingItemChanges): TripResult {
    const current = this.props.packingItems.find((item) => item.id === itemId);
    if (current === undefined) {
      return { ok: false, error: { code: "ITEM_NOT_FOUND" } };
    }

    const name = (changes.name ?? current.name).trim();
    if (name.length === 0) {
      return { ok: false, error: { code: "ITEM_TITLE_REQUIRED" } };
    }

    const quantity = changes.quantity ?? current.quantity;
    if (!Number.isInteger(quantity) || quantity < 1) {
      return { ok: false, error: { code: "INVALID_QUANTITY" } };
    }

    let category = current.category;
    if (changes.category !== undefined) {
      if (!isPackingCategory(changes.category)) {
        return { ok: false, error: { code: "INVALID_CATEGORY" } };
      }
      category = changes.category;
    }

    const updated: PackingItem = {
      ...current,
      name,
      category,
      quantity,
      isPacked: changes.isPacked ?? current.isPacked,
    };

    return this.replaced({
      packingItems: this.props.packingItems.map((item) =>
        item.id === itemId ? updated : item,
      ),
    });
  }

  withoutPackingItem(itemId: string): TripResult {
    if (!this.props.packingItems.some((item) => item.id === itemId)) {
      return { ok: false, error: { code: "ITEM_NOT_FOUND" } };
    }
    return this.replaced({
      packingItems: this.props.packingItems.filter((item) => item.id !== itemId),
    });
  }

  withChecklistItem(draft: ChecklistItemDraft): TripResult {
    const title = draft.title.trim();
    if (title.length === 0) {
      return { ok: false, error: { code: "ITEM_TITLE_REQUIRED" } };
    }
    if (draft.dueDate !== null && !isValidDateOnly(draft.dueDate)) {
      return { ok: false, error: { code: "INVALID_DATE" } };
    }

    const item: ChecklistItem = { ...draft, title, isDone: false };
    return this.replaced({ checklistItems: [...this.props.checklistItems, item] });
  }

  withUpdatedChecklistItem(itemId: string, changes: ChecklistItemChanges): TripResult {
    const current = this.props.checklistItems.find((item) => item.id === itemId);
    if (current === undefined) {
      return { ok: false, error: { code: "ITEM_NOT_FOUND" } };
    }

    const title = (changes.title ?? current.title).trim();
    if (title.length === 0) {
      return { ok: false, error: { code: "ITEM_TITLE_REQUIRED" } };
    }

    const dueDate = changes.dueDate !== undefined ? changes.dueDate : current.dueDate;
    if (dueDate !== null && !isValidDateOnly(dueDate)) {
      return { ok: false, error: { code: "INVALID_DATE" } };
    }

    const updated: ChecklistItem = {
      ...current,
      title,
      dueDate,
      isDone: changes.isDone ?? current.isDone,
    };

    return this.replaced({
      checklistItems: this.props.checklistItems.map((item) =>
        item.id === itemId ? updated : item,
      ),
    });
  }

  withoutChecklistItem(itemId: string): TripResult {
    if (!this.props.checklistItems.some((item) => item.id === itemId)) {
      return { ok: false, error: { code: "ITEM_NOT_FOUND" } };
    }
    return this.replaced({
      checklistItems: this.props.checklistItems.filter((item) => item.id !== itemId),
    });
  }

  withReservation(draft: ReservationDraft): TripResult {
    const title = draft.title.trim();
    if (title.length === 0) {
      return { ok: false, error: { code: "ITEM_TITLE_REQUIRED" } };
    }
    if (!isReservationType(draft.type)) {
      return { ok: false, error: { code: "INVALID_RESERVATION_TYPE" } };
    }

    const invalidSchedule = Trip.validateReservationSchedule(draft.startAt, draft.endAt);
    if (invalidSchedule !== null) {
      return { ok: false, error: invalidSchedule };
    }

    const reservation: Reservation = {
      id: draft.id,
      type: draft.type,
      title,
      provider: resolveOptionalText(draft.provider, null),
      confirmationCode: resolveOptionalText(draft.confirmationCode, null),
      url: resolveOptionalText(draft.url, null),
      startAt: draft.startAt,
      endAt: draft.endAt,
      address: resolveOptionalText(draft.address, null),
      notes: resolveOptionalText(draft.notes, null),
      createdAt: draft.createdAt,
    };

    return this.replaced({ reservations: [...this.props.reservations, reservation] });
  }

  withUpdatedReservation(itemId: string, changes: ReservationChanges): TripResult {
    const current = this.props.reservations.find((item) => item.id === itemId);
    if (current === undefined) {
      return { ok: false, error: { code: "ITEM_NOT_FOUND" } };
    }

    const title = (changes.title ?? current.title).trim();
    if (title.length === 0) {
      return { ok: false, error: { code: "ITEM_TITLE_REQUIRED" } };
    }

    let type = current.type;
    if (changes.type !== undefined) {
      if (!isReservationType(changes.type)) {
        return { ok: false, error: { code: "INVALID_RESERVATION_TYPE" } };
      }
      type = changes.type;
    }

    const startAt = changes.startAt !== undefined ? changes.startAt : current.startAt;
    const endAt = changes.endAt !== undefined ? changes.endAt : current.endAt;

    const invalidSchedule = Trip.validateReservationSchedule(startAt, endAt);
    if (invalidSchedule !== null) {
      return { ok: false, error: invalidSchedule };
    }

    const updated: Reservation = {
      ...current,
      type,
      title,
      provider: resolveOptionalText(changes.provider, current.provider),
      confirmationCode: resolveOptionalText(
        changes.confirmationCode,
        current.confirmationCode,
      ),
      url: resolveOptionalText(changes.url, current.url),
      startAt,
      endAt,
      address: resolveOptionalText(changes.address, current.address),
      notes: resolveOptionalText(changes.notes, current.notes),
    };

    return this.replaced({
      reservations: this.props.reservations.map((item) =>
        item.id === itemId ? updated : item,
      ),
    });
  }

  withoutReservation(itemId: string): TripResult {
    if (!this.props.reservations.some((item) => item.id === itemId)) {
      return { ok: false, error: { code: "ITEM_NOT_FOUND" } };
    }
    return this.replaced({
      reservations: this.props.reservations.filter((item) => item.id !== itemId),
    });
  }

  withItineraryItem(draft: ItineraryItemDraft): TripResult {
    const title = draft.title.trim();
    if (title.length === 0) {
      return { ok: false, error: { code: "ITEM_TITLE_REQUIRED" } };
    }
    if (!isValidDateOnly(draft.date)) {
      return { ok: false, error: { code: "INVALID_DATE" } };
    }
    if (draft.time !== null && !isValidTime(draft.time)) {
      return { ok: false, error: { code: "INVALID_TIME" } };
    }

    const item: ItineraryItem = {
      id: draft.id,
      date: draft.date,
      time: draft.time,
      title,
      description: resolveOptionalText(draft.description, null),
      location: resolveOptionalText(draft.location, null),
      createdAt: draft.createdAt,
    };

    return this.replaced({ itineraryItems: [...this.props.itineraryItems, item] });
  }

  withUpdatedItineraryItem(itemId: string, changes: ItineraryItemChanges): TripResult {
    const current = this.props.itineraryItems.find((item) => item.id === itemId);
    if (current === undefined) {
      return { ok: false, error: { code: "ITEM_NOT_FOUND" } };
    }

    const title = (changes.title ?? current.title).trim();
    if (title.length === 0) {
      return { ok: false, error: { code: "ITEM_TITLE_REQUIRED" } };
    }

    const date = changes.date ?? current.date;
    if (!isValidDateOnly(date)) {
      return { ok: false, error: { code: "INVALID_DATE" } };
    }

    const time = changes.time !== undefined ? changes.time : current.time;
    if (time !== null && !isValidTime(time)) {
      return { ok: false, error: { code: "INVALID_TIME" } };
    }

    const updated: ItineraryItem = {
      ...current,
      date,
      time,
      title,
      description: resolveOptionalText(changes.description, current.description),
      location: resolveOptionalText(changes.location, current.location),
    };

    return this.replaced({
      itineraryItems: this.props.itineraryItems.map((item) =>
        item.id === itemId ? updated : item,
      ),
    });
  }

  withoutItineraryItem(itemId: string): TripResult {
    if (!this.props.itineraryItems.some((item) => item.id === itemId)) {
      return { ok: false, error: { code: "ITEM_NOT_FOUND" } };
    }
    return this.replaced({
      itineraryItems: this.props.itineraryItems.filter((item) => item.id !== itemId),
    });
  }

  private static validateReservationSchedule(
    startAt: string | null,
    endAt: string | null,
  ): TripValidationError | null {
    if (startAt !== null && !isValidNaiveDateTime(startAt)) {
      return { code: "INVALID_DATETIME" };
    }
    if (endAt !== null && !isValidNaiveDateTime(endAt)) {
      return { code: "INVALID_DATETIME" };
    }
    if (startAt !== null && endAt !== null && Date.parse(endAt) < Date.parse(startAt)) {
      return { code: "RESERVATION_END_BEFORE_START" };
    }
    return null;
  }

  /** Mutações de itens não revalidam a viagem inteira, só trocam as listas. */
  private replaced(
    patch: Partial<
      Pick<
        TripProps,
        "packingItems" | "checklistItems" | "reservations" | "itineraryItems"
      >
    >,
  ): TripResult {
    return {
      ok: true,
      trip: new Trip({ ...this.props, ...patch, updatedAt: new Date() }),
    };
  }
}
