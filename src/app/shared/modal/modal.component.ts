import { Component, effect, ElementRef, input, output, viewChild } from '@angular/core';

@Component({
  selector: 'app-modal',
  imports: [],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.scss',
})
export class ModalComponent {
  readonly open = input<boolean>(false);
  readonly title = input<string>('');
  readonly closable = input<boolean>(true);
  readonly closed = output<void>();

  readonly dialogRef = viewChild<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    effect(() => {
      const dialog = this.dialogRef()?.nativeElement;
      if (!dialog) return;

      if (this.open() && !dialog.open) {
        dialog.showModal();
      } else if (!this.open() && dialog.open) {
        dialog.close();
      }
    });
  }

  onNativeClose(): void {
    this.closed.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if (!this.closable()) return;
    const dialog = this.dialogRef()?.nativeElement;
    if (event.target === dialog) {
      dialog?.close();
    }
  }

  onCancelAttempt(event: Event): void {
    // intercetta la chiusura via tasto Esc, nativa del <dialog>
    if (!this.closable()) {
      event.preventDefault();
    }
  }

  requestClose(): void {
    if (!this.closable()) return;
    this.dialogRef()?.nativeElement?.close();
  }
}
