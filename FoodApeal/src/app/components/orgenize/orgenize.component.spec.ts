import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrgenizeComponent } from './orgenize.component';

describe('OrgenizeComponent', () => {
  let component: OrgenizeComponent;
  let fixture: ComponentFixture<OrgenizeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrgenizeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrgenizeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
