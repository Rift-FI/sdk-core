import { BaseService } from "../base-service";
import { io, Socket } from "socket.io-client";
import {
  SocketConfig,
  EventSubscription,
  EventHandler,
  ConnectionStatus,
  TXFailedEvent,
  TXConfirmedEvent,
  AccountCreationSuccessEvent,
} from "../types";

export class EventService extends BaseService {
  private socket: Socket | null = null;
  private subscriptions: Map<string, EventSubscription> = new Map();
  private connectionStatus: ConnectionStatus = {
    connected: false,
    connecting: false,
    disconnected: true,
  };
  private config: SocketConfig = {};
  private reconnectAttempts = 0;

  connect(config: SocketConfig = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      this.config = {
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 10000,
        timeout: 20000,
        transports: ["websocket", "polling"],
        ...config,
      };

      const socketUrl = this.getDefaultSocketUrl();

      this.connectionStatus.connecting = true;
      this.connectionStatus.disconnected = false;

      // Create socket connection
      this.socket = io(socketUrl, {
        autoConnect: this.config.autoConnect,
        reconnection: this.config.reconnection,
        reconnectionAttempts: this.config.reconnectionAttempts,
        reconnectionDelay: this.config.reconnectionDelay,
        reconnectionDelayMax: this.config.reconnectionDelayMax,
        timeout: this.config.timeout,
        transports: this.config.transports as any,
        auth: {
          token: this.getBearerToken(),
        },
      });

      this.setupConnectionHandlers(resolve, reject);

      if (!this.config.autoConnect) {
        this.socket.connect();
      }
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.connectionStatus = {
      connected: false,
      connecting: false,
      disconnected: true,
    };
  }

  subscribe<T = any>(eventName: string, handler: EventHandler<T>): string {
    if (!this.socket) {
      throw new Error("Socket not connected. Call connect() first.");
    }

    const subscriptionId = this.generateSubscriptionId();
    const subscription: EventSubscription = {
      eventName,
      handler,
      id: subscriptionId,
    };

    this.subscriptions.set(subscriptionId, subscription);

    // Register the handler with socket.io
    this.socket.on(eventName, async (data: T) => {
      try {
        await handler(data);
      } catch (error) {
        console.error(`Error in event handler for ${eventName}:`, error);
      }
    });

    return subscriptionId;
  }

  unsubscribe(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      return false;
    }

    if (this.socket) {
      this.socket.off(subscription.eventName, subscription.handler);
    }

    this.subscriptions.delete(subscriptionId);
    return true;
  }

  unsubscribeAll(eventName: string): number {
    let count = 0;
    const toRemove: string[] = [];

    this.subscriptions.forEach((subscription, id) => {
      if (subscription.eventName === eventName) {
        toRemove.push(id);
        count++;
      }
    });

    toRemove.forEach((id) => this.unsubscribe(id));
    return count;
  }

  emit(eventName: string, data?: any): void {
    if (!this.socket?.connected) {
      throw new Error("Socket not connected");
    }
    this.socket.emit(eventName, data);
  }

  getConnectionStatus(): ConnectionStatus {
    return { ...this.connectionStatus };
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getSubscriptions(): EventSubscription[] {
    return Array.from(this.subscriptions.values());
  }

  onTXFailed(handler: EventHandler<TXFailedEvent>): string {
    return this.subscribe("TXFailed", handler);
  }

  onTXConfirmed(handler: EventHandler<TXConfirmedEvent>): string {
    return this.subscribe("TXConfirmed", handler);
  }

  onAccountCreationSuccess(
    handler: EventHandler<AccountCreationSuccessEvent>
  ): string {
    return this.subscribe("AccountCreationSuccess", handler);
  }

  onConnect(handler: EventHandler<void>): string {
    return this.subscribe("connect", handler);
  }

  onDisconnect(handler: EventHandler<string>): string {
    return this.subscribe("disconnect", handler);
  }

  onError(handler: EventHandler<Error>): string {
    return this.subscribe("connect_error", handler);
  }

  updateAuth(token: string): void {
    this.setBearerToken(token);
    if (this.socket) {
      this.socket.auth = { token };
      if (this.socket.connected) {
        this.socket.disconnect().connect();
      }
    }
  }

  private getDefaultSocketUrl(): string {
    const baseUrl = this.httpClient["baseUrl"] || "http://localhost:8000";
    return baseUrl;
  }

  private setupConnectionHandlers(
    resolve: () => void,
    reject: (error: Error) => void
  ): void {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      this.connectionStatus = {
        connected: true,
        connecting: false,
        disconnected: false,
      };
      this.reconnectAttempts = 0;
      console.log("Connected to Sphere Events Socket.IO server");
      resolve();
    });

    this.socket.on("disconnect", (reason: string) => {
      this.connectionStatus = {
        connected: false,
        connecting: false,
        disconnected: true,
        error: reason,
      };
      console.log("Disconnected from Sphere Events server:", reason);
    });

    this.socket.on("connect_error", (error: Error) => {
      this.connectionStatus = {
        connected: false,
        connecting: false,
        disconnected: true,
        error: error.message,
      };
      console.error("Connection error:", error.message);

      if (this.reconnectAttempts === 0) {
        reject(error);
      }
    });

    this.socket.on("reconnect_attempt", (attempt: number) => {
      this.reconnectAttempts = attempt;
      this.connectionStatus.connecting = true;
      console.log(`Reconnection attempt ${attempt}`);
    });

    this.socket.on("reconnect", (attempts: number) => {
      this.connectionStatus = {
        connected: true,
        connecting: false,
        disconnected: false,
      };
      console.log(`Reconnected after ${attempts} attempts`);
    });

    this.socket.on("reconnect_error", (error: Error) => {
      console.error("Reconnection error:", error.message);
    });

    this.socket.on("reconnect_failed", () => {
      this.connectionStatus = {
        connected: false,
        connecting: false,
        disconnected: true,
        error: "Reconnection failed after maximum attempts",
      };
      console.error("Reconnection failed after maximum attempts");
    });
  }

  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
