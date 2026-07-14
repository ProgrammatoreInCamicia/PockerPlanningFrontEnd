import { Component, ElementRef, inject, input, signal, ViewChild } from '@angular/core';
import { RoomStore } from '../../../../state/room.store';
import { TaskDto } from '../../../../core/websocket/poker-messages';
import { RoomApiService } from '../../../../core/http/room-api.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-task-list',
  imports: [CommonModule],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.scss',
})
export class TaskListComponent {
  @ViewChild('fileInput') taskFileInput!: ElementRef<HTMLInputElement>;

  readonly roomStore = inject(RoomStore);
  readonly roomApiService = inject(RoomApiService);

  readonly importing = signal(false);
  readonly importError = signal<string | null>(null);

  roomId = input("");

  selectTask(task: TaskDto): void {
    if (this.roomStore.currentUser()?.role !== 'facilitator') return;
    this.roomStore.selectTask(task.id);
  }

  importTasks(): void {
    this.importError.set(null);
    this.taskFileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      const file = target.files[0];
      this.importing.set(true);
      this.importError.set(null);

      this.roomApiService.importTasks(this.roomId(), file).subscribe({
        next: () => {
          this.importing.set(false);
        },
        error: (err) => {
          console.error("Errore import CSV: ", err);
          this.importing.set(false);
          this.importError.set(this.describeError(err));
        }
      });
      // reset del value per permettere di ricaricare lo stesso file (es. dopo una correzione)
      target.value = '';
    }
  }

  private describeError(err: unknown): string {
    if (err && typeof err === 'object' && 'status' in err) {
      const status = (err as { status: number }).status;
      if (status === 404) return 'Stanza non trovata';
      if (status === 400) return 'File CSV non valido';
    }
    return 'Errore durante il caricamento del file';
  }
}
