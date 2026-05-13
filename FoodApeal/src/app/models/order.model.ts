import { OrderItem } from './order-item.model';

export class Order {
    orderId: number = 0;
    orderSum: number = 0;
    items: OrderItem[] = [];
    date: Date = new Date();
    userId: number = 0;
    status: string = '';
}
