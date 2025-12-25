import { MongoClient, Db, Collection, ObjectId } from 'mongodb';

interface UserPreferences {
    userId: string;
    favoriteTeams?: string[];
    notifications?: boolean;
    theme?: string;
    measurementUnits?: 'metric' | 'imperial';
    createdAt: Date;
    updatedAt: Date;
}

// Brain Dump Interfaces
export interface Bucket {
    _id?: ObjectId;
    userId: string;
    name: string;
    color: string;
    order: number;
    isDefault: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface CardLabel {
    name: string;
    color: string;
}

export interface CardReminder {
    remindAt: Date;
    pushedToApple: boolean;
    appleReminderId?: string;
    pushedAt?: Date;
}

export interface Card {
    _id?: ObjectId;
    userId: string;
    bucketId: ObjectId;
    title: string;
    content: string;
    labels: CardLabel[];
    order: number;
    isActionable: boolean;
    priority?: 'low' | 'medium' | 'high';
    reminder?: CardReminder;
    sourceIntakeId?: ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

export interface ParsedIdea {
    title: string;
    content: string;
    suggestedBucket: string;
    isActionable: boolean;
    suggestedLabels: string[];
    suggestedReminder?: string;
}

export interface IntakeSession {
    _id?: ObjectId;
    userId: string;
    rawContent: string;
    filename?: string;
    parsedIdeas: ParsedIdea[];
    status: 'pending' | 'parsed' | 'processed' | 'failed';
    claudeModel?: string;
    processingTimeMs?: number;
    errorMessage?: string;
    createdAt: Date;
    updatedAt: Date;
}

const DEFAULT_BUCKETS = [
    { name: 'Work', color: '#3b82f6', order: 0 },
    { name: 'Music', color: '#8b5cf6', order: 1 },
    { name: 'Social', color: '#ec4899', order: 2 },
    { name: 'Motorcycles', color: '#f97316', order: 3 },
    { name: 'Health', color: '#22c55e', order: 4 },
    { name: 'Ideas', color: '#eab308', order: 5 },
    { name: 'Unsorted', color: '#6b7280', order: 99 }
];

class DatabaseService {
    private client: MongoClient;
    private db: Db | null = null;

    constructor() {
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            throw new Error('MONGODB_URI environment variable is not set');
        }
        this.client = new MongoClient(uri);
    }

    async connect(): Promise<void> {
        try {
            await this.client.connect();
            this.db = this.client.db('racing-dashboard');
            console.log('✅ Connected to MongoDB');
        } catch (error) {
            console.error('❌ MongoDB connection error:', error);
            throw error;
        }
    }

    async disconnect(): Promise<void> {
        await this.client.close();
        console.log('Disconnected from MongoDB');
    }

    getPreferencesCollection(): Collection<UserPreferences> {
        if (!this.db) {
            throw new Error('Database not connected');
        }
        return this.db.collection<UserPreferences>('preferences');
    }

    async getUserPreferences(userId: string): Promise<UserPreferences | null> {
        const collection = this.getPreferencesCollection();
        return await collection.findOne({ userId });
    }

    async updateUserPreferences(
        userId: string,
        preferences: Partial<UserPreferences>
    ): Promise<UserPreferences> {
        const collection = this.getPreferencesCollection();

        const now = new Date();
        const updateData = {
            ...preferences,
            userId,
            updatedAt: now,
        };

        const result = await collection.findOneAndUpdate(
            { userId },
            {
                $set: updateData,
                $setOnInsert: { createdAt: now },
            },
            {
                upsert: true,
                returnDocument: 'after',
            }
        );

        if (!result) {
            throw new Error('Failed to update preferences');
        }

        return result;
    }

    // ==================== Brain Dump Collections ====================

    getBucketsCollection(): Collection<Bucket> {
        if (!this.db) {
            throw new Error('Database not connected');
        }
        return this.db.collection<Bucket>('braindump-buckets');
    }

    getCardsCollection(): Collection<Card> {
        if (!this.db) {
            throw new Error('Database not connected');
        }
        return this.db.collection<Card>('braindump-cards');
    }

