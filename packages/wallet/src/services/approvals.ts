import { BaseService } from "../base-service";
import {
  Approval,
  ApproveApprovalRequest,
  ListApprovalsRequest,
  PasskeyAuthProof,
  TwoPhasePreview,
} from "../types";

/**
 * Approval requests (`/v1/approvals`).
 *
 * Any fund-moving call made without a passkey proof (server-side SDK,
 * wrapper, MCP agents, auto-swap) creates one and returns HTTP 202 with an
 * `approvalUrl`. The user opens it (or your own UI uses `preview` +
 * `approve`) and approves with a passkey. TTL 30 minutes, single use.
 *
 * `get` works with the creating project's API key alone, so a server can
 * poll the outcome. Everything else needs the user's JWT.
 */
export class ApprovalsService extends BaseService {
  /** Status + result (`transactionHash` / `userOpHash` once approved). */
  async get(id: string): Promise<Approval> {
    return this.authenticatedRequest<Approval>({
      method: "GET",
      url: `/v1/approvals/${encodeURIComponent(id)}`,
    });
  }

  /** The user's approvals, e.g. `{ status: "pending" }` for an inbox. */
  async list(request: ListApprovalsRequest = {}): Promise<Approval[]> {
    return this.authenticatedRequest<Approval[]>({
      method: "GET",
      url: "/v1/approvals",
      params: request,
    });
  }

  /** Fresh ticket + `hashToSign`, built server-side from the stored intent. */
  async preview(id: string): Promise<TwoPhasePreview> {
    return this.authenticatedRequest<TwoPhasePreview>({
      method: "POST",
      url: `/v1/approvals/${encodeURIComponent(id)}/preview`,
      retries: 0,
    });
  }

  /** Submit the passkey proof for a previewed approval. Never retried. */
  async approve(id: string, request: ApproveApprovalRequest): Promise<Approval> {
    return this.authenticatedRequest<Approval>({
      method: "POST",
      url: `/v1/approvals/${encodeURIComponent(id)}/approve`,
      data: request,
      retries: 0,
    });
  }

  async reject(id: string): Promise<Approval> {
    return this.authenticatedRequest<Approval>({
      method: "POST",
      url: `/v1/approvals/${encodeURIComponent(id)}/reject`,
      retries: 0,
    });
  }

  /**
   * `preview` → `sign(preview)` → `approve` in one call (browser):
   *
   * ```ts
   * await rift.approvals.approveWithPasskey(approvalId, (p) =>
   *   createPasskeyAuthProof(p.hashToSign, { rpId, allowCredentials: p.allowCredentials }));
   * ```
   */
  async approveWithPasskey(
    id: string,
    sign: (preview: TwoPhasePreview) => Promise<PasskeyAuthProof>
  ): Promise<Approval> {
    const preview = await this.preview(id);
    const authProof = await sign(preview);
    return this.approve(id, { ticketId: preview.ticketId, authProof });
  }
}
