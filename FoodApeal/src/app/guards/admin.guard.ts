import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserService } from '../service/user.service';

export const adminGuard: CanActivateFn = () => {
  const userService = inject(UserService);
  const router = inject(Router);

  const user = userService.getCurrentUser()();
  if (user?.isAdmin) {
    return true;
  }
  router.navigate(['/login']);
  return false;
};
