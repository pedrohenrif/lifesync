import { GoogleConnection } from "../../domain/entities/GoogleConnection.js";
import type { IGoogleConnectionRepository } from "../../domain/repositories/IGoogleConnectionRepository.js";
import {
  GoogleConnectionModel,
  type GoogleConnectionDocument,
} from "./mongoose/GoogleConnectionSchema.js";

function toDomain(doc: GoogleConnectionDocument): GoogleConnection | null {
  const result = GoogleConnection.create({
    id: doc._id,
    userId: doc.userId,
    googleEmail: doc.googleEmail,
    encryptedRefreshToken: doc.encryptedRefreshToken,
    scope: doc.scope,
    connectedAt: doc.connectedAt,
    updatedAt: doc.updatedAt,
  });
  return result.ok ? result.connection : null;
}

export class MongoGoogleConnectionRepository implements IGoogleConnectionRepository {
  async upsert(connection: GoogleConnection): Promise<void> {
    await GoogleConnectionModel.findOneAndUpdate(
      { userId: connection.userId },
      {
        $set: {
          googleEmail: connection.googleEmail,
          encryptedRefreshToken: connection.encryptedRefreshToken,
          scope: connection.scope,
          updatedAt: connection.updatedAt,
        },
        $setOnInsert: {
          _id: connection.id,
          userId: connection.userId,
          connectedAt: connection.connectedAt,
        },
      },
      { upsert: true },
    ).exec();
  }

  async findByUserId(userId: string): Promise<GoogleConnection | null> {
    const doc = await GoogleConnectionModel.findOne({ userId }).lean<GoogleConnectionDocument>().exec();
    return doc === null ? null : toDomain(doc);
  }

  async deleteByUserId(userId: string): Promise<void> {
    await GoogleConnectionModel.deleteOne({ userId }).exec();
  }
}
