import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, ChatMessage } from '../../service/chat.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})
export class ChatComponent {
  private chatService = inject(ChatService);

  isOpen = false;
  messages: ChatMessage[] = [];
  private history: ChatMessage[] = [];
  inputMessage = '';
  isLoading = false;

  toggleChat(): void {
    this.isOpen = !this.isOpen;
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  sendMessage(): void {
    const text = this.inputMessage.trim();
    if (!text || this.isLoading) return;

    this.messages.push({ role: 'user', content: text });
    const currentHistory = [...this.history];
    this.inputMessage = '';
    this.isLoading = true;

    this.chatService.send(text, currentHistory).subscribe({
      next: (res) => {
        this.messages.push({ role: 'assistant', content: res.reply });
        this.history.push({ role: 'user', content: text });
        this.history.push({ role: 'assistant', content: res.reply });
        this.isLoading = false;
      },
      error: () => {
        this.messages.push({ role: 'assistant', content: 'Sorry, something went wrong. Please try again.' });
        this.isLoading = false;
      }
    });
  }
}
