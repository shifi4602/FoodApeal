import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BasketComponent } from './basket.component';
import { BasketServiceService } from '../../service/basket-service.service';
import { Product } from '../../models/products.model';
import { of } from 'rxjs';

describe('BasketComponent', () => {
  let component: BasketComponent;
  let fixture: ComponentFixture<BasketComponent>;
  let basketService: BasketServiceService;

  const mockItems: Product[] = [
    { Products_id: 1, Product_name: 'Test', price: 10, Category_Id: 1, Description: 'd', imageUrl: '' }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BasketComponent],
      providers: [BasketServiceService]
    }).compileComponents();

    fixture = TestBed.createComponent(BasketComponent);
    component = fixture.componentInstance;
    basketService = TestBed.inject(BasketServiceService);

    // initialize basket service state
    (basketService as any).clearBasket();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show empty when no items', () => {
    component.refresh();
    expect(component.items.length).toBe(0);
    expect(component.total).toBe(0);
  });

  it('should refresh items from service', () => {
    basketService.addProductTBasket(mockItems[0]);
    component.refresh();
    expect(component.items.length).toBe(1);
    expect(component.total).toBe(10);
  });

  it('should remove item', () => {
    basketService.addProductTBasket(mockItems[0]);
    component.refresh();
    component.remove(mockItems[0]);
    expect(component.items.length).toBe(0);
    expect(component.total).toBe(0);
  });
});