    getIntakeSessionsCollection(): Collection<IntakeSession> {
        if (!this.db) {
            throw new Error('Database not connected');
        }
        return this.db.collection<IntakeSession>('braindump-intakes');
    }

    // ==================== Bucket Operations ====================

    async getUserBuckets(userId: string): Promise<Bucket[]> {
        const collection = this.getBucketsCollection();
        return await collection.find({ userId }).sort({ order: 1 }).toArray();
    }

    async createDefaultBuckets(userId: string): Promise<Bucket[]> {
        const collection = this.getBucketsCollection();
        const now = new Date();

        const buckets: Bucket[] = DEFAULT_BUCKETS.map(b => ({
            ...b,
            userId,
            isDefault: true,
            createdAt: now,
            updatedAt: now
        }));

        await collection.insertMany(buckets);
        return buckets;
    }

    async ensureUserHasBuckets(userId: string): Promise<Bucket[]> {
        const existing = await this.getUserBuckets(userId);
        if (existing.length === 0) {
            return await this.createDefaultBuckets(userId);
        }
        return existing;
    }

    async createBucket(userId: string, data: Partial<Bucket>): Promise<Bucket> {
        const collection = this.getBucketsCollection();
        const now = new Date();

        // Get next order number
        const maxOrder = await collection.find({ userId }).sort({ order: -1 }).limit(1).toArray();
        const nextOrder = maxOrder.length > 0 ? maxOrder[0].order + 1 : 0;

        const bucket: Bucket = {
            userId,
            name: data.name || 'New Bucket',
            color: data.color || '#6b7280',
            order: data.order ?? nextOrder,
            isDefault: false,
            createdAt: now,
            updatedAt: now
        };

        const result = await collection.insertOne(bucket);
        return { ...bucket, _id: result.insertedId };
    }

    async updateBucket(userId: string, bucketId: string, data: Partial<Bucket>): Promise<Bucket | null> {
        const collection = this.getBucketsCollection();
        const result = await collection.findOneAndUpdate(
            { _id: new ObjectId(bucketId), userId },
            { $set: { ...data, updatedAt: new Date() } },
            { returnDocument: 'after' }
        );
        return result;
    }

    async deleteBucket(userId: string, bucketId: string): Promise<void> {
        const bucketCollection = this.getBucketsCollection();
        const cardCollection = this.getCardsCollection();

        // Get or create Unsorted bucket
        let unsortedBucket = await bucketCollection.findOne({ userId, name: 'Unsorted' });
        let unsortedBucketId: ObjectId;

        if (!unsortedBucket) {
            const newBucket = await this.createBucket(userId, { name: 'Unsorted', color: '#6b7280', order: 99 });
            unsortedBucketId = newBucket._id!;
        } else {
            unsortedBucketId = unsortedBucket._id;
        }

        // Move cards to Unsorted
        await cardCollection.updateMany(
            { userId, bucketId: new ObjectId(bucketId) },
            { $set: { bucketId: unsortedBucketId, updatedAt: new Date() } }
        );

        // Delete bucket
        await bucketCollection.deleteOne({ _id: new ObjectId(bucketId), userId });
    }

    async reorderBuckets(userId: string, orderedIds: string[]): Promise<void> {
        const collection = this.getBucketsCollection();
        const now = new Date();

        const bulkOps = orderedIds.map((id, index) => ({
            updateOne: {
                filter: { _id: new ObjectId(id), userId },
                update: { $set: { order: index, updatedAt: now } }
            }
        }));

        await collection.bulkWrite(bulkOps);
    }

    // ==================== Card Operations ====================

    async getAllCards(userId: string): Promise<Card[]> {
        const collection = this.getCardsCollection();
        return await collection.find({ userId }).sort({ order: 1 }).toArray();
    }

    async getCardsByBucket(userId: string, bucketId: string): Promise<Card[]> {
        const collection = this.getCardsCollection();
        return await collection.find({ userId, bucketId: new ObjectId(bucketId) }).sort({ order: 1 }).toArray();
    }

