import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConnectionBadgeComponent } from './connection-badge.component';

describe('ConectionBadgeComponent', () => {
  let component: ConnectionBadgeComponent;
  let fixture: ComponentFixture<ConnectionBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConnectionBadgeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ConnectionBadgeComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
