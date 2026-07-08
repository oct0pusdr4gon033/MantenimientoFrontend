import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth       = inject(AuthService);
  const router     = inject(Router);
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) return true;

  // El módulo requerido viene definido en el data de la ruta
  const moduloRequerido: string = route.data['modulo'];
  const rutaModulo = auth.getRutaModulo();

  // Si la ruta del módulo del usuario comienza con el módulo requerido, tiene acceso
  if (rutaModulo === `/${moduloRequerido}` || rutaModulo.startsWith(`/${moduloRequerido}`)) {
    return true;
  }

  // Si no tiene acceso, lo manda a su propio módulo
  router.navigate([rutaModulo]);
  return false;
};
