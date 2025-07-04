import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubscribeMessageComponent } from './subscribe-message.component';

describe('SubscribeMessageComponent', () => {
  let component: SubscribeMessageComponent;
  let fixture: ComponentFixture<SubscribeMessageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubscribeMessageComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SubscribeMessageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
