
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

// Formato dos dados do usuário que ficam salvos no localStorage
interface Usuario {
  nascimento: string;
  endereco: string;
  nome: string;
  email: string;
  foto?: string;
  provedor?: 'email' | 'google' | 'apple';
}

// Dados do perfil que a pessoa edita. Ficam guardados por e-mail para
// não se perderem quando ela sai da conta e entra de novo.
interface DadosPerfil {
  nome: string;
  nascimento: string;
  endereco: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  // Chave usada para salvar e recuperar o usuário
  private readonly STORAGE_KEY = 'aroma_usuario';

  // Chave onde ficam os perfis salvos de todas as contas deste navegador
  private readonly PERFIS_KEY = 'aroma_perfis';

  private readonly platformId = inject(PLATFORM_ID);

  // Signal que mantém os dados do usuário logado
  usuarioLogado = signal<Usuario | null>(this.recuperarDoStorage());

  // Recupera o usuário salvo no navegador
  private recuperarDoStorage(): Usuario | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    const dados = localStorage.getItem(this.STORAGE_KEY);

    if (!dados) {
      return null;
    }

    try {
      return JSON.parse(dados) as Usuario;
    } catch {
      return null;
    }
  }

  private chavePerfil(email: string): string {
    return email.trim().toLowerCase();
  }

  private lerPerfis(): Record<string, DadosPerfil> {
    if (!isPlatformBrowser(this.platformId)) {
      return {};
    }

    try {
      return JSON.parse(localStorage.getItem(this.PERFIS_KEY) ?? '{}') ?? {};
    } catch {
      return {};
    }
  }

  private gravarPerfis(perfis: Record<string, DadosPerfil>): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      localStorage.setItem(this.PERFIS_KEY, JSON.stringify(perfis));
    } catch {}
  }

  // Ao entrar, devolve ao usuário o nome, a data de nascimento e o endereço
  // que ele já tinha salvo antes (em vez de apagar tudo a cada login).
  private comPerfilSalvo(usuario: Usuario): Usuario {
    const salvo = this.lerPerfis()[this.chavePerfil(usuario.email)];

    if (!salvo) {
      return usuario;
    }

    return {
      ...usuario,
      nome: salvo.nome || usuario.nome,
      nascimento: salvo.nascimento || usuario.nascimento,
      endereco: salvo.endereco || usuario.endereco,
    };
  }

  // Salva o usuário no localStorage e atualiza o signal
  private salvarUsuario(usuario: Usuario): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify(usuario)
      );
    }

    this.usuarioLogado.set(usuario);
  }

  // Decodifica o payload de um JWT
  // Atenção: decodificar não significa validar a autenticidade do token.
  private decodificarToken(token: string): any {
    const partes = token.split('.');

    if (partes.length !== 3) {
      throw new Error('Token inválido');
    }

    const payloadBase64 = partes[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const base64Completo = payloadBase64.padEnd(
      payloadBase64.length +
        ((4 - (payloadBase64.length % 4)) % 4),
      '='
    );

    const bytes = Uint8Array.from(
      atob(base64Completo),
      caractere => caractere.charCodeAt(0)
    );

    return JSON.parse(
      new TextDecoder().decode(bytes)
    );
  }

  // Login tradicional com e-mail e senha
  login(email: string, senha: string): boolean {
    if (email.includes('@') && senha.length >= 6) {
      const usuario: Usuario = {
        nome: email.split('@')[0],
        email,
        provedor: 'email',
        nascimento: '',
        endereco: ''
      };

      this.salvarUsuario(this.comPerfilSalvo(usuario));

      return true;
    }

    return false;
  }

  // Cadastro: já guarda nome, data de nascimento e endereço informados
  cadastrar(dados: {
    nome: string;
    email: string;
    senha: string;
    nascimento: string;
    endereco: string;
  }): boolean {
    if (!dados.email.includes('@') || dados.senha.length < 6) {
      return false;
    }

    const usuario: Usuario = {
      nome: dados.nome.trim(),
      email: dados.email.trim(),
      provedor: 'email',
      nascimento: dados.nascimento,
      endereco: dados.endereco.trim()
    };

    const perfis = this.lerPerfis();
    perfis[this.chavePerfil(usuario.email)] = {
      nome: usuario.nome,
      nascimento: usuario.nascimento,
      endereco: usuario.endereco
    };
    this.gravarPerfis(perfis);

    this.salvarUsuario(usuario);

    return true;
  }

  // Login com Google
  loginComGoogle(credentialJwt: string): boolean {
    try {
      if (
        !credentialJwt ||
        !isPlatformBrowser(this.platformId)
      ) {
        return false;
      }

      const payload = this.decodificarToken(credentialJwt);

      if (!payload.email) {
        return false;
      }

      const usuario: Usuario = {  
        nome: payload.name ?? payload.email.split('@')[0],
        email: payload.email,
        foto: payload.picture,
        provedor: 'google',
        nascimento: '',
        endereco: ''
      };

      this.salvarUsuario(this.comPerfilSalvo(usuario));

      return true;
    } catch {
      return false;
    }
  }

  // Login com Apple
  loginComApple(
    idToken: string,
    nomeRecebido?: string
  ): boolean {
    try {
      if (
        !idToken ||
        !isPlatformBrowser(this.platformId)
      ) {
        return false;
      }

      const payload = this.decodificarToken(idToken);

      if (!payload.email) {
        return false;
      }

      const usuario: Usuario = {
        nome:
          nomeRecebido ||
          payload.name ||
          payload.email.split('@')[0],
        email: payload.email,
        provedor: 'apple',
        nascimento: '',
        endereco: ''
      };

      this.salvarUsuario(this.comPerfilSalvo(usuario));

      return true;
    } catch {
      return false;
    }
  }
atualizarPerfil(
    dados: Partial<Pick<Usuario, 'nome' | 'email' | 'nascimento' | 'endereco'>>
  ): void {
    const atual = this.usuarioLogado();

    if (!atual) return;

    const atualizado: Usuario = { ...atual, ...dados };

    // Guarda os dados por e-mail, para continuarem aí no próximo login
    const perfis = this.lerPerfis();
    const chaveAntiga = this.chavePerfil(atual.email);
    const chaveNova = this.chavePerfil(atualizado.email);

    if (chaveAntiga !== chaveNova) {
      delete perfis[chaveAntiga];
    }

    perfis[chaveNova] = {
      nome: atualizado.nome,
      nascimento: atualizado.nascimento,
      endereco: atualizado.endereco
    };
    this.gravarPerfis(perfis);

    this.salvarUsuario(atualizado);
  }

  // Exclui a conta: apaga os dados salvos e desloga
  excluirConta(): void {
    const atual = this.usuarioLogado();

    if (isPlatformBrowser(this.platformId)) {
      if (atual) {
        const perfis = this.lerPerfis();
        delete perfis[this.chavePerfil(atual.email)];
        this.gravarPerfis(perfis);
      }

      localStorage.removeItem(this.STORAGE_KEY);
    }

    this.usuarioLogado.set(null);
  }

  // Desloga o usuário
  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.STORAGE_KEY);
    }

    this.usuarioLogado.set(null);
  }

  // Verifica se existe alguém logado
  get estaLogado(): boolean {
    return this.usuarioLogado() !== null;
  }
}

