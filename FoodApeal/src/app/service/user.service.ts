import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { User } from '../models/user.model';
import { Order } from '../models/order.model';
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

interface UserDTO {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  address: string;
  phoneNumber: string;
  isAdmin: boolean;
  orders: OrderDTO[];
}

@Injectable({
  providedIn: 'root'
})

export class UserService {
  private readonly apiUrl = `${environment.apiUrl}/users`;
  private usersSignal = signal<User[]>([]);
  private currentUserSignal = signal<User | null>(null);

  constructor(private http: HttpClient) {}

  private mapDTO(dto: UserDTO): User {
    return {
      userId: dto.id,
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      password: '',
      isAdmin: dto.isAdmin,
      orders: (dto.orders ?? []).map(o => ({
        orderId: o.id,
        orderSum: o.orderSum,
        items: (o.orderItems ?? []).map(item => ({
          orderId: item.orderId,
          productId: item.productId,
          quantity: item.quantity,
          productName: item.productName ?? '',
          productImageUrl: item.productImageUrl ?? '',
          productPrice: item.productPrice ?? 0
        })),
        date: new Date(o.orderDate),
        userId: o.userId,
        status: o.status
      }))
    };
  }

  // Return read-only view of users
  getUsers(): Observable<User[]> {
    return this.http.get<UserDTO[]>(this.apiUrl).pipe(
      map(dtos => dtos.map(d => this.mapDTO(d))),
      tap(users => this.usersSignal.set(users))
    );
  }

  getCurrentUser() {
    return this.currentUserSignal.asReadonly();
  }

  // Find a user by id
  getUserById(id: number): Observable<User> {
    return this.http.get<UserDTO>(`${this.apiUrl}/${id}`).pipe(
      map(dto => this.mapDTO(dto))
    );
  }

  // Register a new user
  addUser(user: User): Observable<User> {
    const body = {
      id: 0,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      address: (user as any).address ?? '',
      phoneNumber: (user as any).phoneNumber ?? '',
      password: user.password
    };
    return this.http.post<UserDTO>(this.apiUrl, body).pipe(
      map(dto => this.mapDTO(dto))
    );
  }

  // Login with email and password
  loginUser(email: string, password: string): Observable<User> {
    return this.http.post<UserDTO>(`${this.apiUrl}/login`, { email, password }).pipe(
      map(dto => this.mapDTO(dto)),
      tap(user => this.currentUserSignal.set(user))
    );
  }

  addOrderToUser(userId: number, order: Order): void {
    const current = this.currentUserSignal();
    if (current?.userId === userId) {
      this.currentUserSignal.set({ ...current, orders: [...(current.orders ?? []), order] });
    }
  }

  setCurrentUser(user: User | null): void {
    this.currentUserSignal.set(user);
  }
}

