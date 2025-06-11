export class DividendsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DividendsError";
  }
}
