import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-perfil-usuario',
  standalone: true,
  imports: [CommonModule, FormsModule,RouterLink],
  templateUrl: './perfil-usuario.html',
  styleUrl: './perfil-usuario.css',
})
export class PerfilUsuario {
  editando = false;
  mensagem = '';

  usuario = {
    nome: 'Cliente Aroma',
    email: 'cliente@email.com',
    dataNascimento: 'dd/MM/yyyy',
    endereco: 'Não informado',
    avatar: '',
  };

  avatares = ['☕', '🧋', '🥐', '🍰', '🍩', '🐻', '🐱', '🐼', '🌸', '🤎'];

  iniciarEdicao(): void {
    this.editando = true;
    this.mensagem = '';
  }

  salvarEdicao(): void {
    localStorage.setItem('aroma_perfil_usuario', JSON.stringify(this.usuario));

    this.editando = false;
    this.mensagem = 'Perfil atualizado com sucesso!';
  }

  cancelarEdicao(): void {
    const dadosSalvos = localStorage.getItem('aroma_perfil_usuario');

    if (dadosSalvos) {
      this.usuario = JSON.parse(dadosSalvos);
    }

    this.editando = false;
  }

  carregarPerfil(): void {
    const dadosSalvos = localStorage.getItem('aroma_perfil_usuario');

    if (dadosSalvos) {
      this.usuario = JSON.parse(dadosSalvos);
    }
  }

  constructor() {
    this.carregarPerfil();
  }
}
