import * as THREE from 'three';
import { BookSpineSolver } from './BookSpineSolver';

export class ShadowSolver {
  /**
   * Updates drop shadow position offsets and layout coordinates based on progress.
   * @param shadowMesh Drop shadow mesh instance
   * @param t Progress value [0.0, 1.0]
   * @param direction 'next' or 'prev'
   */
  public static update(
    shadowMesh: THREE.Mesh,
    t: number,
    direction: 'next' | 'prev'
  ) {
    const dirVal = direction === 'next' ? -1.0 : 1.0;
    const spineOffset = BookSpineSolver.getSpineOffsetX(t, direction);

    // Shift shadow to simulate directional light occlusion relative to height
    shadowMesh.position.x = spineOffset + dirVal * 0.04 * Math.sin(t * Math.PI);
    shadowMesh.position.y = -0.02 * Math.sin(t * Math.PI);
  }
}
