import http from "http";
import { AddressInfo } from "net";

export interface MockServerResponse {
  success: boolean;
  transactionHash?: string;
  error?: string;
  gasUsed?: string;
  relayerAddress?: string;
}

export class MockTransferServer {
  private server: http.Server;
  private port: number = 0;
  private responses: MockServerResponse[] = [];
  private requestHistory: any[] = [];

  constructor() {
    this.server = http.createServer(this.handleRequest.bind(this));
  }

  private handleRequest(req: http.IncomingMessage, res: http.ServerResponse) {
    // Set CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.writeHead(200);
      res.end();
      return;
    }

    if (req.method === "POST" && req.url === "/api/gas/transfer") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });

      req.on("end", () => {
        try {
          const requestData = JSON.parse(body);
          this.requestHistory.push(requestData);

          // Validate request structure
          if (!requestData.signature || !requestData.transfer) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                success: false,
                error: "Invalid request format",
              })
            );
            return;
          }

          // Get next response or use default success response
          const response = this.responses.shift() || {
            success: true,
            transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
            gasUsed: "21000",
            relayerAddress: "0x742d35Cc6634C0532925a3b8D34e2f1c0C8b5421",
          };

          // Handle error responses with appropriate status codes
          if (!response.success) {
            res.writeHead(400, { "Content-Type": "application/json" });
          } else {
            res.writeHead(200, { "Content-Type": "application/json" });
          }
          res.end(JSON.stringify(response));
        } catch (error) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: false, error: "Invalid JSON" }));
        }
      });
    } else {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: false, error: "Not found" }));
    }
  }

  public start(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.server.listen(0, "localhost", () => {
        const address = this.server.address() as AddressInfo;
        this.port = address.port;
        const url = `http://localhost:${this.port}`;
        console.log(`🚀 Mock transfer server started at ${url}`);
        resolve(url);
      });

      this.server.on("error", reject);
    });
  }

  public stop(): Promise<void> {
    return new Promise((resolve) => {
      this.server.close(() => {
        console.log("🛑 Mock transfer server stopped");
        resolve();
      });
    });
  }

  public getUrl(): string {
    return `http://localhost:${this.port}`;
  }

  public setNextResponse(response: MockServerResponse) {
    this.responses.push(response);
  }

  public setNextResponses(responses: MockServerResponse[]) {
    this.responses.push(...responses);
  }

  public getRequestHistory(): any[] {
    return [...this.requestHistory];
  }

  public clearHistory() {
    this.requestHistory = [];
  }

  public getLastRequest(): any {
    return this.requestHistory[this.requestHistory.length - 1];
  }
}
