import * as THREE from 'three';

export class LightingSystem {
  public ambientLight: THREE.AmbientLight;
  public mainLight: THREE.DirectionalLight;
  public rimLight: THREE.DirectionalLight;

  constructor(scene: THREE.Scene) {
    // 1. Warm Ambient Light
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.74);
    scene.add(this.ambientLight);

    // 2. Primary Directional Light (Warm top-right sunlight)
    this.mainLight = new THREE.DirectionalLight(0xfff6e0, 0.42);
    this.mainLight.position.set(2.0, 4.0, 3.5);
    scene.add(this.mainLight);

    // 3. Rim Light (Outline highlighting for pages in motion from back-left)
    this.rimLight = new THREE.DirectionalLight(0xffffff, 0.28);
    this.rimLight.position.set(-3.0, 1.5, -2.0);
    scene.add(this.rimLight);
  }

  public destroy(scene: THREE.Scene) {
    scene.remove(this.ambientLight);
    scene.remove(this.mainLight);
    scene.remove(this.rimLight);
  }
}
