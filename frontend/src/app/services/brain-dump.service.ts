import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// Interfaces
export interface CardLabel {
    name: string;
    color: string;
}

export interface CardReminder {
    remindAt: string;
    pushedToApple: boolean;
    appleReminderId?: string;
    pushedAt?: string;
}

export interface Bucket {
    _id: string;
    userId: string;
    name: string;
    color: string;
    order: number;
    isDefault: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Card {
    _id: string;
    userId: string;
    bucketId: string;
    title: string;
    content: string;
    labels: CardLabel[];
    order: number;
    isActionable: boolean;
    priority?: 'low' | 'medium' | 'high';
    reminder?: CardReminder;
    sourceIntakeId?: string;
    createdAt: string;
    updatedAt: string;
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
    _id: string;
    userId: string;
    rawContent: string;
    filename?: string;
    parsedIdeas: ParsedIdea[];
    status: 'pending' | 'parsed' | 'processed' | 'failed';
    claudeModel?: string;
    processingTimeMs?: number;
    errorMessage?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ConfirmedIdea {
    title: string;
    content: string;
    bucketName: string;
    isActionable: boolean;
    labels?: string[];
    reminder?: string;
}

@Injectable({
    providedIn: 'root'
})
export class BrainDumpService {
    private apiUrl = `${environment.apiUrl}/brain-dump`;

    constructor(private http: HttpClient) { }

    // ==================== Bucket Operations ====================

    getBuckets(): Observable<Bucket[]> {
        return this.http.get<Bucket[]>(`${this.apiUrl}/buckets`);
    }

    createBucket(name: string, color: string): Observable<Bucket> {
        return this.http.post<Bucket>(`${this.apiUrl}/buckets`, { name, color });
    }

    updateBucket(id: string, data: Partial<Bucket>): Observable<Bucket> {
        return this.http.put<Bucket>(`${this.apiUrl}/buckets/${id}`, data);
    }

    deleteBucket(id: string): Observable<{ message: string }> {
        return this.http.delete<{ message: string }>(`${this.apiUrl}/buckets/${id}`);
    }

    reorderBuckets(orderedIds: string[]): Observable<{ message: string }> {
        return this.http.put<{ message: string }>(`${this.apiUrl}/buckets/reorder`, { orderedIds });
    }

    // ==================== Card Operations ====================

    getCards(bucketId?: string): Observable<Card[]> {
        if (bucketId) {
            return this.http.get<Card[]>(`${this.apiUrl}/cards`, { params: { bucketId } });
        }
        return this.http.get<Card[]>(`${this.apiUrl}/cards`);
    }

    getCard(id: string): Observable<Card> {
        return this.http.get<Card>(`${this.apiUrl}/cards/${id}`);
    }

    createCard(data: Partial<Card>): Observable<Card> {
        return this.http.post<Card>(`${this.apiUrl}/cards`, data);
    }

    updateCard(id: string, data: Partial<Card>): Observable<Card> {
        return this.http.put<Card>(`${this.apiUrl}/cards/${id}`, data);
    }

    deleteCard(id: string): Observable<{ message: string }> {
        return this.http.delete<{ message: string }>(`${this.apiUrl}/cards/${id}`);
    }

    moveCard(id: string, toBucketId: string, order: number): Observable<Card> {
        return this.http.put<Card>(`${this.apiUrl}/cards/${id}/move`, { toBucketId, order });
    }

    reorderCards(bucketId: string, orderedIds: string[]): Observable<{ message: string }> {
        return this.http.put<{ message: string }>(`${this.apiUrl}/cards/reorder`, { bucketId, orderedIds });
    }

    // ==================== Intake Operations ====================

    parseContent(content: string): Observable<IntakeSession> {
        return this.http.post<IntakeSession>(`${this.apiUrl}/intake/parse`, { content });
    }

    uploadFile(file: File): Observable<IntakeSession> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post<IntakeSession>(`${this.apiUrl}/intake/upload`, formData);
    }

    getIntakeSession(id: string): Observable<IntakeSession> {
        return this.http.get<IntakeSession>(`${this.apiUrl}/intake/${id}`);
    }

    confirmIntake(sessionId: string, ideas: ConfirmedIdea[]): Observable<{ message: string; cards: Card[] }> {
        return this.http.post<{ message: string; cards: Card[] }>(
            `${this.apiUrl}/intake/${sessionId}/confirm`,
            { ideas }
        );
    }

    // ==================== Apple Reminders Operations ====================

    getRemindersStatus(): Observable<{ available: boolean; lists?: string[]; error?: string }> {
        return this.http.get<{ available: boolean; lists?: string[]; error?: string }>(
            `${this.apiUrl}/reminders/status`
        );
    }

    pushToReminders(cardId: string): Observable<{ success: boolean; reminderId?: string; message: string }> {
        return this.http.post<{ success: boolean; reminderId?: string; message: string }>(
            `${this.apiUrl}/reminders/push`,
            { cardId }
        );
    }

    pushBatchToReminders(cardIds: string[]): Observable<{
        message: string;
        results: { cardId: string; success: boolean; reminderId?: string; error?: string }[]
    }> {
        return this.http.post<any>(`${this.apiUrl}/reminders/push-batch`, { cardIds });
    }
}
