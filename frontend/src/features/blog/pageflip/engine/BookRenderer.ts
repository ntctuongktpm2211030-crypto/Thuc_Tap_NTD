import * as THREE from 'three';
import { BookScene } from './BookScene';
import { AnimationController } from './AnimationController';

export class BookRenderer {
  private container: HTMLDivElement;
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  
  public bookScene!: BookScene;
  private animationController!: AnimationController;

  private isDestroyed = false;
  private onCompleteCallback: () => void;

  constructor(
    container: HTMLDivElement,
    canvas: HTMLCanvasElement,
    direction: 'next' | 'prev',
    currentPage: number,
    totalPages: number,
    onComplete: () => void
  ) {
    this.container = container;
    this.canvas = canvas;
    this.onCompleteCallback = onComplete;

    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 500;

    // 1. Scene and Camera Solver
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(32, width / height, 0.1, 100);
    this.camera.position.set(0, 0, 3.2);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      premultipliedAlpha: false
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // 2. Book Scene Group (skeuomorphic stacks, static pages, spine, lighting)
    this.bookScene = new BookScene(this.scene, direction);

    // 3. Animation Controller with spring physics & dynamic ratios
    this.animationController = new AnimationController(
      this.bookScene,
      this.camera,
      direction,
      currentPage,
      totalPages,
      this.handleAnimationComplete
    );

    this.renderLoop();
  }

  private renderLoop = () => {
    if (this.isDestroyed) return;
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.renderLoop);
  };

  private handleAnimationComplete = () => {
    this.onCompleteCallback();
  };

  public resize() {
    if (this.isDestroyed) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  }

  public destroy() {
    this.isDestroyed = true;
    this.animationController.destroy();
    this.bookScene.destroy(this.scene);
    this.renderer.dispose();
  }
}
