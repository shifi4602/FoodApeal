import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { BasketServiceService } from '../../service/basket-service.service';
import { OrderService } from '../../service/order.service';
import { UserService } from '../../service/user.service';
import { Order } from '../../models/order.model';

@Component({
  selector: 'app-pay',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, InputTextModule, DropdownModule, FormsModule, RouterModule],
  templateUrl: './pay.component.html',
  styleUrls: ['./pay.component.scss']
})
export class PayComponent implements OnInit {
  private basketService = inject(BasketServiceService);
  private orderService = inject(OrderService);
  private userService = inject(UserService);
  private router = inject(Router);
  cardNumber = '';
  expiryMonth = '';
  expiryYear = '';
  cvv = '';
  streetAddress = '';
  city = '';
  postalCode = '';
  total = 0;

  months: string[] = [
    '01', '02', '03', '04', '05', '06',
    '07', '08', '09', '10', '11', '12'
  ];

  years: string[] = [];

  cities: string[] = [
    'Jerusalem',
    'Tel Aviv',
    'Haifa',
    'Rishon LeZion',
    'Petah Tikva',
    'Ashdod',
    'Netanya',
    'Beersheba',
    'Holon',
    'Bnei Brak',
    'Ramat Gan',
    'Bat Yam',
    'Ashkelon',
    'Rehovot',
    'Herzliya',
    'Kfar Saba',
    'Hadera',
    'Modiin',
    'Nazareth',
    'Raanana'
  ];

  ngOnInit(): void {
    this.total = this.basketService.getTotalPrice();
    // Generate years from current year to 10 years ahead
    const currentYear = new Date().getFullYear();
    for (let i = 0; i < 10; i++) {
      this.years.push((currentYear + i).toString());
    }
  }

  pay(): void {
    if (!this.cardNumber || !this.expiryMonth || !this.expiryYear || !this.cvv || !this.streetAddress || !this.city || !this.postalCode) {
      alert('Please fill all payment and address fields');
      return;
    }

    const currentUser = this.userService.getCurrentUser()();
    if (!currentUser) {
      alert('Please login before placing an order');
      this.router.navigate(['/login']);
      return;
    }

    const basketItems = this.basketService.getItems();
    if (basketItems.length === 0) {
      alert('Your basket is empty');
      return;
    }

    const order: Order = {
      orderId: 0,
      orderSum: this.basketService.getTotalPrice(),
      items: basketItems.map(item => ({
        orderId: 0,
        productId: item.Products_id,
        quantity: item.quantity || 1,
        productName: item.Product_name,
        productImageUrl: item.imageUrl,
        productPrice: item.price
      })),
      date: new Date(),
      userId: currentUser.userId ?? 0,
      status: 'Placed'
    };

    try {
      this.orderService.addOrder(order).subscribe({
        next: () => {
          alert('Payment successful — ' + this.total.toFixed(2));
          this.basketService.clearBasket();
          this.cardNumber = '';
          this.expiryMonth = '';
          this.expiryYear = '';
          this.cvv = '';
          this.streetAddress = '';
          this.city = '';
          this.postalCode = '';
          this.total = 0;
          this.router.navigate(['/home']);
        },
        error: (err) => {
          console.error('Order failed:', err);
          alert('Order placement failed. Please try again.');
        }
      });
    } catch (error) {
      alert('Unable to place order. Please login again.');
      return;
    }
  }
}
