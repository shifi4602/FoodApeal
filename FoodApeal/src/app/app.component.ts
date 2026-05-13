import { Component, AfterViewInit, OnDestroy, HostListener } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from "./components/header/header.component";


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements AfterViewInit, OnDestroy {
  title = 'FoodApeal';
  private resizeObserver?: ResizeObserver;

  ngAfterViewInit() {
    const header = document.querySelector('.header-container') as HTMLElement;
    if (header) {
      this.resizeObserver = new ResizeObserver(() => this.setHeaderHeight(header));
      this.resizeObserver.observe(header);
    }
  }

  ngOnDestroy() {
    this.resizeObserver?.disconnect();
  }

  @HostListener('window:resize')
  onResize() {
    const header = document.querySelector('.header-container') as HTMLElement;
    if (header) this.setHeaderHeight(header);
  }

  private setHeaderHeight(header: HTMLElement) {
    const h = header.getBoundingClientRect().height;
    document.documentElement.style.setProperty('--header-height', `${h}px`);
  }
}
