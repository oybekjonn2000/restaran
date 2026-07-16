import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../core/services/order.service';
import { AuthService } from '../../../core/services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { API_BASE } from '../../../core/config';

@Component({
  selector: 'app-admin-support',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-support-container">
      <!-- Sidebar / Ticket list -->
      <div class="support-sidebar">
        <div class="sidebar-header">
          <h2>💬 Qo'llab-quvvatlash</h2>
          
          <!-- Tabs for type (Customer / Courier) -->
          <div class="support-tabs">
            <button 
              class="tab-btn" 
              [class.active]="selectedType() === 'customer'"
              (click)="setType('customer')">
              👥 Mijozlar
            </button>
            <button 
              class="tab-btn" 
              [class.active]="selectedType() === 'courier'"
              (click)="setType('courier')">
              🏍️ Kuryerlar
            </button>
          </div>

          <!-- Status Filters -->
          <div class="filter-row">
            <select class="status-select" [(ngModel)]="selectedStatus" (change)="loadTickets()">
              <option value="open">Ochiq</option>
              <option value="in_progress">Jarayonda</option>
              <option value="closed">Yopilgan</option>
              <option value="">Barchasi</option>
            </select>
            <input 
              type="text" 
              class="search-input" 
              [(ngModel)]="searchQuery" 
              (input)="loadTickets()" 
              placeholder="Qidiruv..." />
          </div>
        </div>

        <!-- Ticket list -->
        <div class="ticket-list">
          @if (isTicketsLoading()) {
            <div class="sidebar-info-state">
              <div class="spinner-css-small"></div>
              <span>Yuklanmoqda...</span>
            </div>
          } @else {
            @if (tickets().length === 0) {
              <div class="sidebar-info-state">
                <span>Mavjud emas</span>
              </div>
            } @else {
              @for (ticket of tickets(); track ticket.id) {
                <div 
                  class="ticket-card animate-fade" 
                  [class.active]="activeTicket()?.id === ticket.id"
                  (click)="selectTicket(ticket)">
                  <div class="ticket-card-header">
                    <span class="user-name">{{ ticket.user?.name || 'Noma\\'lum' }}</span>
                    <span class="ticket-time">{{ ticket.updatedAt | date:'dd-MMM, HH:mm' }}</span>
                  </div>
                  <div class="ticket-card-body">
                    <span class="user-phone">📞 {{ ticket.user?.phone || ticket.user?.email }}</span>
                    @if (ticket.status === 'open') {
                      <span class="badge status-open">Yangi</span>
                    } @else if (ticket.status === 'in_progress') {
                      <span class="badge status-progress">Jarayonda</span>
                    } @else {
                      <span class="badge status-closed">Yopilgan</span>
                    }
                  </div>
                  <div class="ticket-card-footer">
                    <span class="assigned-admin">
                      👤 {{ ticket.admin ? 'Biriktirilgan: ' + ticket.admin.name : 'Biriktirilmagan' }}
                    </span>
                  </div>
                </div>
              }
            }
          }
        </div>
      </div>

      <!-- Chat panel -->
      <div class="support-chat-panel">
        @if (!activeTicket()) {
          <div class="no-chat-selected">
            <span class="chat-placeholder-icon">💬</span>
            <h3>Muloqotni boshlash uchun ticket tanlang</h3>
            <p>Mijoz va kuryerlardan kelgan murojaatlar chap tomondagi ro'yxatda ko'rinadi.</p>
          </div>
        } @else {
          <!-- Chat panel header -->
          <div class="chat-panel-header">
            <div class="chat-user-details">
              <h3>{{ activeTicket()?.user?.name }}</h3>
              <p>📞 {{ activeTicket()?.user?.phone || activeTicket()?.user?.email }} | Rol: <b>{{ activeTicket()?.type | uppercase }}</b></p>
            </div>

            <div class="chat-controls">
              <!-- Assign to me button -->
              @if (!activeTicket()?.admin || activeTicket()?.admin?.id !== auth.user()?.id) {
                <button class="btn-control btn-assign" (click)="assignToMe()">
                  👤 Menga biriktirish
                </button>
              } @else {
                <span class="assigned-label">✅ Sizga biriktirilgan</span>
              }

              <!-- Status toggle dropdown -->
              <select 
                class="control-select" 
                [ngModel]="activeTicket()?.status" 
                (ngModelChange)="changeTicketStatus($event)">
                <option value="open">Yangi (Open)</option>
                <option value="in_progress">Jarayonda (In Progress)</option>
                <option value="closed">Yopilgan (Closed)</option>
              </select>
            </div>
          </div>

          <!-- Chat history -->
          <div class="chat-history-container" id="admin-chat-history">
            @if (isMessagesLoading()) {
              <div class="chat-loading">
                <div class="spinner-css"></div>
                <p>Xabarlar yuklanmoqda...</p>
              </div>
            } @else {
              @for (msg of messages(); track msg.id) {
                <div 
                  class="chat-msg-row" 
                  [class.msg-sent]="msg.senderType === 'admin'" 
                  [class.msg-received]="msg.senderType !== 'admin'">
                  <div class="message-bubble">
                    <span class="sender-name-label">
                      {{ msg.senderType === 'admin' ? 'Admin: ' + msg.sender.name : msg.sender.name }}
                    </span>
                    @if (msg.message) {
                      <p class="message-text">{{ msg.message }}</p>
                    }
                    @if (msg.attachment) {
                      <div class="message-attachment">
                        @if (isImage(msg.attachment)) {
                          <img [src]="getAttachmentUrl(msg.attachment)" class="chat-image" (click)="openAttachment(getAttachmentUrl(msg.attachment))" style="cursor: pointer;" alt="Rasm" />
                        } @else {
                          <a [href]="getAttachmentUrl(msg.attachment)" target="_blank" class="chat-file-link">
                            📂 Faylni ko'rish / yuklab olish
                          </a>
                        }
                      </div>
                    }
                    <div class="message-footer">
                      <span class="message-time">{{ msg.createdAt | date:'HH:mm' }}</span>
                      @if (msg.senderType === 'admin') {
                        <span class="seen-status">
                          {{ msg.seen ? '✓✓ o\\'qildi' : '✓ yuborildi' }}
                        </span>
                      }
                    </div>
                  </div>
                </div>
              }
            }
          </div>

          <!-- Attachment preview -->
          @if (attachmentName()) {
            <div class="attachment-preview animate-fade">
              <span class="attach-info">📎 {{ attachmentName() }}</span>
              @if (isUploadingAttachment()) {
                <span class="attach-uploading">(yuklanmoqda...)</span>
              }
              <button class="btn-clear-attachment" (click)="clearAttachment()">✕</button>
            </div>
          }

          <!-- Chat Input -->
          <div class="chat-panel-input">
            <label class="btn-attach" title="Rasm yoki fayl yuklash">
              📎
              <input type="file" accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" (change)="onFileSelected($event)" style="display: none;" />
            </label>
            <input 
              type="text" 
              class="chat-input" 
              [(ngModel)]="messageInput"
              (keyup.enter)="sendMessage()"
              placeholder="Xabar yozing..."
              [disabled]="isMessagesLoading() || isUploadingAttachment()" />
            <button 
              class="btn-send" 
              (click)="sendMessage()"
              [disabled]="(!messageInput.trim() && !attachmentUrl()) || isMessagesLoading() || isUploadingAttachment()">
              ➔
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .admin-support-container {
      display: flex;
      height: calc(100vh - 120px);
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 20px;
      overflow: hidden;
      font-family: 'Poppins', sans-serif;
    }

    /* SIDEBAR */
    .support-sidebar {
      width: 320px;
      border-right: 1px solid #334155;
      display: flex;
      flex-direction: column;
      background: #1e293b;
    }
    .sidebar-header {
      padding: 16px;
      border-bottom: 1px solid #334155;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .sidebar-header h2 {
      font-size: 1.15rem;
      font-weight: 700;
      color: #fff;
      margin: 0;
    }
    .support-tabs {
      display: flex;
      background: #0f172a;
      border-radius: 10px;
      padding: 3px;
    }
    .tab-btn {
      flex: 1;
      background: none;
      border: none;
      color: #94a3b8;
      padding: 6px 10px;
      font-size: 0.8rem;
      font-weight: 600;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .tab-btn.active {
      background: #f97316;
      color: #fff;
    }
    .filter-row {
      display: flex;
      gap: 8px;
    }
    .status-select {
      background: #0f172a;
      border: 1px solid #334155;
      color: #cbd5e1;
      border-radius: 8px;
      padding: 6px 10px;
      font-size: 0.8rem;
      outline: none;
    }
    .search-input {
      flex: 1;
      background: #0f172a;
      border: 1px solid #334155;
      color: #fff;
      border-radius: 8px;
      padding: 6px 12px;
      font-size: 0.8rem;
      outline: none;
    }
    .search-input:focus {
      border-color: #f97316;
    }
    .ticket-list {
      flex: 1;
      overflow-y: auto;
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .sidebar-info-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 10px;
      color: #94a3b8;
      font-size: 0.85rem;
      gap: 10px;
    }
    .spinner-css-small {
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255, 255, 255, 0.1);
      border-radius: 50%;
      border-top-color: #f97316;
      animation: spin 0.8s linear infinite;
    }
    .ticket-card {
      padding: 12px;
      background: #334155;
      border: 1px solid #475569;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .ticket-card:hover {
      background: #475569;
      border-color: #f97316;
    }
    .ticket-card.active {
      background: rgba(249, 115, 22, 0.1);
      border-color: #f97316;
    }
    .ticket-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }
    .user-name {
      font-weight: 700;
      color: #fff;
      font-size: 0.88rem;
    }
    .ticket-time {
      font-size: 0.72rem;
      color: #cbd5e1;
    }
    .ticket-card-body {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }
    .user-phone {
      font-size: 0.78rem;
      color: #cbd5e1;
    }
    .badge {
      font-size: 0.68rem;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 10px;
    }
    .status-open {
      background: rgba(249, 115, 22, 0.15);
      color: #f97316;
      border: 1px solid rgba(249, 115, 22, 0.3);
    }
    .status-progress {
      background: rgba(59, 130, 246, 0.15);
      color: #3b82f6;
      border: 1px solid rgba(59, 130, 246, 0.3);
    }
    .status-closed {
      background: rgba(239, 68, 68, 0.15);
      color: #ef4444;
      border: 1px solid rgba(239, 68, 68, 0.3);
    }
    .ticket-card-footer {
      font-size: 0.72rem;
      color: #94a3b8;
    }

    /* CHAT PANEL */
    .support-chat-panel {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: #0f172a;
    }
    .no-chat-selected {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #94a3b8;
      text-align: center;
      padding: 40px;
    }
    .chat-placeholder-icon {
      font-size: 4rem;
      margin-bottom: 16px;
    }
    .no-chat-selected h3 {
      color: #fff;
      font-size: 1.25rem;
      margin: 0 0 8px 0;
    }
    .no-chat-selected p {
      font-size: 0.85rem;
      max-width: 320px;
      line-height: 1.5;
    }
    .chat-panel-header {
      padding: 16px 20px;
      background: #1e293b;
      border-bottom: 1px solid #334155;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .chat-user-details h3 {
      margin: 0 0 4px 0;
      color: #fff;
      font-size: 1.05rem;
    }
    .chat-user-details p {
      margin: 0;
      font-size: 0.78rem;
      color: #94a3b8;
    }
    .chat-controls {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .btn-control {
      background: #f97316;
      color: #fff;
      border: none;
      border-radius: 8px;
      padding: 6px 12px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }
    .btn-control:hover {
      background: #ea580c;
    }
    .assigned-label {
      font-size: 0.8rem;
      color: #10b981;
      font-weight: 600;
    }
    .control-select {
      background: #0f172a;
      border: 1px solid #334155;
      color: #fff;
      border-radius: 8px;
      padding: 6px 12px;
      font-size: 0.8rem;
      outline: none;
    }
    .chat-history-container {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .chat-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #94a3b8;
    }
    .spinner-css {
      width: 32px;
      height: 32px;
      border: 3px solid rgba(255, 255, 255, 0.1);
      border-radius: 50%;
      border-top-color: #f97316;
      animation: spin 0.8s linear infinite;
      margin-bottom: 12px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .chat-msg-row {
      display: flex;
      width: 100%;
    }
    .chat-msg-row.msg-sent {
      justify-content: flex-end;
    }
    .chat-msg-row.msg-received {
      justify-content: flex-start;
    }
    .message-bubble {
      max-width: 75%;
      padding: 10px 14px;
      border-radius: 16px;
      position: relative;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      line-height: 1.45;
    }
    .msg-sent .message-bubble {
      background: #f97316;
      color: #fff;
      border-bottom-right-radius: 4px;
    }
    .msg-received .message-bubble {
      background: #334155;
      color: #cbd5e1;
      border-bottom-left-radius: 4px;
      border: 1px solid #475569;
    }
    .sender-name-label {
      display: block;
      font-size: 0.68rem;
      font-weight: 700;
      margin-bottom: 4px;
      opacity: 0.85;
    }
    .message-text {
      font-size: 0.9rem;
      margin: 0;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .message-attachment {
      margin-top: 6px;
      border-radius: 8px;
      overflow: hidden;
    }
    .chat-image {
      max-width: 100%;
      max-height: 200px;
      object-fit: cover;
      display: block;
      border-radius: 8px;
    }
    .chat-file-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      background: rgba(255, 255, 255, 0.08);
      color: #60a5fa;
      text-decoration: none;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 600;
    }
    .message-footer {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 6px;
      margin-top: 4px;
      font-size: 0.65rem;
      opacity: 0.8;
    }
    .seen-status {
      font-weight: 600;
    }
    .attachment-preview {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 16px;
      background: #1e293b;
      border-top: 1px solid #334155;
    }
    .attach-info {
      font-size: 0.85rem;
      color: #cbd5e1;
      max-width: 240px;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
    }
    .attach-uploading {
      font-size: 0.72rem;
      color: #94a3b8;
      font-style: italic;
      margin-left: 6px;
    }
    .btn-clear-attachment {
      background: none;
      border: none;
      color: #ef4444;
      font-size: 1.1rem;
      cursor: pointer;
    }
    .chat-panel-input {
      display: flex;
      align-items: center;
      padding: 14px 20px;
      background: #1e293b;
      border-top: 1px solid #334155;
      gap: 12px;
    }
    .btn-attach {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #334155;
      border: 1px solid #475569;
      color: #cbd5e1;
      font-size: 1.2rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-attach:hover {
      background: #475569;
      color: #fff;
    }
    .chat-input {
      flex: 1;
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 20px;
      padding: 10px 16px;
      color: #fff;
      font-size: 0.9rem;
      outline: none;
    }
    .chat-input:focus {
      border-color: #f97316;
    }
    .btn-send {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #f97316;
      border: none;
      color: #fff;
      font-size: 1.1rem;
      cursor: pointer;
      transition: background 0.2s;
    }
    .btn-send:disabled {
      background: #334155;
      color: #64748b;
      cursor: not-allowed;
    }

    .animate-fade {
      animation: fadeIn 0.2s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class AdminSupportComponent implements OnInit, OnDestroy {
  selectedType = signal<'customer' | 'courier'>('customer');
  selectedStatus = 'open';
  searchQuery = '';

  tickets = signal<any[]>([]);
  activeTicket = signal<any>(null);
  messages = signal<any[]>([]);

  isTicketsLoading = signal(false);
  isMessagesLoading = signal(false);

  messageInput = '';
  attachmentUrl = signal<string | null>(null);
  attachmentName = signal<string | null>(null);
  isUploadingAttachment = signal<boolean>(false);

  private listPollInterval: any = null;
  private messagePollInterval: any = null;

  constructor(
    public auth: AuthService,
    private orderService: OrderService,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadTickets(true);
    // Poll ticket list every 5 seconds
    this.listPollInterval = setInterval(() => {
      this.loadTickets(false);
    }, 5000);
  }

  ngOnDestroy(): void {
    if (this.listPollInterval) clearInterval(this.listPollInterval);
    this.stopMessagePolling();
  }

  setType(type: 'customer' | 'courier'): void {
    this.selectedType.set(type);
    this.activeTicket.set(null);
    this.messages.set([]);
    this.stopMessagePolling();
    this.loadTickets(true);
  }

  loadTickets(showSpinner = false): void {
    if (showSpinner) this.isTicketsLoading.set(true);
    
    this.orderService.adminGetTickets(this.selectedType(), this.selectedStatus || undefined, this.searchQuery).subscribe({
      next: (data) => {
        this.isTicketsLoading.set(false);
        this.tickets.set(data);
      },
      error: () => this.isTicketsLoading.set(false)
    });
  }

  selectTicket(ticket: any): void {
    this.activeTicket.set(ticket);
    this.isMessagesLoading.set(true);
    this.messageInput = '';
    this.clearAttachment();
    
    this.loadMessages(ticket.id);
    this.startMessagePolling(ticket.id);
  }

  loadMessages(ticketId: number): void {
    this.orderService.getTicketMessages(ticketId).subscribe({
      next: (msgs) => {
        this.isMessagesLoading.set(false);
        this.messages.set(msgs);
        // Mark all user messages as seen by admin
        this.orderService.markMessagesAsSeen(ticketId).subscribe();
        setTimeout(() => this.scrollToBottom(), 100);
      },
      error: () => this.isMessagesLoading.set(false)
    });
  }

  startMessagePolling(ticketId: number): void {
    this.stopMessagePolling();
    this.messagePollInterval = setInterval(() => {
      this.orderService.getTicketMessages(ticketId).subscribe({
        next: (msgs) => {
          if (msgs.length !== this.messages().length || JSON.stringify(msgs) !== JSON.stringify(this.messages())) {
            this.messages.set(msgs);
            this.orderService.markMessagesAsSeen(ticketId).subscribe();
            setTimeout(() => this.scrollToBottom(), 100);
          }
        }
      });
    }, 2000);
  }

  stopMessagePolling(): void {
    if (this.messagePollInterval) {
      clearInterval(this.messagePollInterval);
      this.messagePollInterval = null;
    }
  }

  assignToMe(): void {
    const ticket = this.activeTicket();
    const adminId = this.auth.user()?.id;
    if (!ticket || !adminId) return;

    this.orderService.adminAssignTicket(ticket.id, adminId).subscribe({
      next: (updatedTicket) => {
        this.activeTicket.set(updatedTicket);
        this.snack.open('✅ Ticket sizga biriktirildi', '', { duration: 2500 });
        this.loadTickets(false);
      },
      error: () => this.snack.open('❌ Biriktirishda xatolik', '', { duration: 3000 })
    });
  }

  changeTicketStatus(status: string): void {
    const ticket = this.activeTicket();
    if (!ticket) return;

    this.orderService.adminUpdateTicketStatus(ticket.id, status).subscribe({
      next: (updatedTicket) => {
        this.activeTicket.set(updatedTicket);
        this.snack.open(`✅ Holat o'zgardi: ${status}`, '', { duration: 2500 });
        this.loadTickets(false);
      },
      error: () => this.snack.open("❌ Holatni o'zgartirib bo'lmadi", '', { duration: 3000 })
    });
  }

  sendMessage(): void {
    const text = this.messageInput.trim();
    const attach = this.attachmentUrl();
    const ticket = this.activeTicket();
    if (!ticket || (!text && !attach)) return;

    this.orderService.sendSupportMessage(ticket.id, text, attach).subscribe({
      next: (newMsg) => {
        this.messageInput = '';
        this.clearAttachment();
        
        const current = this.messages();
        this.messages.set([...current, newMsg]);
        setTimeout(() => this.scrollToBottom(), 100);
        this.loadTickets(false);
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate type
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const allowedExts = ['jpg', 'jpeg', 'png', 'webp', 'pdf', 'doc', 'docx'];

    if (!allowedTypes.includes(file.type) && !allowedExts.includes(fileExt || '')) {
      this.snack.open('❌ Noto\'g\'ri fayl formati! JPG, PNG, WEBP, PDF, DOCX ruxsat etiladi.', '', { duration: 3000 });
      return;
    }

    // Validate size (10 MB)
    if (file.size > 10 * 1024 * 1024) {
      this.snack.open('❌ Fayl hajmi 10 MB dan oshmasligi kerak!', '', { duration: 3000 });
      return;
    }

    this.attachmentName.set(file.name);
    this.attachmentUrl.set(null);
    this.isUploadingAttachment.set(true);

    this.orderService.uploadImage(file).subscribe({
      next: (res) => {
        this.attachmentUrl.set(res.url);
        this.isUploadingAttachment.set(false);
      },
      error: () => {
        this.snack.open('❌ Fayl yuklashda xatolik yuz berdi', '', { duration: 3000 });
        this.attachmentName.set(null);
        this.isUploadingAttachment.set(false);
      }
    });
  }

  clearAttachment(): void {
    this.attachmentUrl.set(null);
    this.attachmentName.set(null);
  }

  openAttachment(url: string): void {
    window.open(url, '_blank');
  }

  isImage(url: string): boolean {
    if (!url) return false;
    const lower = url.toLowerCase();
    return lower.endsWith('.jpg') || 
           lower.endsWith('.jpeg') || 
           lower.endsWith('.png') || 
           lower.endsWith('.webp') || 
           lower.endsWith('.gif') || 
           lower.endsWith('.svg') || 
           lower.startsWith('data:image/');
  }

  getAttachmentUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    return `${API_BASE}${url}`;
  }

  scrollToBottom(): void {
    const container = document.getElementById('admin-chat-history');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }
}
