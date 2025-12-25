import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { AuthService } from '@auth0/auth0-angular';
import { BrainDumpService, Bucket, Card, IntakeSession, ConfirmedIdea, ParsedIdea } from '../../services/brain-dump.service';

@Component({
    selector: 'app-brain-dump',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, DragDropModule],
    templateUrl: './brain-dump.component.html',
    styleUrls: ['./brain-dump.component.scss']
})
export class BrainDumpComponent implements OnInit {
    buckets: Bucket[] = [];
    cardsByBucket: Map<string, Card[]> = new Map();

    // Loading states
    isLoading = true;
    isSaving = false;

    // Intake modal state
    showIntakeModal = false;
    intakeContent = '';
    intakeFile: File | null = null;
    isParsingIntake = false;
    intakeSession: IntakeSession | null = null;
    editableIdeas: (ParsedIdea & { selectedBucket: string })[] = [];

    // Card detail modal state
    showCardModal = false;
    selectedCard: Card | null = null;
    editingCard: Partial<Card> = {};

    // Error/success messages
    error: string | null = null;
    success: string | null = null;

    // Apple Reminders state
    isPushingToReminders = false;

    constructor(
        private brainDumpService: BrainDumpService,
        private auth: AuthService
    ) { }

    ngOnInit(): void {
        this.loadData();
    }

    async loadData(): Promise<void> {
        this.isLoading = true;
        this.error = null;

        try {
            // Load buckets first
            this.brainDumpService.getBuckets().subscribe({
                next: (buckets) => {
                    this.buckets = buckets.sort((a, b) => a.order - b.order);

                    // Initialize empty arrays for each bucket
                    this.buckets.forEach(bucket => {
                        this.cardsByBucket.set(bucket._id, []);
                    });

                    // Load all cards
                    this.brainDumpService.getCards().subscribe({
                        next: (cards) => {
                            // Group cards by bucket
                            cards.forEach(card => {
                                const bucketCards = this.cardsByBucket.get(card.bucketId) || [];
                                bucketCards.push(card);
                                this.cardsByBucket.set(card.bucketId, bucketCards);
                            });

                            // Sort cards within each bucket by order
                            this.cardsByBucket.forEach((cards, bucketId) => {
                                cards.sort((a, b) => a.order - b.order);
                            });

                            this.isLoading = false;
                        },
                        error: (err) => {
                            console.error('Error loading cards:', err);
                            this.error = 'Failed to load cards';
                            this.isLoading = false;
                        }
                    });
                },
                error: (err) => {
                    console.error('Error loading buckets:', err);
                    this.error = 'Failed to load buckets';
                    this.isLoading = false;
                }
            });
        } catch (err) {
            console.error('Error loading data:', err);
            this.error = 'Failed to load data';
            this.isLoading = false;
        }
    }

    getCardsForBucket(bucketId: string): Card[] {
        return this.cardsByBucket.get(bucketId) || [];
    }

    getCardCount(bucketId: string): number {
        return this.getCardsForBucket(bucketId).length;
    }

    // ==================== Drag and Drop ====================

    onCardDrop(event: CdkDragDrop<Card[]>, targetBucketId: string): void {
        if (event.previousContainer === event.container) {
            // Reorder within same bucket
            moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
            this.saveCardOrder(targetBucketId, event.container.data);
        } else {
            // Move to different bucket
            transferArrayItem(
                event.previousContainer.data,
                event.container.data,
                event.previousIndex,
                event.currentIndex
            );

            const movedCard = event.container.data[event.currentIndex];
            this.brainDumpService.moveCard(movedCard._id, targetBucketId, event.currentIndex).subscribe({
                next: () => {
                    // Update local state
                    movedCard.bucketId = targetBucketId;
                    this.showSuccessMessage('Card moved');
                },
                error: (err) => {
                    console.error('Error moving card:', err);
                    // Revert the move
                    transferArrayItem(
                        event.container.data,
                        event.previousContainer.data,
                        event.currentIndex,
                        event.previousIndex
                    );
                    this.error = 'Failed to move card';
                }
            });
        }
    }

    private saveCardOrder(bucketId: string, cards: Card[]): void {
        const orderedIds = cards.map(c => c._id);
        this.brainDumpService.reorderCards(bucketId, orderedIds).subscribe({
            error: (err) => console.error('Error saving card order:', err)
        });
    }

    // ==================== Intake Modal ====================

    openIntakeModal(): void {
        this.showIntakeModal = true;
        this.intakeContent = '';
        this.intakeFile = null;
        this.intakeSession = null;
        this.editableIdeas = [];
    }

