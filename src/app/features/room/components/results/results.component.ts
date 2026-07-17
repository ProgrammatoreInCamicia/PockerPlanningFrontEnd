import { Component, computed, effect, inject, signal } from '@angular/core';
import { ModalComponent } from '../../../../shared/modal/modal.component';
import { RoomStore } from '../../../../state/room.store';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-results',
  imports: [ModalComponent, FormsModule],
  templateUrl: './results.component.html',
  styleUrl: './results.component.scss',
})
export class ResultsComponent {
  readonly roomStore = inject(RoomStore);

  private readonly dismissedForTaskId = signal<string | null>(null);
  readonly selectedEstimate = signal<string>('');

  readonly isOpen = computed(() => {
    const revealed = this.roomStore.revealed();
    const taskId = this.roomStore.activeTaskId();
    const stats = this.roomStore.voteStats();
    return revealed && stats !== null && this.dismissedForTaskId() !== taskId;
  });

  constructor() {
    effect(() => {
      if (!this.isOpen()) return;
      const stats = this.roomStore.voteStats();
      const mode = stats?.distribution[0]?.value ?? '';
      this.selectedEstimate.set(mode);
    });

    // quando cambia il task attivo (nuovo selectTask), resetta la "chiusura manuale" precedente
    effect(() => {
      if (this.roomStore.revealed() === false) {
        this.dismissedForTaskId.set(null);
      }
    });
  }

  close(): void {
    if (!this.roomStore.revealed()) return; // chiusura "eco" del native close, non un vero dismiss manuale
    this.dismissedForTaskId.set(this.roomStore.activeTaskId());
  }

  confirmEstimate(): void {
    const taskId = this.roomStore.activeTaskId();
    const value = this.selectedEstimate().trim();
    if (!taskId || !value) return;

    this.roomStore.confirmEstimate(taskId, value);
    this.dismissedForTaskId.set(taskId); // chiude la dialog dopo la conferma
  }
}
