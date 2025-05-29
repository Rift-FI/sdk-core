import Sphere, { SphereConfig } from "@stratosphere-network/wallet";

export class StratoSphere {
  public Wallet: Sphere | null = null;

  setupWallet(config: SphereConfig) {
    this.Wallet = new Sphere(config);
  }

  getWallet() {
    return this.Wallet;
  }
  hasWallet() {
    return this.Wallet !== null;
  }
}

export default StratoSphere;
