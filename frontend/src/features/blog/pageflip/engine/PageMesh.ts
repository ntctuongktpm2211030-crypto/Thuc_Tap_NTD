import * as THREE from 'three';
import { pageCurlVertexShader } from '../shader/pageCurl.vert';
import { pageCurlFragmentShader } from '../shader/pageCurl.frag';
import { PageCurlSolver } from './PageCurlSolver';

export class PageMesh {
  public group: THREE.Group;
  
  private geometry: THREE.PlaneGeometry;
  private edgeGeometry: THREE.PlaneGeometry;
  
  private frontMaterial: THREE.ShaderMaterial;
  private backMaterial: THREE.ShaderMaterial;
  private edgeMaterial: THREE.ShaderMaterial;
  
  private frontMesh: THREE.Mesh;
  private backMesh: THREE.Mesh;
  private edgeMesh: THREE.Mesh;

  private width: number;
  private height: number;

  constructor(
    width: number,
    height: number,
    direction: number, // -1.0 next (turns left), 1.0 prev (turns right)
    isDoubleSided = true
  ) {
    this.width = width;
    this.height = height;
    this.group = new THREE.Group();

    // 1. Geometry Setup (64x64 grids as requested)
    this.geometry = new THREE.PlaneGeometry(width, height, 64, 64);
    
    // Edge thickness strip connecting front & back faces (1.2mm = 0.005 units)
    this.edgeGeometry = new THREE.PlaneGeometry(0.004, height, 1, 64);

    // Book Spine Solver: Shift the geometries so that the pivot point
    // lies exactly on the left/right spine edge (X = 0)
    // - For next (direction = -1.0): page is on the right, spans 0 to width
    // - For prev (direction = 1.0): page is on the left, spans -width to 0
    const pivotOffset = direction === -1.0 ? width / 2 : -width / 2;
    this.geometry.translate(pivotOffset, 0, 0);

    const edgeX = direction === -1.0 ? width : -width;
    this.edgeGeometry.rotateY(Math.PI / 2); // Face sideways
    this.edgeGeometry.translate(edgeX, 0, 0);

    const dummyTex = new THREE.DataTexture(new Uint8Array([253, 252, 248, 255]), 1, 1, THREE.RGBAFormat);
    dummyTex.needsUpdate = true;

    // 2. Materials Setup
    this.frontMaterial = new THREE.ShaderMaterial({
      vertexShader: pageCurlVertexShader,
      fragmentShader: pageCurlFragmentShader,
      side: THREE.FrontSide,
      transparent: true,
      uniforms: {
        progress: { value: 0.0 },
        direction: { value: direction },
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
        direction: { value: direction },
        pageTexture: { value: dummyTex },
        isBackFace: { value: 1.0 }
      }
    });

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
        direction: { value: direction }
      }
    });

    // 3. Create meshes (separated by 1.2mm thickness)
    this.frontMesh = new THREE.Mesh(this.geometry, this.frontMaterial);
    this.frontMesh.position.set(0, 0, 0.002);
    this.group.add(this.frontMesh);

    if (isDoubleSided) {
      this.backMesh = new THREE.Mesh(this.geometry, this.backMaterial);
      this.backMesh.position.set(0, 0, -0.002);
      this.group.add(this.backMesh);

      this.edgeMesh = new THREE.Mesh(this.edgeGeometry, this.edgeMaterial);
      this.group.add(this.edgeMesh);
    } else {
      this.backMesh = new THREE.Mesh();
      this.edgeMesh = new THREE.Mesh();
    }
  }

  // Updates canvas textures
  public updateTextures(frontCanvas: HTMLCanvasElement, backCanvas?: HTMLCanvasElement) {
    const frontTex = new THREE.CanvasTexture(frontCanvas);
    frontTex.colorSpace = THREE.SRGBColorSpace;
    frontTex.minFilter = THREE.LinearFilter;
    this.frontMaterial.uniforms.pageTexture.value = frontTex;

    if (backCanvas && this.backMaterial.uniforms.pageTexture) {
      const backTex = new THREE.CanvasTexture(backCanvas);
      backTex.colorSpace = THREE.SRGBColorSpace;
      backTex.minFilter = THREE.LinearFilter;
      this.backMaterial.uniforms.pageTexture.value = backTex;
    }
  }

  // Deforms geometries on the CPU
  public updateDeformation(t: number, direction: number) {
    this.frontMaterial.uniforms.progress.value = t;
    this.backMaterial.uniforms.progress.value = t;
    this.edgeMaterial.uniforms.progress.value = t;

    const posAttr = this.geometry.attributes.position;
    const normAttr = this.geometry.attributes.normal;

    const edgePositions: THREE.Vector3[] = [];
    const edgeNormals: THREE.Vector3[] = [];

    const cols = 64;
    const rows = 64;

    for (let j = 0; j <= rows; j++) {
      const y = (j / rows) * this.height - this.height / 2;

      // Outer page border tracking
      const edgeData = PageCurlSolver.solve(this.width, y, t, direction, this.width, this.height);
      edgePositions.push(edgeData.position);
      edgeNormals.push(edgeData.normal);

      for (let i = 0; i <= cols; i++) {
        const x = (i / cols) * this.width;
        
        // Compute CPU developable deformation
        const { position, normal } = PageCurlSolver.solve(x, y, t, direction, this.width, this.height);

        const idx = j * (cols + 1) + i;
        posAttr.setXYZ(idx, position.x, position.y, position.z);
        normAttr.setXYZ(idx, normal.x, normal.y, normal.z);
      }
    }
    posAttr.needsUpdate = true;
    normAttr.needsUpdate = true;

    // Connect edge thickness geometry
    if (this.edgeMesh && this.edgeGeometry) {
      const edgePosAttr = this.edgeGeometry.attributes.position;
      const edgeNormAttr = this.edgeGeometry.attributes.normal;

      for (let j = 0; j <= rows; j++) {
        const pEdge = edgePositions[j];
        const nEdge = edgeNormals[j];

        const frontEdge = pEdge.clone().addScaledVector(nEdge, 0.002);
        const backEdge = pEdge.clone().addScaledVector(nEdge, -0.002);

        edgePosAttr.setXYZ(j * 2, frontEdge.x, frontEdge.y, frontEdge.z);
        edgePosAttr.setXYZ(j * 2 + 1, backEdge.x, backEdge.y, backEdge.z);

        edgeNormAttr.setXYZ(j * 2, nEdge.x, nEdge.y, nEdge.z);
        edgeNormAttr.setXYZ(j * 2 + 1, nEdge.x, nEdge.y, nEdge.z);
      }
      edgePosAttr.needsUpdate = true;
      edgeNormAttr.needsUpdate = true;
    }
  }

  public setVisible(val: boolean) {
    this.group.visible = val;
  }

  public destroy() {
    this.geometry.dispose();
    this.edgeGeometry.dispose();
    this.frontMaterial.dispose();
    this.backMaterial.dispose();
    this.edgeMaterial.dispose();
  }
}
