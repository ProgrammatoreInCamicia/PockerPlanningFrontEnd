import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmojiPopoverComponent } from './emoji-popover.component';

describe('EmojiPopoverComponent', () => {
  let component: EmojiPopoverComponent;
  let fixture: ComponentFixture<EmojiPopoverComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmojiPopoverComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EmojiPopoverComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
