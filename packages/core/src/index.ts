import Sphere, { SphereConfig } from "../../wallet/src/index";

class StratoSphere {
  public Sphere: Sphere | null = null;
  //public TokenModule: TokenModule | null = null;
  //public StakingModule: StakingModule | null = null;
  //public DividendsModule: DividendsModule | null = null;
  //public DexModule: DexModule | null = null;

  setupWallet(config: SphereConfig) {
    this.Sphere = new Sphere(config);
  }
  hasWallet(): boolean {
    if (this.Sphere) {
      return true;
    }
    return false;
  }
  getWallet(): Sphere | null {
    return this.Sphere;
  }
}

export default StratoSphere;
