import * as THREE from 'three';

export class PaperStack {
  public group: THREE.Group;
  private geometries: THREE.BufferGeometry[] = [];
  private materials: THREE.Material[] = [];
  private meshes: THREE.Mesh[] = [];

  private side: 'left' | 'right';
  private layersCount: number;

  constructor(
    pageWidth: number,
    pageHeight: number,
    side: 'left' | 'right',
    layersCount = 16 // Render 16 fake sheets for realistic depth stack
  ) {
    this.group = new THREE.Group();
    this.side = side;
    this.layersCount = layersCount;

    // Warm cream paper tones
    const stackColor = new THREE.Color('#FDFCF8');

    for (let i = 0; i < layersCount; i++) {
      const geo = new THREE.PlaneGeometry(pageWidth, pageHeight);
      this.geometries.push(geo);

      // Deeper sheets get progressively darker (AO simulation)
      const depthFactor = i / (layersCount - 1 || 1);
      const brightness = 0.94 - 0.08 * depthFactor;
      const col = stackColor.clone().multiplyScalar(brightness);

      const mat = new THREE.MeshBasicMaterial({
        color: col,
        side: THREE.DoubleSide
      });
      this.materials.push(mat);

      const mesh = new THREE.Mesh(geo, mat);
      this.meshes.push(mesh);
      this.group.add(mesh);
    }

    // Set initial thickness at 100%
    this.updateThickness(1.0);
  }

  /**
   * Dynamically scales the stacked sheet offsets and opacity based on the current page ratio.
   * @param ratio Page density ratio [0.0, 1.0] (0.0 means stack is empty/flat, 1.0 means full thickness)
   */
  public updateThickness(ratio: number) {
    const offsetDirection = this.side === 'left' ? -1.0 : 1.0;

    for (let i = 0; i < this.layersCount; i++) {
      const mesh = this.meshes[i];
      
      // Calculate skeuomorphic offset scaled by thickness ratio
      // When ratio -> 0.0 (thinner), offsets contract to 0
      const xOffset = offsetDirection * 0.38 + offsetDirection * (i * 0.0016) * ratio;
      const zOffset = -0.008 - (i * 0.0018) * ratio;

      mesh.position.set(xOffset, 0, zOffset);
      
      // Adjust visibility and opacity based on ratio
      // If the stack is almost empty, hide the meshes
      const layerThreshold = i / this.layersCount;
      mesh.visible = ratio > layerThreshold;
    }
  }

  public destroy() {
    this.geometries.forEach((g) => g.dispose());
    this.materials.forEach((m) => m.dispose());
  }
}
