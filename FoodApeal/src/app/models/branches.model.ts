export class Branch {
    imgUrl: string = 'assets/images/media_07062023144314.png';
    id!: number;
    name!: string;
    address?: string;
    city!: string;
    phone?: string;
    openingHours?: string;
    coordinates?: {
        lat: number;
        lng: number;
    };
}
