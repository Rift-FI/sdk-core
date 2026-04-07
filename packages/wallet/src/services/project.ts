import { BaseService } from "../base-service";
import {
  CreateProjectRequest,
  CreateProjectResponse,
  GetProjectsRequest,
  GetProjectsResponse,
  GetMyProjectsRequest,
  GetMyProjectsResponse,
  GetProjectResponse,
  ProjectStatsResponse,
  RegenerateKeyResponse,
  AddOriginRequest,
  AddOriginResponse,
  UpdatePaymentWidgetRequest,
  UpdatePaymentWidgetResponse,
  ApiResponse,
} from "../types";

export class ProjectService extends BaseService {
  async create(request: CreateProjectRequest): Promise<CreateProjectResponse> {
    return this.publicRequest<CreateProjectResponse>({
      method: "POST",
      url: "/project/create",
      data: request,
    });
  }

  async getAll(request?: GetProjectsRequest): Promise<GetProjectsResponse> {
    return this.publicRequest<GetProjectsResponse>({
      method: "GET",
      url: "/project/all",
      params: request,
    });
  }

  async getMyProjects(request: GetMyProjectsRequest): Promise<GetMyProjectsResponse> {
    return this.publicRequest<GetMyProjectsResponse>({
      method: "POST",
      url: "/project/my-projects",
      data: request,
    });
  }

  async getById(id: string): Promise<GetProjectResponse> {
    return this.publicRequest<GetProjectResponse>({
      method: "GET",
      url: `/project/${id}`,
    });
  }

  async getStats(id: string): Promise<ProjectStatsResponse> {
    return this.publicRequest<ProjectStatsResponse>({
      method: "GET",
      url: `/project/${id}/stats`,
    });
  }

  async regenerateKey(id: string): Promise<RegenerateKeyResponse> {
    return this.publicRequest<RegenerateKeyResponse>({
      method: "POST",
      url: `/project/${id}/regenerate-key`,
    });
  }

  async delete(id: string): Promise<ApiResponse> {
    return this.publicRequest<ApiResponse>({
      method: "DELETE",
      url: `/project/${id}`,
    });
  }

  async addOrigin(projectId: string, request: AddOriginRequest): Promise<AddOriginResponse> {
    return this.publicRequest<AddOriginResponse>({
      method: "POST",
      url: `/project/${projectId}/origins`,
      data: request,
    });
  }

  async updatePaymentWidget(request: UpdatePaymentWidgetRequest): Promise<UpdatePaymentWidgetResponse> {
    return this.publicRequest<UpdatePaymentWidgetResponse>({
      method: "POST",
      url: "/project/update-payment-link-widget",
      data: request,
    });
  }
}
