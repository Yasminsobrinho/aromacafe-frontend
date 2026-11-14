import { PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

// Guard que protege rotas (ex: /carrinho).
// O Angular chama essa função ANTES de deixar a rota carregar.
export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Se já tem usuário logado (auth.estaLogado vem do AuthService), libera o acesso
  if (auth.estaLogado) {
    return true;
  }

  // Se NÃO tem login, manda pro /login e guarda a URL que o cliente queria acessar.
  // Isso vira o "?returnUrl=/carrinho" na barra de endereço.
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });

  return false; // bloqueia o carregamento da rota original (o carrinho)
};

// Guard do painel do administrador: só entra quem passou pelo /admin-login.
export const adminGuard: CanActivateFn = () => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  // No servidor (SSR) não existe localStorage; a checagem real acontece no navegador.
  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  try {
    if (localStorage.getItem('aroma_admin_logado')) {
      return true;
    }
  } catch {}

  return router.createUrlTree(['/admin-login']);
};
