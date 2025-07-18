import { BaseService } from "../base-service";
import {
  ApiResponse,
  ProjectNotificationConfig,
  ProjectNotificationSettings,
  NotificationTestRequest,
} from "../types";

export class ProjectNotificationService extends BaseService {
  /**
   * Configure notification settings for your project
   * Note: Requires project API key authentication
   */
  async configure(
    config: ProjectNotificationConfig
  ): Promise<ApiResponse<{ project: any }>> {
    return this.publicRequest<ApiResponse<{ project: any }>>({
      method: "POST",
      url: "/project/notifications/configure",
      data: {
        webpushrKey: config.webpushrKey,
        webpushrAuthToken: config.webpushrAuthToken,
        enabled: config.enabled,
      },
    });
  }

  /**
   * Get current notification settings for your project
   */
  async getSettings(): Promise<ApiResponse<ProjectNotificationSettings>> {
    return this.publicRequest<ApiResponse<ProjectNotificationSettings>>({
      method: "GET",
      url: "/project/notifications/settings",
    });
  }

  /**
   * Disable notifications for your project
   */
  async disable(): Promise<ApiResponse<void>> {
    return this.publicRequest<ApiResponse<void>>({
      method: "POST",
      url: "/project/notifications/disable",
    });
  }

  /**
   * Remove notification configuration entirely
   */
  async removeConfiguration(): Promise<
    ApiResponse<{ deletedSubscriptions: number }>
  > {
    return this.publicRequest<ApiResponse<{ deletedSubscriptions: number }>>({
      method: "DELETE",
      url: "/project/notifications",
    });
  }

  /**
   * Test notification configuration
   */
  async testConfiguration(
    request: NotificationTestRequest
  ): Promise<ApiResponse<{ requestId: string }>> {
    return this.publicRequest<ApiResponse<{ requestId: string }>>({
      method: "POST",
      url: "/project/notifications/test",
      data: {
        subscriberId: request.subscriberId,
        message: request.message,
        title: request.title,
      },
    });
  }
}
