
export class Product { 
    Products_id: number = 0;
    Product_name!: string;
    price!: number;
    category_Id!: number;
    category_name?: string;
    description!: string;
    imageUrl!: string;
    isAvailable!: boolean;
    quantity?: number; // לא חובה, רק אם רוצים לעקוב אחרי כמות במוצר
}