    closeIntakeModal(): void {
        this.showIntakeModal = false;
        this.intakeContent = '';
        this.intakeFile = null;
        this.intakeSession = null;
        this.editableIdeas = [];
    }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            this.intakeFile = input.files[0];
        }
    }

    parseIntake(): void {
        if (!this.intakeContent.trim() && !this.intakeFile) {
            this.error = 'Please enter content or select a file';
            return;
        }

        this.isParsingIntake = true;
        this.error = null;

        const parseObservable = this.intakeFile
            ? this.brainDumpService.uploadFile(this.intakeFile)
            : this.brainDumpService.parseContent(this.intakeContent);

        parseObservable.subscribe({
            next: (session) => {
                this.intakeSession = session;
                this.editableIdeas = session.parsedIdeas.map(idea => ({
                    ...idea,
                    selectedBucket: idea.suggestedBucket
                }));
                this.isParsingIntake = false;
            },
            error: (err) => {
                console.error('Error parsing intake:', err);
                this.error = err.error?.error || 'Failed to parse content';
                this.isParsingIntake = false;
            }
        });
    }

    confirmIntake(): void {
        if (!this.intakeSession) return;

        this.isSaving = true;

        const confirmedIdeas: ConfirmedIdea[] = this.editableIdeas.map(idea => ({
            title: idea.title,
            content: idea.content,
            bucketName: idea.selectedBucket,
            isActionable: idea.isActionable,
            labels: idea.suggestedLabels,
            reminder: idea.suggestedReminder
        }));

        this.brainDumpService.confirmIntake(this.intakeSession._id, confirmedIdeas).subscribe({
            next: (result) => {
                this.showSuccessMessage(`Created ${result.cards.length} cards`);
                this.closeIntakeModal();
                this.loadData(); // Refresh the board
                this.isSaving = false;
            },
            error: (err) => {
                console.error('Error confirming intake:', err);
                this.error = 'Failed to create cards';
                this.isSaving = false;
            }
        });
    }

    removeIdea(index: number): void {
        this.editableIdeas.splice(index, 1);
    }

    // ==================== Card Modal ====================

    openCardModal(card: Card): void {
        this.selectedCard = card;
        this.editingCard = { ...card };
        this.showCardModal = true;
    }

    closeCardModal(): void {
        this.showCardModal = false;
        this.selectedCard = null;
        this.editingCard = {};
    }

    saveCard(): void {
        if (!this.selectedCard) return;

        this.isSaving = true;

        this.brainDumpService.updateCard(this.selectedCard._id, this.editingCard).subscribe({
            next: (updatedCard) => {
                // Update in local state
                const cards = this.cardsByBucket.get(updatedCard.bucketId);
                if (cards) {
                    const index = cards.findIndex(c => c._id === updatedCard._id);
                    if (index !== -1) {
                        cards[index] = updatedCard;
                    }
                }
                this.showSuccessMessage('Card updated');
                this.closeCardModal();
                this.isSaving = false;
            },
            error: (err) => {
                console.error('Error updating card:', err);
                this.error = 'Failed to update card';
                this.isSaving = false;
            }
        });
    }

    deleteCard(): void {
        if (!this.selectedCard) return;

        if (!confirm('Are you sure you want to delete this card?')) return;

        this.brainDumpService.deleteCard(this.selectedCard._id).subscribe({
            next: () => {
                // Remove from local state
                const cards = this.cardsByBucket.get(this.selectedCard!.bucketId);
                if (cards) {
                    const index = cards.findIndex(c => c._id === this.selectedCard!._id);
                    if (index !== -1) {
                        cards.splice(index, 1);
                    }
                }
                this.showSuccessMessage('Card deleted');
                this.closeCardModal();
            },
            error: (err) => {
                console.error('Error deleting card:', err);
                this.error = 'Failed to delete card';
            }
        });
    }

    pushToReminders(): void {
        if (!this.selectedCard) return;

        this.isPushingToReminders = true;

        this.brainDumpService.pushToReminders(this.selectedCard._id).subscribe({
            next: (result) => {
                if (result.success) {
                    // Update local card state
                    this.selectedCard!.reminder = {
                        ...this.selectedCard!.reminder,
                        remindAt: this.selectedCard!.reminder?.remindAt || new Date().toISOString(),
                        pushedToApple: true,
                        pushedAt: new Date().toISOString()
                    };
                    this.showSuccessMessage('Pushed to Apple Reminders');
                } else {
                    this.error = 'Failed to push to Apple Reminders';
                }
                this.isPushingToReminders = false;
            },
            error: (err) => {
                console.error('Error pushing to reminders:', err);
                this.error = err.error?.error || 'Failed to push to Apple Reminders';
                this.isPushingToReminders = false;
            }
        });
    }

    // ==================== Helpers ====================

    private showSuccessMessage(message: string): void {
        this.success = message;
        setTimeout(() => {
            this.success = null;
        }, 3000);
    }

    logout(): void {
        this.auth.logout({
            logoutParams: { returnTo: window.location.origin }
        });
    }

    getBucketNames(): string[] {
        return this.buckets.map(b => b.name);
    }
}
