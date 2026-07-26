import * as THREE from 'three';

export class PageCurlSolver {
  /**
   * Calculates mathematically precise developable surface coordinates (isometric bending)
   * on the CPU for a single vertex of the turning page.
   * 
   * @param x Original X coordinate on the flat page [0, pageWidth] (0 at spine, pageWidth at outer edge)
   * @param y Original Y coordinate on the flat page [-pageHeight/2, pageHeight/2]
   * @param t Progress value [0.0, 1.0]
   * @param direction -1.0 for next (turns left), 1.0 for prev (turns right)
   * @param pageWidth Width of the page mesh
   * @param pageHeight Height of the page mesh
   */
  public static solve(
    x: number,
    y: number,
    t: number,
    direction: number,
    pageWidth: number,
    pageHeight: number
  ): { position: THREE.Vector3; normal: THREE.Vector3 } {
    // 1. Spine Rotation Angle
    // If direction = -1.0 (next), sweeps left -> angle goes from 0 to -PI
    // If direction = 1.0 (prev), sweeps right -> angle goes from 0 to PI
    const spineAngle = t * Math.PI * direction;

    // Normalized Y coordinate [0.0, 1.0]
    const normY = (y / pageHeight) + 0.5;

    // 2. Developable Surface Folding (Isometric cylinder bend)
    // Only 28% of the page width is curled, keeping 72% completely flat.
    const bendWidth = pageWidth * 0.28;
    
    // Diagonal crease lines (Y-Twist: top folds faster)
    const creaseX = (pageWidth - bendWidth) - 0.10 * y * Math.sin(t * Math.PI);

    // Bending is very gentle (max 30 degrees) for the first 80% of the transition.
    // Rapidly rolls flat onto the other side during the last 20%.
    const maxCurlAngle = THREE.MathUtils.lerp(
      0.52 * Math.sin(t * Math.PI), 
      Math.PI, 
      THREE.MathUtils.smoothstep(t, 0.80, 1.0)
    );

    let xLocal = x;
    let zLocal = 0;
    let nLocal = new THREE.Vector3(0, 0, 1);

    if (x > creaseX && maxCurlAngle > 0.005) {
      const d = x - creaseX;
      const localRadius = bendWidth / maxCurlAngle;

      if (d < bendWidth) {
        const theta = (d / bendWidth) * maxCurlAngle;
        xLocal = creaseX + localRadius * Math.sin(theta);
        zLocal = localRadius * (1.0 - Math.cos(theta));
        nLocal.set(-Math.sin(theta), 0, Math.cos(theta));
      } else {
        const excess = d - bendWidth;
        xLocal = creaseX + localRadius * Math.sin(maxCurlAngle) + excess * Math.cos(maxCurlAngle);
        zLocal = localRadius * (1.0 - Math.cos(maxCurlAngle)) + excess * Math.sin(maxCurlAngle);
        nLocal.set(-Math.sin(maxCurlAngle), 0, Math.cos(maxCurlAngle));
      }
    }

    // 3. Spine pivot rotation (Spine is at X = 0)
    const cosA = Math.cos(spineAngle);
    const sinA = Math.sin(spineAngle);

    // Map local X onto book spine layout:
    // If next (direction = -1.0): starts on the right (xSpine = xLocal)
    // If prev (direction = 1.0): starts on the left (xSpine = -xLocal)
    const xSpine = -xLocal * direction;

    const xGlobal = xSpine * cosA - zLocal * sinA;
    const zGlobal = xSpine * sinA + zLocal * cosA;
    const yGlobal = y;

    // Rotate normal vector accordingly
    const nxGlobal = -nLocal.x * direction * cosA - nLocal.z * sinA;
    const nzGlobal = -nLocal.x * direction * sinA + nLocal.z * cosA;
    const nyGlobal = 0;

    // Note: Local position is returned relative to the group origin (Spine at X = 0).
    // The group translation handles the Book Spine layout offsets.
    return {
      position: new THREE.Vector3(xGlobal, yGlobal, zGlobal),
      normal: new THREE.Vector3(nxGlobal, nyGlobal, nzGlobal).normalize()
    };
  }
}
