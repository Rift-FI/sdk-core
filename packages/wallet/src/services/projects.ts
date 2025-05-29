import { BaseService } from "../base-service";
import {
  CreateProjectRequest,
  Project,
  ProjectsResponse,
  ApiResponse,
} from "../types";

export class ProjectsService extends BaseService {
  async create(request: CreateProjectRequest): Promise<ApiResponse<Project>> {
    return this.publicRequest<ApiResponse<Project>>({
      method: "POST",
      url: "/project/create",
      data: request,
    });
  }

  async getAll(
    page: number = 1,
    limit: number = 10
  ): Promise<ApiResponse<ProjectsResponse>> {
    return this.publicRequest<ApiResponse<ProjectsResponse>>({
      method: "GET",
      url: "/project/all",
      params: { page, limit },
    });
  }

  async getById(id: string): Promise<ApiResponse<Project>> {
    return this.publicRequest<ApiResponse<Project>>({
      method: "GET",
      url: `/project/${id}`,
    });
  }

  async delete(id: string): Promise<ApiResponse> {
    return this.publicRequest<ApiResponse>({
      method: "DELETE",
      url: `/project/${id}`,
    });
  }

  async regenerateKey(id: string): Promise<ApiResponse<Project>> {
    return this.publicRequest<ApiResponse<Project>>({
      method: "POST",
      url: `/project/${id}/regenerate-key`,
    });
  }
}
