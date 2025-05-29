import Sphere, { SphereConfig } from "@stratosphere-network/wallet";

export class StratoSphere {
  private wallet: Sphere | null = null;

  setupWallet(config: SphereConfig) {
    this.wallet = new Sphere(config);
  }
  hasWallet(): boolean {
    if (this.wallet) {
      return true;
    }
    return false;
  }
  getWallet(): Sphere | null {
    return this.wallet;
  }
}
