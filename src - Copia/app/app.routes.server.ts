import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Telas que dependem de login/localStorage: renderizadas só no navegador.
  { path: 'admin', renderMode: RenderMode.Client },
  { path: 'admin-login', renderMode: RenderMode.Client },
  { path: 'usuario', renderMode: RenderMode.Client },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
