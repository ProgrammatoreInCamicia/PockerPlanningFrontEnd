import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmojiFlyOverlayComponent } from './emoji-fly-overlay.component';

describe('EmojiFlyOverlayComponent', () => {
  let component: EmojiFlyOverlayComponent;
  let fixture: ComponentFixture<EmojiFlyOverlayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmojiFlyOverlayComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EmojiFlyOverlayComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
