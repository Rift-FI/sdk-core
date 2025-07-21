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

export class NotificationService extends BaseService {
  /**
   * Register or update a notification subscription for the current user
   */
  async registerSubscription(
    request: NotificationSubscriptionRequest
  ): Promise<ApiResponse<{ subscription: NotificationSubscription }>> {
    return this.authenticatedRequest<
      ApiResponse<{ subscription: NotificationSubscription }>
    >({
      method: "POST",
      url: "/notifications/register",
      data: {
        subscriberId: request.subscriberId,
        deviceInfo: request.deviceInfo,
        platform: request.platform,
      },
    });
  }

  /**
   * Unsubscribe from notifications
   */
  async unsubscribe(subscriberId: string): Promise<ApiResponse<void>> {
    return this.authenticatedRequest<ApiResponse<void>>({
      method: "POST",
      url: "/notifications/unsubscribe",
      data: { subscriberId },
    });
  }

  /**
   * Get all notification subscriptions for the current user
   */
  async getUserSubscriptions(): Promise<
    ApiResponse<{
      subscriptions: UserNotificationSubscription[];
      activeCount: number;
      totalCount: number;
    }>
  > {
    return this.authenticatedRequest<
      ApiResponse<{
        subscriptions: UserNotificationSubscription[];
        activeCount: number;
        totalCount: number;
      }>
    >({
      method: "GET",
      url: "/notifications/subscriptions",
    });
  }

  /**
   * Send a test notification to a specific subscriber
   */
  async sendTestNotification(
    request: NotificationTestRequest
  ): Promise<ApiResponse<{ requestId: string }>> {
    return this.authenticatedRequest<ApiResponse<{ requestId: string }>>({
      method: "POST",
      url: "/notifications/test",
      data: {
        subscriberId: request.subscriberId,
        message: request.message,
        targetUrl: request.targetUrl,
        title: request.title,
      },
    });
  }

  /**
   * Send notification to all subscribers of the current user
   */
  async sendToAllUserSubscribers(
    request: NotificationSendRequest
  ): Promise<ApiResponse<NotificationSendResponse>> {
    return this.authenticatedRequest<ApiResponse<NotificationSendResponse>>({
      method: "POST",
      url: "/notifications/send",
      data: {
        message: request.message,
        targetUrl: request.targetUrl,
        title: request.title,
      },
    });
  }

  /**
   * Delete all notification subscriptions for the current user
   */
  async deleteAllSubscriptions(): Promise<
    ApiResponse<{ deletedCount: number }>
  > {
    return this.authenticatedRequest<ApiResponse<{ deletedCount: number }>>({
      method: "DELETE",
      url: "/notifications/subscriptions",
    });
  }
}
