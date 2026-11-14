import { Component, computed, inject, input } from '@angular/core';
import { AvatarService, Perfil } from './services';

// Mostra o avatar atual do perfil: PNG/GIF (img) ou MP4 (video).
@Component({
  selector: 'app-avatar-view',
  standalone: true,
  host: { style: 'display: contents' },
  template: `
    <div class="av">
      @if (av.customizado[perfil()](); as personalizado) {
        @if (personalizado.tipo === 'mp4') {
          <video
            [src]="personalizado.url"
            autoplay
            muted
            loop
            playsinline
            aria-label="Avatar em vídeo"
          ></video>
        } @else {
          <img [src]="personalizado.url" alt="" aria-hidden="true" />
        }
      } @else {
        <img [src]="src()" alt="" aria-hidden="true" />
      }
    </div>
  `,
})
export class AvatarViewComponent {
  perfil = input.required<Perfil>();
  av = inject(AvatarService);
  src = computed(() => this.av.src(this.av.escolhido[this.perfil()]()));
}
