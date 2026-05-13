import { Order } from "./order.model";

export class User {
    userId?: number = 0;
    firstName!: string;
    lastName!: string;
    email!: string;
    password!: string;
    isAdmin: boolean = false;
    orders?: Order[] = [];
}
