import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HostingAndSrvingComponent } from './hosting-and-srving.component';

describe('HostingAndSrvingComponent', () => {
  let component: HostingAndSrvingComponent;
  let fixture: ComponentFixture<HostingAndSrvingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostingAndSrvingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HostingAndSrvingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
