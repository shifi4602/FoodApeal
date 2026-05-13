import { Order } from "./order.model";

export class User2 {
    userId?: number = 0;
    firstName!: string;
    lastName!: string;
    email!: string;
    isAdmin: boolean = false;
    orders?: Order[] = [];
}
