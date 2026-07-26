import * as THREE from 'three';
import { pageCurlVertexShader } from '../shader/pageCurl.vert';
import { BookSpineSolver } from './BookSpineSolver';

export class ShadowSystem {
  public shadowMesh: THREE.Mesh;
  private geometry: THREE.PlaneGeometry;
  private material: THREE.ShaderMaterial;

  constructor(
    scene: THREE.Scene,
    pageWidth: number,
    pageHeight: number,
    direction: number
  ) {
    // 64x64 geometry matching the page grid
    this.geometry = new THREE.PlaneGeometry(pageWidth, pageHeight, 64, 64);

    // Soft drop shadow shader material
    this.material = new THREE.ShaderMaterial({
      vertexShader: pageCurlVertexShader,
      fragmentShader: `
        uniform float progress;
        varying vec2 vUv;
        void main() {
          // Soft edge fadeout
          float edgeFade = smoothstep(0.0, 0.15, vUv.x) * smoothstep(1.0, 0.85, vUv.x) *
                           smoothstep(0.0, 0.1, vUv.y) * smoothstep(1.0, 0.9, vUv.y);
          // Opacity is maximum in the middle of page turning
          float density = 0.24 * sin(progress * 3.14159265);
          gl_FragColor = vec4(0.0, 0.0, 0.0, density * edgeFade);
        }
      `,
      transparent: true,
      depthWrite: false,
      uniforms: {
        progress: { value: 0.0 },
        direction: { value: direction }
      }
    });

    this.shadowMesh = new THREE.Mesh(this.geometry, this.material);
    // Placed slightly below the turning meshes
    this.shadowMesh.position.set(0, 0, -0.010);
    scene.add(this.shadowMesh);
  }

  /**
   * Updates ground shadow coordinates offsets relative to height and direction
   * @param t Progress value [0.0, 1.0]
   * @param dir direction string
   */
  public update(t: number, dir: 'next' | 'prev') {
    this.material.uniforms.progress.value = t;

    const dirVal = dir === 'next' ? -1.0 : 1.0;
    const spineOffset = BookSpineSolver.getSpineOffsetX(t, dir);

    // Dynamic shift simulating top-right light angle casting shadow on the table
    this.shadowMesh.position.x = spineOffset + dirVal * 0.045 * Math.sin(t * Math.PI);
    this.shadowMesh.position.y = -0.02 * Math.sin(t * Math.PI);
  }

  /**
   * Deforms the shadow mesh geometry in sync with the turning page
   */
  public deformGeometry(deformedPositions: Float32Array) {
    const posAttr = this.geometry.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      posAttr.setXYZ(
        i,
        deformedPositions[i * 3],
        deformedPositions[i * 3 + 1],
        deformedPositions[i * 3 + 2]
      );
    }
    posAttr.needsUpdate = true;
  }

  public destroy(scene: THREE.Scene) {
    scene.remove(this.shadowMesh);
    this.geometry.dispose();
    this.material.dispose();
  }
}
