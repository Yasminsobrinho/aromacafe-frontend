import { Component, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AvatarPickerComponent } from './avatar-picker.component';
import { AvatarViewComponent } from './avatar-view.component';
import { ToastService } from './services';
import { Stat, StatsBandComponent } from './stats-band.component';

interface DadosAdmin {
  nome: string;
  email: string;
  funcao: string;
}

@Component({
  selector: 'app-admin-profile',
  standalone: true,
  imports: [FormsModule, RouterLink, StatsBandComponent, AvatarPickerComponent, AvatarViewComponent],
  imports: [ProfileHeroComponent, StatsBandComponent, AvatarPickerComponent],
  host: { class: 'profile-page view' },
  template: `
    <section class="card hero">
      <app-avatar-view perfil="admin" />

      <div>
        <span class="badge">Administrador</span>
        <h1>{{ perfil.nome }}</h1>
        <p class="handle">{{ perfil.email || 'E-mail não informado' }}</p>
        <p class="bio">Área administrativa do Aroma Café.</p>

        <div class="actions" style="margin-top:16px">
          <button class="btn gold" type="button" (click)="editando = !editando">
            {{ editando ? 'Fechar edição' : 'Editar perfil' }}
          </button>
          <a class="btn about" routerLink="/home">Voltar à loja</a>
          <button class="btn about" type="button" (click)="sair()">Sair</button>
        </div>
      </div>
    </section>

    @if (editando) {
      <section class="card">
        <h2>Editar meus dados</h2>

        <form class="form-grid" (ngSubmit)="salvarPerfil()" novalidate autocomplete="off">
          <div class="campo">
            <label for="a-nome">Nome</label>
            <input id="a-nome" type="text" name="nome" autocomplete="off" [(ngModel)]="perfil.nome" />
          </div>

          <div class="campo">
            <label for="a-email">E-mail</label>
            <input
              id="a-email"
              type="email"
              name="email"
              autocomplete="off"
              [(ngModel)]="perfil.email"
              placeholder="Digite seu e-mail"
            />
          </div>

          <div class="campo full">
            <label for="a-funcao">Função</label>
            <input id="a-funcao" type="text" name="funcao" autocomplete="off" [(ngModel)]="perfil.funcao" />
          </div>

          @if (erroForm) {
            <p class="erro-form full">{{ erroForm }}</p>
          }

          <div class="actions full">
            <button class="btn gold" type="submit">Salvar alterações</button>
            <button class="btn about" type="button" (click)="cancelarEdicao()">Cancelar</button>
          </div>
        </form>
      </section>
    }

    <app-stats-band [stats]="stats" />

    <section class="card">
      <h2>Escolha seu avatar</h2>
      <p>Escolha a imagem que representa seu perfil.</p>
      <app-avatar-picker perfil="admin" />
    </section>

    <div class="cols">
      <section class="card">
        <h2>Permissões</h2>
        <p>Recursos disponíveis no painel administrativo</p>
        <label class="row"><span>Gerenciar usuários</span><input type="checkbox" class="sw" checked /></label>
        <label class="row"><span>Editar cardápio e preços</span><input type="checkbox" class="sw" checked /></label>
        <label class="row"><span>Ver relatórios financeiros</span><input type="checkbox" class="sw" checked /></label>
        <label class="row"><span>Emitir reembolsos</span><input type="checkbox" class="sw" /></label>

        @for (p of permissoes; track p.nome) {
          <div class="row">
            <span>{{ p.nome }}</span>
            <strong>{{ p.ativa ? 'Ativa' : 'Desativada' }}</strong>
          </div>
        }
      </section>

      <section class="card">
        <h2>Administradores</h2>
        <ul class="list">
          @for (nome of administradores; track nome) {
            <li>
              <span class="dot"></span>
              <div>
                <strong>{{ nome }}</strong>
                <small>Administrador</small>
              </div>
            </li>
          }
        </ul>
      </section>
    </div>

    <section class="card">
      <h2>Atividade recente</h2>
      <p>Área para acompanhar as ações realizadas no painel.</p>
      <ul class="list">
        <li>
          <span class="dot"></span>
          <div>
            <strong>Perfil administrativo</strong><small>{{ perfil.nome }}</small>
          </div>
        </li>
        <li>
          <span class="dot"></span>
          <div>
            <strong>Gerenciamento da cafeteria</strong>
            <small>Acesso ao painel administrativo</small>
          </div>
        </li>
      </ul>
    </section>

    <div class="toast" [class.on]="toast.visivel()" role="status">{{ toast.mensagem() }}</div>
  `,
})
export class AdminProfileComponent {
  private platformId = inject(PLATFORM_ID);
  private router = inject(Router);
  toast = inject(ToastService);
  erroForm = '';

  administradores = ['Emilly', 'Sara', 'Fernanda', 'Yohanne', 'Thays', 'Yasmin', 'Felipe'];

  adminSelecionado = '';

  perfil: DadosAdmin = {
    nome: '',
    email: '',
    funcao: 'Administrador',
  };

  perfilOriginal: DadosAdmin = { ...this.perfil };
  editando = false;

  stats: Stat[] = [
    { icone: 'users', valor: '1.482', rotulo: 'Usuários ativos' },
    { icone: 'receipt', valor: '36', rotulo: 'Pedidos hoje' },
    { icone: 'coin', valor: 'R$ 4.820', rotulo: 'Receita do dia' },
  ];
permissoes: { nome: string; ativa: boolean }[] = [];

 

  constructor() {
    // localStorage só existe no navegador (no SSR daria erro e tela branca).
    if (!isPlatformBrowser(this.platformId)) return;

    const logado = localStorage.getItem('aroma_admin_logado');

    if (!logado) {
      this.router.navigate(['/admin-login']);
      return;
    }

    this.carregarAdmin(logado);
  }

  sair(): void {
    localStorage.removeItem('aroma_admin_logado');
    this.router.navigate(['/admin-login']);
  }

  private chaveAdmin(nome: string): string {
    return 'aroma_admin_perfil_' + nome.toLowerCase();
  }

  carregarAdmin(nome: string): void {
    this.adminSelecionado = nome;

    const salvo = isPlatformBrowser(this.platformId)
      ? localStorage.getItem(this.chaveAdmin(nome))
      : null;

    if (salvo) {
      try {
        this.perfil = JSON.parse(salvo) as DadosAdmin;
      } catch {
        this.perfil = {
          nome,
          email: '',
          funcao: 'Administrador',
        };
      }
    } else {
      this.perfil = {
        nome,
        email: '',
        funcao: 'Administrador',
      };
    }

    this.perfilOriginal = { ...this.perfil };
    this.editando = false;
  }

  salvarPerfil(): void {
    this.erroForm = '';

    if (!this.perfil.nome.trim()) {
      this.erroForm = 'Digite o nome do administrador.';
      return;
    }

    if (this.perfil.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.perfil.email.trim())) {
      this.erroForm = 'Digite um e-mail válido.';
      return;
    }

    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.chaveAdmin(this.adminSelecionado), JSON.stringify(this.perfil));
    }

    this.perfilOriginal = { ...this.perfil };
    this.editando = false;

    this.toast.show('Perfil administrativo salvo!');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelarEdicao(): void {
    this.perfil = { ...this.perfilOriginal };
    this.erroForm = '';
    this.editando = false;
  }
}
