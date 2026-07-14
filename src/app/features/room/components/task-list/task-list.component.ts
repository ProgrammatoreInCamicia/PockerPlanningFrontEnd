import { Component, ElementRef, inject, input, signal, ViewChild } from '@angular/core';
import { RoomStore } from '../../../../state/room.store';
import { TaskDto } from '../../../../core/websocket/poker-messages';
import { RoomApiService } from '../../../../core/http/room-api.service';
import { CommonModule } from '@angular/common';
import { parseCsvHeaders, suggestMapping } from '../../../../core/csv/csv-headers';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-task-list',
  imports: [CommonModule, FormsModule],
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

  readonly pendingFile = signal<File | null>(null);
  readonly availableHeaders = signal<string[]>([]);
  readonly titleColumn = signal('');
  readonly priorityColumn = signal<string | null>(null);
  readonly linkColumn = signal<string | null>(null);

  selectTask(task: TaskDto): void {
    if (this.roomStore.currentUser()?.role !== 'facilitator') return;
    this.roomStore.selectTask(task.id);
  }

  openFilePicker(): void {
    this.importError.set(null);
    this.taskFileInput.nativeElement.click();
  }

  async onFileSelected(event: Event): Promise<void> {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      const file = target.files[0];

      // reset del value per permettere di ricaricare lo stesso file (es. dopo una correzione)
      target.value = '';

      // this.importing.set(true);
      // this.importError.set(null);

      try {
        const headers = await parseCsvHeaders(file);
        const suggestion = suggestMapping(headers);

        this.pendingFile.set(file);
        this.availableHeaders.set(headers);
        this.titleColumn.set(suggestion.titleColumn);
        this.priorityColumn.set(suggestion.priorityColumn);
        this.linkColumn.set(suggestion.linkColumn);
      } catch (err) {
        console.error('Errore lettura file:', err);
        this.importError.set('Impossibile leggere il file');
      }

      // this.roomApiService.importTasks(this.roomId(), file).subscribe({
      //   next: () => {
      //     this.importing.set(false);
      //   },
      //   error: (err) => {
      //     console.error("Errore import CSV: ", err);
      //     this.importing.set(false);
      //     this.importError.set(this.describeError(err));
      //   }
      // });
      
    }
  }

  cancelImport(): void {
    this.pendingFile.set(null);
    this.availableHeaders.set([]);
  }

  confirmImport(): void {
    const file = this.pendingFile();
    if (!file || !this.titleColumn()) return;

    this.importing.set(true);
    this.importError.set(null);

    this.roomApiService
      .importTasks(this.roomId(), file, {
        titleColumn: this.titleColumn(),
        priorityColumn: this.priorityColumn(),
        linkColumn: this.linkColumn(),
      })
      .subscribe({
        next: () => {
          this.importing.set(false);
          this.pendingFile.set(null);
          this.availableHeaders.set([]);
        },
        error: (err) => {
          console.error('Errore import CSV:', err);
          this.importing.set(false);
          this.importError.set(this.describeError(err));
        },
      });
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
