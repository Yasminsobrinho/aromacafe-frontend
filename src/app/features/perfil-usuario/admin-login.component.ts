import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <main class="admin-login">
      <section class="login-card">
        <h1>AROMA CAFÉ</h1>
        <h2>Área do administrador</h2>
        <p>Entre com seu nome e a senha da equipe.</p>

        <label for="nome">Seu nome</label>
       <select id="nome" [(ngModel)]="nome">
          <option value="">Selecione seu nome</option>
       @for (pessoa of equipe; track pessoa) {
          <option [value]="pessoa">{{ pessoa }}</option>
          }
        </select>

        <label for="senha">Senha compartilhada</label>
        <input id="senha" type="password" [(ngModel)]="senha" placeholder="Digite a senha" />

        <p class="erro" *ngIf="erro">{{ erro }}</p>

        <button (click)="entrar()">Entrar</button>
      </section>
    </main>
  `,
  styles: [
    `
      .admin-login {
        min-height: 100vh;
        background: #140b06;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        color: #f3e9db;
        font-family: Arial, sans-serif;
      }

      .login-card {
        background: #1f120b;
        border: 1px solid #c9a06a;
        border-radius: 18px;
        padding: 35px;
        width: 100%;
        max-width: 420px;
      }

      h1 {
        color: #dcb783;
        text-align: center;
      }
      h2 {
        text-align: center;
      }
      p {
        color: #cdbba6;
      }

      label {
        display: block;
        margin-top: 18px;
        margin-bottom: 7px;
      }

      input,
      select {
        width: 100%;
        box-sizing: border-box;
        padding: 13px;
        border-radius: 8px;
        border: 1px solid #c9a06a;
        background: #140b06;
        color: #f3e9db;
      }

      button {
        width: 100%;
        margin-top: 24px;
        padding: 14px;
        border: 0;
        border-radius: 8px;
        background: #c9a06a;
        color: #140b06;
        font-weight: bold;
        cursor: pointer;
      }

      .erro {
        color: #ff9999;
      }
    `,
  ],
})
export class AdminLoginComponent {
 equipe = ['Emilly', 'Sara', 'Fernanda', 'Yohanne', 'Thays', 'Yasmin', 'Felipe'];

  nome = '';
  senha = '';
  erro = '';

  // Troque esta senha pela senha escolhida pelo grupo.
  private readonly senhaEquipe = 'AromaCafe2026';

  constructor(private router: Router) {}

  entrar(): void {
    this.erro = '';

    if (!this.nome) {
      this.erro = 'Selecione seu nome.';
      return;
    }

    if (this.senha !== this.senhaEquipe) {
      this.erro = 'Senha incorreta.';
      return;
    }

    localStorage.setItem('aroma_admin_logado', this.nome);

    this.router.navigate(['/admin']);
  }
}
