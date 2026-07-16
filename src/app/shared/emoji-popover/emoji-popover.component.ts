import { Component, computed, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { searchEmoji } from '../../core/emoji/emoji-data';

@Component({
  selector: 'app-emoji-popover',
  imports: [FormsModule],
  templateUrl: './emoji-popover.component.html',
  styleUrl: './emoji-popover.component.scss',
})
export class EmojiPopoverComponent {
  readonly emojiSelected = output<string>();

  readonly query = signal('');
  readonly results = computed(() => searchEmoji(this.query()));

  select(emoji: string): void {
    this.emojiSelected.emit(emoji);
  }
}
