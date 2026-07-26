export const pageCurlFragmentShader = `
  uniform sampler2D pageTexture;
  uniform float isBackFace;     // 1.0 if rendering back face, 0.0 if front face
  uniform float progress;
  uniform float direction;
  
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;

  // Pseudo-random noise hash
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  void main() {
    // 1. Texture lookup (mirror backface)
    vec2 uv_lookup = vUv;
    if (isBackFace > 0.5) {
      uv_lookup.x = 1.0 - uv_lookup.x;
    }
    
    vec4 texColor = texture2D(pageTexture, uv_lookup);
    
    // 2. Procedural Paper Normal Map (Fine paper fibers)
    float n1 = hash(vUv * 1600.0);
    float n2 = hash(vUv * 1600.0 + vec2(1.0, 0.0));
    float n3 = hash(vUv * 1600.0 + vec2(0.0, 1.0));
    vec3 normalPerturb = vec3((n2 - n1) * 0.015, (n3 - n1) * 0.015, 0.0);
    
    // 3. Normal computation
    vec3 normal = normalize(vNormal + normalPerturb);
    if (normal.z < 0.0) {
      normal = -normal;
    }
    
    // 4. Back Face Material: 8% darker
    if (isBackFace > 0.5) {
      texColor.rgb *= 0.92;
    }

    // 5. Lighting parameters
    vec3 lightDir = normalize(vec3(0.35, 0.5, 0.78)); 
    vec3 viewDir = normalize(-vPosition);
    
    // Matte diffuse & Ambient Occlusion (AO)
    // Scale down ambient light in tight curves to simulate occlusion
    float ao = mix(1.0, 0.72, 1.0 - normal.z);
    float diffuse = max(dot(normal, lightDir), 0.0);
    float ambient = 0.74 * ao;
    
    // Very Low Specular (matte paper gloss, peak 2% max)
    vec3 halfDir = normalize(lightDir + viewDir);
    float spec = pow(max(dot(normal, halfDir), 0.0), 16.0);
    float specularIntensity = 0.02 * spec * sin(progress * 3.14159265);
    
    // Subsurface Scattering (SSS) approximation: warm backlight translucency
    float sss = max(dot(-normal, lightDir), 0.0) * 0.12;
    vec3 sssColor = vec3(0.98, 0.94, 0.88) * sss;
    
    // Self Shadow: crease darkening
    float selfShadow = clamp(dot(normal, vec3(0.0, 0.0, 1.0)), 0.40, 1.0);
    
    // Composite final color
    vec3 finalColor = texColor.rgb * (ambient + 0.26 * diffuse) * selfShadow 
                      + vec3(specularIntensity) 
                      + sssColor;
    
    gl_FragColor = vec4(finalColor, texColor.a);
  }
`;
