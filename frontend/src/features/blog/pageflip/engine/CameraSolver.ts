import * as THREE from 'three';

export class CameraSolver {
  /**
   * Dynamically applies dolly-in/out and FOV breathing to the camera during turn.
   * @param camera PerspectiveCamera instance
   * @param t Progress value [0.0, 1.0]
   */
  public static update(camera: THREE.PerspectiveCamera, t: number) {
    // Dolly position breathing (subtle depth transition)
    camera.position.z = 3.2 - 0.12 * Math.sin(t * Math.PI);
    
    // Field of View breathing (subtle focal zoom adjustment)
    camera.fov = 30.0 - 1.2 * Math.sin(t * Math.PI);
    camera.updateProjectionMatrix();
  }
}
