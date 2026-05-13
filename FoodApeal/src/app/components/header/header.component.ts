import { Component, inject } from '@angular/core';
import { MenubarModule } from 'primeng/menubar';
import { InputTextModule } from 'primeng/inputtext';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { MenuItem } from 'primeng/api';
import { ImageModule } from 'primeng/image';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterModule } from '@angular/router';
import { UserService } from '../../service/user.service';



@Component({
  selector: 'app-header',
  standalone: true,
  imports: [MenubarModule, InputTextModule, BadgeModule, ButtonModule, ImageModule, CommonModule, RouterLink, RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  private userService = inject(UserService);
  currentUser = this.userService.getCurrentUser();

  items: MenuItem[] | undefined;

  ngOnInit() {
    this.items = [
      { label: 'דף הבית', routerLink: '/' },
      { label: 'בישול', routerLink: '/cook'},
      { label: 'אפייה', routerLink: '/products', queryParams: { categoryId: '3' } },
      { label: 'אירוח והגשה', routerLink: '/hosting-and-srving' },
      { label: 'אביזרי מטבח', routerLink: '/products' },
      { label: 'סכינים', routerLink: '/products', queryParams: { categoryId: '9' } },
      { label: 'מוצרי חשמל', routerLink: '/products', queryParams: { categoryId: '4' } },
      { label: 'אחסון וארגון', routerLink: '/organization' },
      { label: 'פחי אשפה', routerLink: '/products', queryParams: { categoryId: '5' } },
      { label: 'TO GO', routerLink: '/products', queryParams: { categoryId: '6' } },
      { label: 'סניפים', routerLink: 'branches' },
      { label: 'מתנות לארגונים וחברות', routerLink: '/gifts'}
    ];
  }
}
