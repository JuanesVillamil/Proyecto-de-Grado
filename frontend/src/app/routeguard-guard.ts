import { CanActivateChildFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const routeguardGuard: CanActivateChildFn = (childRoute, state) => {
  const router = inject(Router);
  const isAuthorized = !!localStorage.getItem('token'); 

  if (!isAuthorized) {
    router.navigateByUrl('/');
    return false;
  }

  return true;
};
