import * as THREE from 'three';
import { PageMesh } from './PageMesh';
import { PaperStack } from './PaperStack';
import { LightingSystem } from './LightingSystem';
import { ShadowSystem } from './ShadowSystem';
import { BookSpineSolver } from './BookSpineSolver';

export class BookScene {
  public rootGroup: THREE.Group;
  
  public leftStaticPage: PageMesh;
  public rightStaticPage: PageMesh;
  
  public leftStack: PaperStack;
  public rightStack: PaperStack;
  
  public turningPage: PageMesh;
  public spineMesh: THREE.Mesh;
  
  public lighting: LightingSystem;
  public shadows: ShadowSystem;
  
  private pageW = 1.5;
  private pageH = 2.0;

  constructor(scene: THREE.Scene, direction: 'next' | 'prev') {
    this.rootGroup = new THREE.Group();
    scene.add(this.rootGroup);

    const dirVal = direction === 'next' ? -1.0 : 1.0;

    // 1. Skeuomorphic Stacked Sheets (16 layers per stack)
    this.leftStack = new PaperStack(this.pageW, this.pageH, 'left');
    this.rightStack = new PaperStack(this.pageW, this.pageH, 'right');
    this.rootGroup.add(this.leftStack.group);
    this.rootGroup.add(this.rightStack.group);

    // 2. Static Pages (Pivoted at X = 0, spans left/right)
    this.leftStaticPage = new PageMesh(this.pageW, this.pageH, 1.0, false);
    this.leftStaticPage.group.position.set(0, 0, -0.005);
    this.rootGroup.add(this.leftStaticPage.group);

    this.rightStaticPage = new PageMesh(this.pageW, this.pageH, -1.0, false);
    this.rightStaticPage.group.position.set(0, 0, -0.005);
    this.rootGroup.add(this.rightStaticPage.group);

    // 3. Turning Page
    this.turningPage = new PageMesh(this.pageW, this.pageH, dirVal, true);
    const initialSpineX = direction === 'next' ? 0.38 : -0.38;
    this.turningPage.group.position.set(initialSpineX, 0, 0);
    this.rootGroup.add(this.turningPage.group);

    // 4. Central Spine
    const spineGeo = new THREE.CylinderGeometry(0.045, 0.045, this.pageH, 32, 1, true, -Math.PI/2, Math.PI);
    spineGeo.rotateY(Math.PI / 2);
    const spineMat = new THREE.MeshBasicMaterial({
      color: 0x221B14,
      side: THREE.DoubleSide
    });
    this.spineMesh = new THREE.Mesh(spineGeo, spineMat);
    this.spineMesh.position.set(0, 0, -0.002);
    this.rootGroup.add(this.spineMesh);

    // 5. Lighting & Shadows
    this.lighting = new LightingSystem(scene);
    this.shadows = new ShadowSystem(scene, this.pageW, this.pageH, dirVal);

    // ── HYBRID RENDER INTEGRATION ──
    // Hide WebGL static pages, paper stacks, and spine cylinder meshes.
    // They are already rendered with pixel-perfect resolution in the native HTML DOM
    // underneath the transparent canvas. WebGL only renders the dynamic curling sheet and shadows.
    this.leftStaticPage.setVisible(false);
    this.rightStaticPage.setVisible(false);
    this.leftStack.group.visible = false;
    this.rightStack.group.visible = false;
    this.spineMesh.visible = false;
  }

  /**
   * Synchronized CPU update deforming turning page mesh, scaling paper stacks,
   * shifting book spine and static page layouts.
   */
  public update(t: number, direction: 'next' | 'prev', ratioL: number, ratioR: number) {
    const dirVal = direction === 'next' ? -1.0 : 1.0;

    // 1. Update turning page CPU geometry deformation
    this.turningPage.updateDeformation(t, dirVal);

    // 2. Sync shadow geometry deformation
    const turningGeomPos = this.turningPage.group.children[0].geometry.attributes.position.array as Float32Array;
    this.shadows.deformGeometry(turningGeomPos);

    // 3. Update dynamic paper stack thickness scaling
    this.leftStack.updateThickness(ratioL);
    this.rightStack.updateThickness(ratioR);

    // 4. Spine Solver: shift spine horizontally based on ratio thickness
    const spineX = 0.08 * (ratioL - 0.5);
    this.spineMesh.position.x = spineX;

    // 5. Static Pages: shift left/right static pages to follow spine shift
    this.leftStaticPage.group.position.x = spineX;
    this.rightStaticPage.group.position.x = spineX;

    // 6. Turning Page layout shift
    const spineOffset = BookSpineSolver.getSpineOffsetX(t, direction);
    this.turningPage.group.position.x = spineX + spineOffset;

    // 7. Update ground shadow positions
    this.shadows.update(t, direction);
    
    // Shift the shadow mesh to follow the spine translation
    this.shadows.shadowMesh.position.x += spineX;
  }

  public destroy(scene: THREE.Scene) {
    this.rootGroup.parent?.remove(this.rootGroup);
    this.leftStaticPage.destroy();
    this.rightStaticPage.destroy();
    this.turningPage.destroy();
    this.leftStack.destroy();
    this.rightStack.destroy();
    
    this.spineMesh.geometry.dispose();
    if (Array.isArray(this.spineMesh.material)) {
      this.spineMesh.material.forEach((m) => m.dispose());
    } else {
      this.spineMesh.material.dispose();
    }

    this.lighting.destroy(scene);
    this.shadows.destroy(scene);
  }
}
