import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AvatarPickerComponent } from './avatar-picker.component';
import { AvatarViewComponent } from './avatar-view.component';
import { AvatarService, ToastService } from './services';
import { Stat, StatsBandComponent } from './stats-band.component';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [FormsModule, RouterLink, AvatarPickerComponent, AvatarViewComponent, StatsBandComponent],
  imports: [ProfileHeroComponent, StatsBandComponent, AvatarPickerComponent],
  host: { class: 'profile-page view' },
  template: `
    <section class="card hero">
      <app-avatar-view perfil="usuario" />

      <div>
        <h1>{{ nome || 'Meu perfil' }}</h1>
        <p class="handle">{{ email }}</p>
        <p class="bio">Seu espaço pessoal no Aroma Café.</p>

        <div class="actions" style="margin-top:16px">
          <button class="btn gold" type="button" (click)="editando = !editando">
            {{ editando ? 'Fechar edição' : 'Editar perfil' }}
          </button>
          <a class="btn about" routerLink="/home">Voltar à loja</a>
        </div>
      </div>
    </section>

    @if (!usuarioExiste) {
      <div class="card">
        <h2>Entre na sua conta</h2>
        <p>Faça login para visualizar e editar seu perfil.</p>
        <a class="btn gold" routerLink="/login">Ir para o login</a>
      </div>
    } @else {
      <app-stats-band [stats]="stats" />

      @if (editando) {
        <section class="card">
          <h2>Editar meus dados</h2>

          <form class="form-grid" (ngSubmit)="salvarPerfil()" novalidate autocomplete="off">
            <div class="campo">
              <label for="u-nome">Nome completo</label>
              <input id="u-nome" type="text" name="nome" autocomplete="off" [(ngModel)]="nome" />
            </div>

            <div class="campo">
              <label for="u-email">E-mail</label>
              <input id="u-email" type="email" name="email" autocomplete="off" [(ngModel)]="email" />
            </div>

            <div class="campo">
              <label for="u-nasc">Data de nascimento</label>
              <input
                id="u-nasc"
                type="date"
                name="nascimento"
                autocomplete="off"
                [(ngModel)]="nascimento"
                min="1900-01-01"
                [max]="hoje"
              />
            </div>

            <div class="campo full">
              <label for="u-end">Endereço</label>
              <input
                id="u-end"
                type="text"
                name="endereco"
                autocomplete="off"
                [(ngModel)]="endereco"
                placeholder="Rua, número, bairro"
              />
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

      <div class="cols">
        <section class="card">
          <h2>Escolha seu avatar</h2>
          <p>Escolha a imagem que representa seu perfil.</p>
          <app-avatar-picker perfil="usuario" />
        </section>

        <section class="card">
          <h2>Dados da conta</h2>
          <p>Informações da sua conta no Aroma Café.</p>

          <dl>
            <div>
              <dt>Nome</dt>
              <dd>{{ nome }}</dd>
            </div>
            <div>
              <dt>E-mail</dt>
              <dd>{{ email }}</dd>
            </div>
            <div>
              <dt>Data de nascimento</dt>
              <dd>{{ nascimentoFormatado }}</dd>
            </div>
            <div>
              <dt>Endereço</dt>
              <dd>{{ endereco || '—' }}</dd>
            </div>
          </dl>
        </section>
      </div>

      <section class="card">
        <h2>Notificações</h2>
        <p>Escolha o que você quer receber.</p>
        <label class="row"
          ><span>Pedido saiu para entrega<small>Aviso no celular</small></span
          ><input type="checkbox" class="sw" checked
        /></label>
        <label class="row"
          ><span>Novidades do cardápio<small>Uma vez por semana</small></span
          ><input type="checkbox" class="sw" checked
        /></label>
        <label class="row"
          ><span>Ofertas do clube<small>Cupons</small></span
          ><input type="checkbox" class="sw"
        /></label>
      </section>

      <section class="card perigo">
        <h2>Excluir conta</h2>
        <p>Apaga seus dados e sai da conta. Essa ação não pode ser desfeita.</p>

        @if (!confirmandoExclusao) {
          <button class="btn perigo" type="button" (click)="confirmandoExclusao = true">
            Excluir minha conta
          </button>
        } @else {
          <p><strong>Tem certeza que deseja excluir sua conta?</strong></p>
          <div class="actions">
            <button class="btn perigo" type="button" (click)="excluirConta()">Sim, excluir</button>
            <button class="btn about" type="button" (click)="confirmandoExclusao = false">
              Cancelar
            </button>
          </div>
        }
      </section>
    }

    <div class="toast" [class.on]="toast.visivel()" role="status">{{ toast.mensagem() }}</div>
  `,
})
export class UserProfileComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private av = inject(AvatarService);
  toast = inject(ToastService);

  confirmandoExclusao = false;

  erroForm = '';
  hoje = new Date().toISOString().slice(0, 10);

  usuarioExiste = false;
  editando = false;

  nome = '';
  email = '';
  nascimento = '';
  endereco = '';
  nomeOriginal = '';
  emailOriginal = '';
  nascimentoOriginal = '';
  enderecoOriginal = '';

  stats: Stat[] = [
    { icone: 'bag', valor: '0', rotulo: 'Pedidos feitos' },

    { icone: 'star', valor: '0', rotulo: 'Pontos do clube' },
  ];

  constructor() {
    this.carregarPerfil();
  }

  carregarPerfil(): void {
    const usuario = this.auth.usuarioLogado();

    this.usuarioExiste = !!usuario;

    if (usuario) {
      this.nome = usuario.nome;
      this.email = usuario.email;
      this.nascimento = usuario.nascimento ?? '';
      this.endereco = usuario.endereco ?? '';
      this.nomeOriginal = usuario.nome;
      this.emailOriginal = usuario.email;
      this.nascimentoOriginal = usuario.nascimento ?? '';
      this.enderecoOriginal = usuario.endereco ?? '';
    }
  }

  // Converte "2006-08-08" em "08/08/2006" sem usar Date (evita erro de fuso horário).
  get nascimentoFormatado(): string {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(this.nascimento);
    return m ? `${m[3]}/${m[2]}/${m[1]}` : '—';
  }

  salvarPerfil(): void {
    this.erroForm = '';

    if (this.nome.trim().length < 3) {
      this.erroForm = 'Digite seu nome completo (mínimo 3 letras).';
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email.trim())) {
      this.erroForm = 'Digite um e-mail válido.';
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(this.nascimento)) {
      this.erroForm = 'Escolha uma data de nascimento válida.';
      return;
    }

    if (this.nascimento > this.hoje || this.nascimento < '1900-01-01') {
      this.erroForm = 'A data de nascimento não pode estar no futuro nem antes de 1900.';
      return;
    }

    if (this.endereco.trim().length < 5) {
      this.erroForm = 'Digite seu endereço.';
      return;
    }

    this.auth.atualizarPerfil({
      nome: this.nome.trim(),
      email: this.email.trim(),
      nascimento: this.nascimento,
      endereco: this.endereco.trim(),
    });

    this.nomeOriginal = this.nome;
    this.emailOriginal = this.email;
    this.nascimentoOriginal = this.nascimento;
    this.enderecoOriginal = this.endereco;
    this.editando = false;

    this.toast.show('Perfil atualizado com sucesso!');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async excluirConta(): Promise<void> {
    await this.av.removerPersonalizado('usuario');
    this.auth.excluirConta();
    this.router.navigateByUrl('/home');
  }

  cancelarEdicao(): void {
    this.nome = this.nomeOriginal;
    this.email = this.emailOriginal;
    this.nascimento = this.nascimentoOriginal;
    this.endereco = this.enderecoOriginal;
    this.erroForm = '';
    this.editando = false;
  }
}
