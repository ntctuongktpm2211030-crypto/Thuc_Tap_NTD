import * as THREE from 'three';
import { pageCurlVertexShader } from '../shader/pageCurl.vert';
import { pageCurlFragmentShader } from '../shader/pageCurl.frag';
import { PageCurlSolver } from './PageCurlSolver';
import { BookSpineSolver } from './BookSpineSolver';
import { CameraSolver } from './CameraSolver';
import { ShadowSolver } from './ShadowSolver';

export class WebGLBookEngine {
  private container: HTMLDivElement;
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  
  private frontMaterial!: THREE.ShaderMaterial;
  private backMaterial!: THREE.ShaderMaterial;
  private shadowMaterial!: THREE.ShaderMaterial;
  private edgeMaterial!: THREE.ShaderMaterial;
  
  private frontMesh!: THREE.Mesh;
  private backMesh!: THREE.Mesh;
  private shadowMesh!: THREE.Mesh;
  private edgeMesh!: THREE.Mesh;

  private geometry!: THREE.PlaneGeometry;
  private edgeGeometry!: THREE.PlaneGeometry;
  
  private pageW = 1.5;
  private pageH = 2.0;
  private directionStr: 'next' | 'prev';

  private animationFrameId: number | null = null;
  private isDestroyed = false;

  constructor(container: HTMLDivElement, canvas: HTMLCanvasElement, direction: 'next' | 'prev') {
    this.container = container;
    this.canvas = canvas;
    this.directionStr = direction;

    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 500;

    // 1. Scene and Camera Solver (Dynamic FOV/Dolly position)
    this.scene = new THREE.Scene();
    
    this.camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 100);
    this.camera.position.set(0, 0, 3.2);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      premultipliedAlpha: false
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // 2. Geometry Setup (64x64 subdivision)
    this.geometry = new THREE.PlaneGeometry(this.pageW, this.pageH, 64, 64);
    
    // Create edge geometry (rows of 2 vertices connecting front and back meshes)
    this.edgeGeometry = new THREE.PlaneGeometry(0.004, this.pageH, 1, 64);

    // Initial dummy texture
    const dummyTex = new THREE.DataTexture(new Uint8Array([253, 252, 248, 255]), 1, 1, THREE.RGBAFormat);
    dummyTex.needsUpdate = true;

    // 3. Materials Setup
    this.frontMaterial = new THREE.ShaderMaterial({
      vertexShader: pageCurlVertexShader,
      fragmentShader: pageCurlFragmentShader,
      side: THREE.FrontSide,
      transparent: true,
      uniforms: {
        progress: { value: 0.0 },
        direction: { value: direction === 'next' ? -1.0 : 1.0 },
        pageTexture: { value: dummyTex },
        isBackFace: { value: 0.0 }
      }
    });

    this.backMaterial = new THREE.ShaderMaterial({
      vertexShader: pageCurlVertexShader,
      fragmentShader: pageCurlFragmentShader,
      side: THREE.BackSide,
      transparent: true,
      uniforms: {
        progress: { value: 0.0 },
        direction: { value: direction === 'next' ? -1.0 : 1.0 },
        pageTexture: { value: dummyTex },
        isBackFace: { value: 1.0 }
      }
    });

    // Drop shadow shader (with soft edge falloff)
    this.shadowMaterial = new THREE.ShaderMaterial({
      vertexShader: pageCurlVertexShader,
      fragmentShader: `
        uniform float progress;
        varying vec2 vUv;
        void main() {
          float edgeFade = smoothstep(0.0, 0.15, vUv.x) * smoothstep(1.0, 0.85, vUv.x) *
                           smoothstep(0.0, 0.1, vUv.y) * smoothstep(1.0, 0.9, vUv.y);
          float density = 0.24 * sin(progress * 3.14159265);
          gl_FragColor = vec4(0.0, 0.0, 0.0, density * edgeFade);
        }
      `,
      transparent: true,
      depthWrite: false,
      uniforms: {
        progress: { value: 0.0 },
        direction: { value: direction === 'next' ? -1.0 : 1.0 }
      }
    });

    // Edge thickness material
    this.edgeMaterial = new THREE.ShaderMaterial({
      vertexShader: pageCurlVertexShader,
      fragmentShader: `
        uniform float progress;
        varying vec3 vNormal;
        void main() {
          vec3 normal = normalize(vNormal);
          if (normal.z < 0.0) normal = -normal;
          
          vec3 lightDir = normalize(vec3(0.35, 0.5, 0.78));
          float diffuse = max(dot(normal, lightDir), 0.0);
          vec3 edgeColor = vec3(0.90, 0.87, 0.74) * (0.75 + 0.25 * diffuse);
          gl_FragColor = vec4(edgeColor, 1.0);
        }
      `,
      side: THREE.DoubleSide,
      uniforms: {
        progress: { value: 0.0 },
        direction: { value: direction === 'next' ? -1.0 : 1.0 }
      }
    });

    // 4. Create and Position Meshes
    // Note: Since vertices are deformed on the CPU, we offset positions using Mesh coordinates
    this.frontMesh = new THREE.Mesh(this.geometry, this.frontMaterial);
    this.frontMesh.position.set(0, 0, 0.002); 
    this.scene.add(this.frontMesh);

