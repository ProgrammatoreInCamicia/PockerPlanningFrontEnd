import { Component, ElementRef, inject, input, ViewChild } from '@angular/core';
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

  roomId = input("");

  selectTask(task: TaskDto): void {
    this.roomStore.selectTask(task.id);
  }

  importTasks(): void {
    this.taskFileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      const file = target.files[0];
      this.roomApiService.importTasks(this.roomId(), file).subscribe({
      // Handle file selection logic here
      });
    }
  }
}
