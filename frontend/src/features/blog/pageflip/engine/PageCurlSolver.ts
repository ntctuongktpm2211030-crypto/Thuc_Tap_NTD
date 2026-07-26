import * as THREE from 'three';

export class PageCurlSolver {
  /**
   * Solves the isometric page curl vertex coordinates and normal vectors.
   * @param x Original vertex X coordinate on flat page [0, pageWidth]
   * @param y Original vertex Y coordinate on flat page [-pageHeight/2, pageHeight/2]
   * @param t Progress value of the page turn [0.0, 1.0]
   * @param direction Direction of flip: -1.0 for next, 1.0 for prev
   * @param pageWidth Width of a single page
   * @param pageHeight Height of a single page
   */
  public static solve(
    x: number,
    y: number,
    t: number,
    direction: number,
    pageWidth: number,
    pageHeight: number
  ): { position: THREE.Vector3; normal: THREE.Vector3 } {
    // 1. Solve page spine rotation angle
    // Page rotates smoothly around Y-axis spine from 0 to PI (or -PI depending on direction)
    const spineAngle = t * Math.PI * -direction;

    // Normalize y position to [0.0, 1.0] for parameter variance
    const normY = (y / pageHeight) + 0.5;

    // 2. Solve Page Curl geometry (Isometric Cylinder Bend)
    // We only curl the outer 25% of the page, leaving 75% flat.
    // Top corner curls slightly wider than bottom corner to create a subtle Y-twist.
    const bendWidth = pageWidth * (0.24 + 0.08 * normY); 
    
    // Crease line position
    const creaseX = pageWidth - bendWidth;

    // Curl angle peaks in the middle of flip (t = 0.5) and lands flat (t = 1.0)
    const maxCurlAngle = 0.65 * Math.sin(t * Math.PI); // max 37 degrees bend
    
    let xLocal = x;
    let zLocal = 0;
    let nLocal = new THREE.Vector3(0, 0, 1);

    if (x > creaseX && maxCurlAngle > 0.005) {
      const d = x - creaseX;
      const localRadius = bendWidth / maxCurlAngle;
      const angle = (d / bendWidth) * maxCurlAngle;

      // Wrap coordinates around the cylinder
      xLocal = creaseX + localRadius * Math.sin(angle);
      zLocal = localRadius * (1.0 - Math.cos(angle));

      // Calculate perturbed normal along the cylinder curve
      nLocal.set(-Math.sin(angle), 0, Math.cos(angle));
    }

    // 3. Book Spine Solver: Apply global rotation around the Y-axis spine (X = 0)
    const cosA = Math.cos(spineAngle);
    const sinA = Math.sin(spineAngle);

    // If flipping backward, we mirror the local X coordinates
    const sweepDir = direction; // -1 for next, 1 for prev
    const xSpine = xLocal * sweepDir;

    const xGlobal = xSpine * cosA - zLocal * sinA;
    const zGlobal = xSpine * sinA + zLocal * cosA;
    const yGlobal = y;

    // Rotate normal vector accordingly
    const nxGlobal = nLocal.x * sweepDir * cosA - nLocal.z * sinA;
    const nzGlobal = nLocal.x * sweepDir * sinA + nLocal.z * cosA;
    const nyGlobal = 0;

    // Adjust position of page depending on spine center offset
    const spineOffset = direction === -1.0 ? 0.38 : -0.38;
    const currentOffset = spineOffset * (1.0 - t);

    return {
      position: new THREE.Vector3(xGlobal + currentOffset, yGlobal, zGlobal),
      normal: new THREE.Vector3(nxGlobal, nyGlobal, nzGlobal).normalize()
    };
  }
}
