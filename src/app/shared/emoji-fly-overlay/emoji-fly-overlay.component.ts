import { afterNextRender, Component, effect, inject, Injector, signal } from '@angular/core';
import { RoomStore } from '../../state/room.store';

interface FlyingEmoji {
  id: string;
  emoji: string;
  anchorX: number;
  anchorY: number
}

interface Point {
  x: number;
  y: number;
}

@Component({
  selector: 'app-emoji-fly-overlay',
  imports: [],
  templateUrl: './emoji-fly-overlay.component.html',
  styleUrl: './emoji-fly-overlay.component.scss',
})
export class EmojiFlyOverlayComponent {
  readonly roomStore = inject(RoomStore);
  private readonly injector = inject(Injector);

  flying = signal<FlyingEmoji[]>([]);

  constructor() {
    effect(() => {
      const evt = this.roomStore.lastEmojiThrow();
      if (!evt) return;
      this.spawn(evt.id, evt.emoji, evt.fromUserId, evt.targetUserId);
    });
  }

  private spawn(id: string, emoji: string, fromUserId: string, targetUserId: string): void {
    const startEl = document.querySelector<HTMLElement>(`[data-participant-id="${fromUserId}"]`);
    const targetEl = document.querySelector<HTMLElement>(`[data-participant-id="${targetUserId}"]`);
    if (!targetEl) return;

    const start = startEl ? this.centerOf(startEl) : { x: window.innerWidth / 2, y: -40 };
    const end = this.centerOf(targetEl);

    // const rect = targetEl.getBoundingClientRect();
    // const targetX = rect.left + rect.width / 2;
    // const targetY = rect.top + rect.height / 2;

    // const startX = window.innerWidth / 2;
    // const startY = -40;
      this.flying.update((current) => [...current, { id, emoji, anchorX: start.x, anchorY: start.y }]);

    // this.flying.update((current) => [
    //   ...current,
    //   { id, emoji, startX, startY, deltaX: targetX - startX, deltaY: targetY - startY },
    // ]);

    // aspetta che Angular abbia davvero renderizzato l'elemento prima di animarlo
    afterNextRender(
      () => this.animateThrow(id, start, end),
      { injector: this.injector }
    );
    // setTimeout(() => {
    //   this.flying.update((current) => current.filter((f) => f.id !== id));
    // }, 900);
  }

   private animateThrow(id: string, start: Point, end: Point): void {
    const el = document.getElementById(`emoji-fly-${id}`);
    if (!el) return;

    const control = this.computeArcControlPoint(start, end);

    const steps = 14;
    const keyframes: Keyframe[] = [];

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const dx = 2 * (1 - t) * t * (control.x - start.x) + t * t * (end.x - start.x);
      const dy = 2 * (1 - t) * t * (control.y - start.y) + t * t * (end.y - start.y);

      const scale = 0.6 + Math.sin(t * Math.PI) * 0.35 + t * 0.15;
      const rotate = t * 260;
      const opacity = t < 0.08 ? t / 0.08 : t > 0.88 ? (1 - t) / 0.12 : 1;

      keyframes.push({
        transform: `translate(${dx}px, ${dy}px) rotate(${rotate}deg) scale(${scale})`,
        opacity,
        offset: t,
      });
    }

    const animation = el.animate(keyframes, {
      duration: 850,
      easing: 'ease-in-out',
      fill: 'forwards',
    });

    animation.finished
      .then(() => {
        this.flying.update((current) => current.filter((f) => f.id !== id));
      })
      .catch(() => {
        // animazione cancellata (es. componente distrutto a metà volo): pulizia comunque
        this.flying.update((current) => current.filter((f) => f.id !== id));
      });
  }

  private computeArcControlPoint(start: Point, end: Point): Point {
    const mid: Point = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };

    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const len = Math.hypot(dx, dy) || 1;

    // due candidati perpendicolari alla linea start->end, normalizzati
    const perp1 = { x: -dy / len, y: dx / len };
    const perp2 = { x: dy / len, y: -dx / len };

    const tableEl = document.querySelector<HTMLElement>('.table-surface');
    const tableCenter = tableEl ? this.centerOf(tableEl) : mid;

    // scegli il lato che si allontana di più dal centro del tavolo
    const distFromCenter = (p: Point) => Math.hypot(p.x - tableCenter.x, p.y - tableCenter.y);

    const distance = Math.hypot(dx, dy);
    const bulge = Math.min(Math.max(distance * 0.45, 90), 220);

    const candidate1 = { x: mid.x + perp1.x * bulge, y: mid.y + perp1.y * bulge };
    const candidate2 = { x: mid.x + perp2.x * bulge, y: mid.y + perp2.y * bulge };

    return distFromCenter(candidate1) > distFromCenter(candidate2) ? candidate1 : candidate2;
  }


  private centerOf(el: HTMLElement): Point {
    const rect = el.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }
}
