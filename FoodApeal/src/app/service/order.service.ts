import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { Order } from '../models/order.model';
import { UserService } from './user.service';
import { environment } from '../../environments/environment';

interface OrderItemDTO {
  orderId: number;
  productId: number;
  quantity: number;
  productName?: string;
  productImageUrl?: string;
  productPrice?: number;
}

interface OrderDTO {
  id: number;
  userId: number;
  orderDate: string;
  orderSum: number;
  status: string;
  orderItems: OrderItemDTO[];
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly apiUrl = `${environment.apiUrl}/orders`;
  private ordersSignal = signal<Order[]>([]);

  constructor(private http: HttpClient, private userService: UserService) {}

  private mapDTO(dto: OrderDTO): Order {
    return {
      orderId: dto.id,
      orderSum: dto.orderSum,
      items: (dto.orderItems ?? []).map(item => ({
        orderId: item.orderId,
        productId: item.productId,
        quantity: item.quantity,
        productName: item.productName ?? '',
        productImageUrl: item.productImageUrl ?? '',
        productPrice: item.productPrice ?? 0
      })),
      date: new Date(dto.orderDate),
      userId: dto.userId,
      status: dto.status
    };
  }

  // Readonly view of locally cached orders
  getOrders() {
    return this.ordersSignal.asReadonly();
  }

  // Find order by id (from cache)
  getOrderById(id: number): Order | undefined {
    return this.ordersSignal().find(o => o.orderId === id);
  }

  // Add a new order via the API
  addOrder(order: Order): Observable<Order> {
    const currentUser = this.userService.getCurrentUser()();
    if (!currentUser) {
      throw new Error('User must be logged in to place an order.');
    }

    const body: OrderDTO = {
      id: 0,
      userId: currentUser.userId ?? 0,
      orderDate: new Date().toISOString().split('T')[0],
      orderSum: order.orderSum,
      status: order.status || 'Placed',
      orderItems: order.items.map(item => ({
        orderId: 0,
        productId: item.productId,
        quantity: item.quantity,
        productName: item.productName,
        productImageUrl: item.productImageUrl,
        productPrice: item.productPrice
      }))
    };

    return this.http.post<OrderDTO>(this.apiUrl, body).pipe(
      map(dto => this.mapDTO(dto)),
      tap(newOrder => {
        this.ordersSignal.update(list => [...list, newOrder]);
        this.userService.addOrderToUser(newOrder.userId, newOrder);
      })
    );
  }
}

