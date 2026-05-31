import { ChangeDetectorRef, Component, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ChatService, ChatMessage } from '../../service/chat.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})
export class ChatComponent {
  private chatService = inject(ChatService);
  private cdRef = inject(ChangeDetectorRef);

  @ViewChild('messagesContainer') private messagesContainer!: ElementRef<HTMLElement>;
  @ViewChild('scrollAnchor') private scrollAnchor!: ElementRef<HTMLElement>;

  isOpen = false;
  messages: ChatMessage[] = [];
  private history: ChatMessage[] = [];
  inputMessage = '';
  isLoading = false;

  private scrollToBottom(): void {
    // Force Angular to flush pending DOM updates, then scroll the anchor into view.
    // scrollIntoView lets the browser handle scroll-position calculation after layout.
    this.cdRef.detectChanges();
    this.scrollAnchor?.nativeElement?.scrollIntoView({ block: 'nearest' });
  }

  toggleChat(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) this.scrollToBottom();
  }

  clearChat(): void {
    this.messages = [];
    this.history = [];
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }

  sendMessage(): void {
    const text = this.inputMessage.trim();
    if (!text || this.isLoading) return;

    this.messages.push({ role: 'user', content: text });
    const currentHistory = [...this.history];
    this.inputMessage = '';
    this.isLoading = true;
    this.scrollToBottom();

    this.chatService.send(text, currentHistory).subscribe({
      next: (res) => {
        this.messages.push({ role: 'assistant', content: res.reply, products: res.products });
        this.history.push({ role: 'user', content: text });
        this.history.push({ role: 'assistant', content: res.reply });
        this.isLoading = false;
        this.scrollToBottom();
      },
      error: () => {
        this.messages.push({ role: 'assistant', content: 'Sorry, something went wrong. Please try again.' });
        this.isLoading = false;
        this.scrollToBottom();
      }
    });
  }
}