    this.backMesh = new THREE.Mesh(this.geometry, this.backMaterial);
    this.backMesh.position.set(0, 0, -0.002); 
    this.scene.add(this.backMesh);

    this.shadowMesh = new THREE.Mesh(this.geometry, this.shadowMaterial);
    this.shadowMesh.position.set(0, 0, -0.010);
    this.scene.add(this.shadowMesh);

    this.edgeMesh = new THREE.Mesh(this.edgeGeometry, this.edgeMaterial);
    this.scene.add(this.edgeMesh);

    // Initial CPU-driven geometry update
    this.updateAnimation(0.0, direction);

    this.tick();
  }

  // Update textures
  public updateTextures(frontCanvas: HTMLCanvasElement, backCanvas: HTMLCanvasElement) {
    const frontTex = new THREE.CanvasTexture(frontCanvas);
    frontTex.colorSpace = THREE.SRGBColorSpace;
    frontTex.minFilter = THREE.LinearFilter;
    
    const backTex = new THREE.CanvasTexture(backCanvas);
    backTex.colorSpace = THREE.SRGBColorSpace;
    backTex.minFilter = THREE.LinearFilter;

    this.frontMaterial.uniforms.pageTexture.value = frontTex;
    this.backMaterial.uniforms.pageTexture.value = backTex;
  }

  // CPU page curl deformation solver execution
  public updateAnimation(t: number, direction: 'next' | 'prev') {
    const dirVal = direction === 'next' ? -1.0 : 1.0;
    
    this.frontMaterial.uniforms.progress.value = t;
    this.backMaterial.uniforms.progress.value = t;
    this.shadowMaterial.uniforms.progress.value = t;
    this.edgeMaterial.uniforms.progress.value = t;

    // 1. Camera Solver (Dynamic FOV/Dolly position updates)
    CameraSolver.update(this.camera, t);

    // 2. CPU Page Curl Solver & Book Spine Solver
    const posAttr = this.geometry.attributes.position;
    const normAttr = this.geometry.attributes.normal;
    
    const edgePositions: THREE.Vector3[] = [];
    const edgeNormals: THREE.Vector3[] = [];

    const cols = 64;
    const rows = 64;

    for (let j = 0; j <= rows; j++) {
      const y = (j / rows) * this.pageH - this.pageH / 2;
      
      // Save coordinates for the outer edge to deform edgeMesh
      const edgeData = PageCurlSolver.solve(this.pageW, y, t, dirVal, this.pageW, this.pageH);
      edgePositions.push(edgeData.position);
      edgeNormals.push(edgeData.normal);

      for (let i = 0; i <= cols; i++) {
        const x = (i / cols) * this.pageW;
        
        // Solve vertex position & normal mapping
        const { position, normal } = PageCurlSolver.solve(x, y, t, dirVal, this.pageW, this.pageH);
        
        const idx = j * (cols + 1) + i;
        posAttr.setXYZ(idx, position.x, position.y, position.z);
        normAttr.setXYZ(idx, normal.x, normal.y, normal.z);
      }
    }
    posAttr.needsUpdate = true;
    normAttr.needsUpdate = true;

    // 3. Deform Edge Thickness Geometry
    const edgePosAttr = this.edgeGeometry.attributes.position;
    const edgeNormAttr = this.edgeGeometry.attributes.normal;

    for (let j = 0; j <= rows; j++) {
      const pEdge = edgePositions[j];
      const nEdge = edgeNormals[j];
      
      // Offset by half thickness (0.002) along normal to construct edge bounds
      const frontEdge = pEdge.clone().addScaledVector(nEdge, 0.002);
      const backEdge = pEdge.clone().addScaledVector(nEdge, -0.002);
      
      edgePosAttr.setXYZ(j * 2, frontEdge.x, frontEdge.y, frontEdge.z);
      edgePosAttr.setXYZ(j * 2 + 1, backEdge.x, backEdge.y, backEdge.z);
      
      edgeNormAttr.setXYZ(j * 2, nEdge.x, nEdge.y, nEdge.z);
      edgeNormAttr.setXYZ(j * 2 + 1, nEdge.x, nEdge.y, nEdge.z);
    }
    edgePosAttr.needsUpdate = true;
    edgeNormAttr.needsUpdate = true;

    // 4. Shadow Solver (Drop shadow coordinates offsets)
    ShadowSolver.update(this.shadowMesh, t, direction);
  }

  public resize() {
    if (this.isDestroyed) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  }

  private tick = () => {
    if (this.isDestroyed) return;
    this.renderer.render(this.scene, this.camera);
    this.animationFrameId = requestAnimationFrame(this.tick);
  };

  public destroy() {
    this.isDestroyed = true;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    // Dispose resources
    this.geometry.dispose();
    this.edgeGeometry.dispose();
    
    this.frontMaterial.dispose();
    this.backMaterial.dispose();
    this.shadowMaterial.dispose();
    this.edgeMaterial.dispose();
    
    this.renderer.dispose();
  }
}
