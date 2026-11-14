import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Perfil = 'usuario' | 'admin';

export const AVATARES = [
  ['torrada', 'Torrada'],
  ['muffin', 'Muffin'],
  ['croissant', 'Croissant'],
  ['bolo', 'Bolo'],
  ['cha', 'Chá'],
  ['panquecas', 'Panquecas'],
  ['donut', 'Donut'],
  ['cafe', 'Café'],
  ['sorvete', 'Sorvete'],
  ['boba', 'Boba'],
  ['cookie', 'Cookie'],
  ['macaron', 'Macaron'],
].map(([key, nome]) => ({ key, nome }));

interface AvatarPersonalizado {
  url: string;
  tipo: 'png' | 'mp4' | 'gif' ;
}

@Injectable({ providedIn: 'root' })
export class AvatarService {
  private platformId = inject(PLATFORM_ID);
  private urls: Record<Perfil, string | null> = {
    usuario: null,
    admin: null,
  };

  readonly escolhido = {
    usuario: signal(this.ler('usuario', 'croissant')),
    admin: signal(this.ler('admin', 'cafe')),
  };

  readonly customizado = {
    usuario: signal<AvatarPersonalizado | null>(null),
    admin: signal<AvatarPersonalizado | null>(null),
  };

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      void this.carregar('usuario');
      void this.carregar('admin');
    }
  }

  src(key: string): string {
    return `/avatars/png/${key}.png`;
  }

  definir(perfil: Perfil, key: string) {
    this.customizado[perfil].set(null);
    this.escolhido[perfil].set(key);

    try {
      localStorage.setItem('av-' + perfil, key);
    } catch {}

    void this.removerArquivoSalvo(perfil);
  }

  async definirArquivo(perfil: Perfil, arquivo: File) {
    const tiposPermitidos = ['image/png', 'image/gif', 'video/mp4'];

    if (!tiposPermitidos.includes(arquivo.type)) {
      throw new Error('Escolha um arquivo PNG, GIF ou MP4.');
    }

    if (arquivo.size > 20 * 1024 * 1024) {
      throw new Error('O arquivo deve ter no máximo 20 MB.');
    }

    await this.salvarNoBanco(perfil, arquivo);

    if (this.urls[perfil]) {
      URL.revokeObjectURL(this.urls[perfil]!);
    }

    const url = URL.createObjectURL(arquivo);
    this.urls[perfil] = url;

    this.customizado[perfil].set({
      url,
      tipo: arquivo.type === 'image/png' ? 'png' : arquivo.type === 'video/mp4' ? 'mp4' : 'gif',
    });
  }

  async removerPersonalizado(perfil: Perfil) {
    await this.removerArquivoSalvo(perfil);

    if (this.urls[perfil]) {
      URL.revokeObjectURL(this.urls[perfil]!);
      this.urls[perfil] = null;
    }

    this.customizado[perfil].set(null);
    this.escolhido[perfil].set(perfil === 'admin' ? 'cafe' : 'croissant');

    try {
      localStorage.removeItem('av-' + perfil);
    } catch {}
  }

  private async carregar(perfil: Perfil) {
    try {
      const arquivo = await this.buscarNoBanco(perfil);

      if (!arquivo) return;

      const url = URL.createObjectURL(arquivo);
      this.urls[perfil] = url;

      this.customizado[perfil].set({
        url,
        tipo: arquivo.type === 'image/png' ? 'png' : arquivo.type === 'video/mp4' ? 'mp4' : 'gif',
      });
    } catch (erro) {
      console.error('Não foi possível carregar o avatar:', erro);
    }
  }

  private abrirBanco(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('AromaCafeAvatares', 1);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('avatares')) {
          db.createObjectStore('avatares');
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async salvarNoBanco(perfil: Perfil, arquivo: File) {
    const db = await this.abrirBanco();

    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction('avatares', 'readwrite');
      tx.objectStore('avatares').put(arquivo, perfil);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  }

  private async buscarNoBanco(perfil: Perfil): Promise<Blob | null> {
    const db = await this.abrirBanco();

    return new Promise((resolve, reject) => {
      const tx = db.transaction('avatares', 'readonly');
      const request = tx.objectStore('avatares').get(perfil);

      request.onsuccess = () => {
        db.close();
        resolve(request.result ?? null);
      };
      request.onerror = () => {
        db.close();
        reject(request.error);
      };
    });
  }

  private async removerArquivoSalvo(perfil: Perfil) {
    if (!isPlatformBrowser(this.platformId)) return;

    const db = await this.abrirBanco();

    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction('avatares', 'readwrite');
      tx.objectStore('avatares').delete(perfil);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  }

  private ler(perfil: Perfil, padrao: string) {
    if (!isPlatformBrowser(this.platformId)) return padrao;

    try {
      return localStorage.getItem('av-' + perfil) ?? padrao;
    } catch {
      return padrao;
    }
  }
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly mensagem = signal('');
  readonly visivel = signal(false);
  private t?: ReturnType<typeof setTimeout>;

  show(texto: string) {
    this.mensagem.set(texto);
    this.visivel.set(true);
    clearTimeout(this.t);
    this.t = setTimeout(() => this.visivel.set(false), 1800);
  }
}
