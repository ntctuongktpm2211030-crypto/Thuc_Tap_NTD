import * as THREE from 'three';
import { BookPhysics } from './BookPhysics';
import { BookScene } from './BookScene';
import { CameraSolver } from './CameraSolver';

export class AnimationController {
  private physics: BookPhysics;
  private sceneGroup: BookScene;
  private camera: THREE.PerspectiveCamera;
  
  private lastTime = performance.now();
  private onCompleteCallback: () => void;
  private animationFrameId: number | null = null;
  private safetyTimeoutId: any = null;
  private isDestroyed = false;

  private currentPage: number;
  private totalPages: number;

  constructor(
    sceneGroup: BookScene,
    camera: THREE.PerspectiveCamera,
    direction: 'next' | 'prev',
    currentPage: number,
    totalPages: number,
    onComplete: () => void
  ) {
    this.sceneGroup = sceneGroup;
    this.camera = camera;
    this.currentPage = currentPage;
    this.totalPages = totalPages;
    this.onCompleteCallback = onComplete;

    // Critically damped spring physics
    this.physics = new BookPhysics(1.0, 110.0);
    this.physics.reset(0.0, 1.0);

    // Safety timeout: force-complete animation after 1000ms to prevent browser freezes
    this.safetyTimeoutId = setTimeout(() => {
      if (!this.physics.isSettled() && !this.isDestroyed) {
        console.warn('AnimationController safety timeout fired. Force settling.');
        this.physics.position = this.physics.target;
        this.physics.velocity = 0;
        this.onCompleteCallback();
      }
    }, 1000);

    this.lastTime = performance.now();
    this.tick(this.lastTime);
  }

  private tick = (now: number) => {
    if (this.isDestroyed) return;

    const dt = (now - this.lastTime) / 1000;
    this.lastTime = now;

    this.physics.step(dt);

    const progress = this.physics.position;
    const directionStr = this.sceneGroup.turningPage.group.children[0].material.uniforms.direction.value === -1.0 ? 'next' : 'prev';

    // 1. Calculate dynamic left/right stack ratios based on page index & flip progress
    let ratioL = this.currentPage / this.totalPages;
    if (directionStr === 'next') {
      ratioL = (this.currentPage + progress) / this.totalPages;
    } else {
      ratioL = (this.currentPage - progress) / this.totalPages;
    }
    
    // Clamp ratios to valid bounds
    ratioL = Math.max(0.0, Math.min(1.0, ratioL));
    const ratioR = 1.0 - ratioL;

    // 2. Update book scene mesh geometry deformation, shadows, and stack thickness
    this.sceneGroup.update(progress, directionStr, ratioL, ratioR);

    // 3. Update book body group translation (Momentum simulation: shifts by 2.5px / 0.016 units)
    const sweepDir = directionStr === 'next' ? -1.0 : 1.0;
    const bookTranslationX = sweepDir * 0.016 * Math.sin(progress * Math.PI);
    this.sceneGroup.rootGroup.position.x = bookTranslationX;

    // 4. Update camera dolly-FOV breathing
    CameraSolver.update(this.camera, progress);

    if (!this.physics.isSettled()) {
      this.animationFrameId = requestAnimationFrame(this.tick);
    } else {
      if (this.safetyTimeoutId !== null) {
        clearTimeout(this.safetyTimeoutId);
      }
      this.onCompleteCallback();
    }
  };

  public destroy() {
    this.isDestroyed = true;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.safetyTimeoutId !== null) {
      clearTimeout(this.safetyTimeoutId);
    }
  }
}
