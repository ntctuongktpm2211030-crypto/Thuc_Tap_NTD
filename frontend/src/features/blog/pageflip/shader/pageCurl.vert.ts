export const pageCurlVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    vUv = uv;
    // Standard pass-through normal matrix mapping
    vNormal = normalize(normalMatrix * normal);
    
    // Model view projection mapping
    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * vec4(vPosition, 1.0);
  }
`;
