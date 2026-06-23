import { BaseService } from "../base-service";
import {
  ApiResponse,
  NotificationSubscriptionRequest,
  NotificationSubscription,
  NotificationTestRequest,
  NotificationSendRequest,
  NotificationSendResponse,
  UserNotificationSubscription,
} from "../types";

/**
 * NotificationService — email-only in v1.
 *
 * The backend dropped push notifications (Pusher Beams, Webpushr, Firebase)
 * and the per-device subscription registry. The remaining surface is
 * email delivery via Resend, branded per project. We keep the class
 * signatures of the push methods for backwards compatibility but they
 * now throw a clear error so callers can find them quickly. Use
 * `sendTestNotification` and `sendToAllUserSubscribers` to deliver email.
 */
export class NotificationService extends BaseService {
  /** @deprecated Push notifications are removed in v1. No-op (throws). */
  async registerSubscription(
    _request: NotificationSubscriptionRequest
  ): Promise<ApiResponse<{ subscription: NotificationSubscription }>> {
    throw new Error(
      "registerSubscription was removed in v1 — push notifications are no longer supported. Email is delivered automatically to the user's recorded email."
    );
  }

  /** @deprecated Push notifications are removed in v1. No-op (throws). */
  async unsubscribe(_subscriberId: string): Promise<ApiResponse<void>> {
    throw new Error("unsubscribe was removed in v1 — there are no per-device push subscriptions to remove.");
  }

  /** @deprecated Push notifications are removed in v1. No-op (throws). */
  async getUserSubscriptions(): Promise<
    ApiResponse<{
      subscriptions: UserNotificationSubscription[];
      activeCount: number;
      totalCount: number;
    }>
  > {
    throw new Error("getUserSubscriptions was removed in v1 — there are no per-device push subscriptions to list.");
  }

  /** @deprecated Push notifications are removed in v1. No-op (throws). */
  async deleteAllSubscriptions(): Promise<ApiResponse<{ deletedCount: number }>> {
    throw new Error("deleteAllSubscriptions was removed in v1 — there are no per-device push subscriptions to delete.");
  }

  /**
   * Send a test email notification to the authenticated user. The legacy
   * `subscriberId` field is ignored (kept on the request shape for source
   * compatibility); delivery is to the user's recorded email.
   */
  async sendTestNotification(
    request: NotificationTestRequest
  ): Promise<ApiResponse<{ requestId: string }>> {
    return this.authenticatedRequest<ApiResponse<{ requestId: string }>>({
      method: "POST",
      url: "/v1/notifications/test",
      data: {
        message: request.message,
        targetUrl: request.targetUrl,
        title: request.title,
      },
    });
  }

  /**
   * Send a notification email to the authenticated user.
   */
  async sendToAllUserSubscribers(
    request: NotificationSendRequest
  ): Promise<ApiResponse<NotificationSendResponse>> {
    return this.authenticatedRequest<ApiResponse<NotificationSendResponse>>({
      method: "POST",
      url: "/v1/notifications/messages",
      data: {
        message: request.message,
        targetUrl: request.targetUrl,
        title: request.title,
      },
    });
  }
}
