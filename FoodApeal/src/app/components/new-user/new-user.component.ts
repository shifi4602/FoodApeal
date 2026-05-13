import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { UserService } from '../../service/user.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-new-user',
  standalone: true,
  imports: [CommonModule, FormsModule, CardModule, ButtonModule, InputTextModule, RouterModule],
  templateUrl: './new-user.component.html',
  styleUrls: ['./new-user.component.scss']
})
export class NewUserComponent {

  private userService = inject(UserService);
  private router = inject(Router);

  firstName: string = '';
  lastName: string = '';
  email: string = '';
  isAdmin: boolean = false;
  password: string = '';

  register() {
    const newUser = {
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      isAdmin: this.isAdmin,
      password: this.password,
      orders: []
    };

    this.userService.addUser(newUser).subscribe({
      next: (registeredUser) => {
        this.userService.setCurrentUser(registeredUser);
        console.log('User registered:', registeredUser);
        this.firstName = '';
        this.lastName = '';
        this.email = '';
        this.isAdmin = false;
        this.password = '';
        alert('Registration successful!');
        this.router.navigate(['/']);
      },
      error: (err) => {
        console.error('Registration failed:', err);
        alert(err?.error ?? 'Registration failed. Please try again.');
      }
    });
  }
}
