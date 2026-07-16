import { Component, computed, effect, inject, signal } from '@angular/core';
import { ModalComponent } from '../../../../shared/modal/modal.component';
import { RoomStore } from '../../../../state/room.store';

@Component({
  selector: 'app-results',
  imports: [ModalComponent],
  templateUrl: './results.component.html',
  styleUrl: './results.component.scss',
})
export class ResultsComponent {
  readonly roomStore = inject(RoomStore);

  private readonly dismissedForTaskId = signal<string | null>(null);

  readonly isOpen = computed(() => {
    const revealed = this.roomStore.revealed();
    const taskId = this.roomStore.activeTaskId();
    const stats = this.roomStore.voteStats();
    return revealed && stats !== null && this.dismissedForTaskId() !== taskId;
  });

  constructor() {
    // quando cambia il task attivo (nuovo selectTask), resetta la "chiusura manuale" precedente
    effect(() => {
      const taskId = this.roomStore.activeTaskId();
      if (this.roomStore.revealed() === false) {
        this.dismissedForTaskId.set(null);
      }
    });
  }

  close(): void {
    if (!this.roomStore.revealed()) return; // chiusura "eco" del native close, non un vero dismiss manuale
    this.dismissedForTaskId.set(this.roomStore.activeTaskId());
  }
}
