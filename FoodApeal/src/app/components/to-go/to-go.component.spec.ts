import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToGoComponent } from './to-go.component';

describe('ToGoComponent', () => {
  let component: ToGoComponent;
  let fixture: ComponentFixture<ToGoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToGoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ToGoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