    async getCard(userId: string, cardId: string): Promise<Card | null> {
        const collection = this.getCardsCollection();
        return await collection.findOne({ _id: new ObjectId(cardId), userId });
    }

    async createCard(userId: string, data: Partial<Card>): Promise<Card> {
        const collection = this.getCardsCollection();
        const now = new Date();

        // Get next order number within bucket
        const bucketId = data.bucketId || new ObjectId();
        const maxOrder = await collection.find({ userId, bucketId }).sort({ order: -1 }).limit(1).toArray();
        const nextOrder = maxOrder.length > 0 ? maxOrder[0].order + 1 : 0;

        const card: Card = {
            userId,
            bucketId: bucketId,
            title: data.title || 'Untitled',
            content: data.content || '',
            labels: data.labels || [],
            order: data.order ?? nextOrder,
            isActionable: data.isActionable ?? false,
            priority: data.priority,
            reminder: data.reminder,
            sourceIntakeId: data.sourceIntakeId,
            createdAt: now,
            updatedAt: now
        };

        const result = await collection.insertOne(card);
        return { ...card, _id: result.insertedId };
    }

    async updateCard(userId: string, cardId: string, data: Partial<Card>): Promise<Card | null> {
        const collection = this.getCardsCollection();

        // Handle bucketId conversion if provided as string
        const updateData: any = { ...data, updatedAt: new Date() };
        if (data.bucketId && typeof data.bucketId === 'string') {
            updateData.bucketId = new ObjectId(data.bucketId);
        }

        const result = await collection.findOneAndUpdate(
            { _id: new ObjectId(cardId), userId },
            { $set: updateData },
            { returnDocument: 'after' }
        );
        return result;
    }

    async deleteCard(userId: string, cardId: string): Promise<void> {
        const collection = this.getCardsCollection();
        await collection.deleteOne({ _id: new ObjectId(cardId), userId });
    }

    async moveCard(userId: string, cardId: string, toBucketId: string, newOrder: number): Promise<Card | null> {
        const collection = this.getCardsCollection();
        const result = await collection.findOneAndUpdate(
            { _id: new ObjectId(cardId), userId },
            { $set: { bucketId: new ObjectId(toBucketId), order: newOrder, updatedAt: new Date() } },
            { returnDocument: 'after' }
        );
        return result;
    }

    async reorderCards(userId: string, bucketId: string, orderedIds: string[]): Promise<void> {
        const collection = this.getCardsCollection();
        const now = new Date();

        const bulkOps = orderedIds.map((id, index) => ({
            updateOne: {
                filter: { _id: new ObjectId(id), userId },
                update: { $set: { order: index, bucketId: new ObjectId(bucketId), updatedAt: now } }
            }
        }));

        await collection.bulkWrite(bulkOps);
    }

    // ==================== Intake Operations ====================

    async createIntakeSession(userId: string, rawContent: string, filename?: string): Promise<IntakeSession> {
        const collection = this.getIntakeSessionsCollection();
        const now = new Date();

        const session: IntakeSession = {
            userId,
            rawContent,
            filename,
            parsedIdeas: [],
            status: 'pending',
            createdAt: now,
            updatedAt: now
        };

        const result = await collection.insertOne(session);
        return { ...session, _id: result.insertedId };
    }

    async updateIntakeSession(sessionId: string, data: Partial<IntakeSession>): Promise<IntakeSession | null> {
        const collection = this.getIntakeSessionsCollection();
        const result = await collection.findOneAndUpdate(
            { _id: new ObjectId(sessionId) },
            { $set: { ...data, updatedAt: new Date() } },
            { returnDocument: 'after' }
        );
        return result;
    }

    async getIntakeSession(userId: string, sessionId: string): Promise<IntakeSession | null> {
        const collection = this.getIntakeSessionsCollection();
        return await collection.findOne({ _id: new ObjectId(sessionId), userId });
    }
}

export const databaseService = new DatabaseService();