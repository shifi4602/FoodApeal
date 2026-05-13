
export class Product2 { 
    Products_id: number = 0;
    Product_name!: string;
    price!: number;
    category_Id!: number;
    category_name?: string;
    description!: string;
    imageUrl!: string;
    isAvailable: boolean = true;
    quantity?: number; // לא חובה, רק אם רוצים לעקוב אחרי כמות במוצר
}
