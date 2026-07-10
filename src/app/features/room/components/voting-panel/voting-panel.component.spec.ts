import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VotingPanelComponent } from './voting-panel.component';

describe('VotingPanelComponent', () => {
  let component: VotingPanelComponent;
  let fixture: ComponentFixture<VotingPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VotingPanelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(VotingPanelComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
