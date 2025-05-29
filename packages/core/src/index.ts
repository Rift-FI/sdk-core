import Sphere, { SphereConfig } from "@stratosphere-network/wallet";

export class StratoSphere {
  private wallet: Sphere | null;

  constructor(config: SphereConfig) {
    this.wallet = new Sphere(config);
  }
}

