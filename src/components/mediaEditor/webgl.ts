export const vertexShaderSource = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  varying vec2 v_texCoord;

  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = a_texCoord;
  }
`;

export const fragmentShaderSource = `
  precision mediump float;
  varying vec2 v_texCoord;
  uniform sampler2D u_image;
  uniform float u_enhance;
  uniform float u_brightness;
  uniform float u_contrast;
  uniform float u_saturation;
  uniform float u_warmth;
  uniform float u_fade;
  uniform float u_highlights;
  uniform float u_shadows;
  uniform float u_vignette;
  uniform float u_sharpen;
  uniform float u_grain;
  uniform vec2 u_textureSize; // Added to get texture dimensions
  
  float noise(vec2 uv) {
    float x = uv.x * 10.0;
    float y = uv.y * 10.0;
    return fract(sin(dot(vec2(x, y), vec2(12.9898, 78.233))) * 43758.5453);
  }

  void main() {
    vec4 color = texture2D(u_image, v_texCoord);

    // brightness
    float brightnessFactor = (u_brightness / 100.0) * 0.5;
    color.rgb += brightnessFactor;
    color.rgb = clamp(color.rgb, 0.0, 1.0);

    // contrast
    float contrast = u_contrast / 100.0;
    float contrastFactor = 1.0 + contrast;
    contrastFactor = max(0.1, contrastFactor);
    color.rgb = (color.rgb - 0.5) * contrastFactor + 0.5;
    color.rgb = clamp(color.rgb, 0.0, 1.0);

    // enhance
    float enhanceFactor = u_enhance * 0.25 / 100.0;
    enhanceFactor = clamp(enhanceFactor, 0.0, 1.0);
    color.rgb += enhanceFactor;
    color.rgb = clamp(color.rgb, 0.0, 1.0);

    // saturation
    float saturation = u_saturation / 100.0;
    vec3 grey = vec3(0.2126, 0.7152, 0.0722); 
    float greyValue = dot(color.rgb, grey); 
    vec3 greyColor = vec3(greyValue); 
    color.rgb = mix(greyColor, color.rgb, saturation + 1.0);

    // warmth
    float warmth;
    if(u_warmth < 0.0) {
      warmth = u_warmth * 0.5 / 100.0;
    } else {
      warmth = u_warmth * 0.2 / 100.0;
    }
    vec3 warmthColor = vec3(1.0, 0.8, 0.6);
    color.rgb = mix(color.rgb, warmthColor, warmth);

    // fade
    float fadeFactor = u_fade / 100.0;
    color.rgb *= (1.0 - fadeFactor * 0.5);
    
    // highlights
    float highlightAdjustment = (u_highlights / 100.0) * 0.5;
    float highlightThreshold = 0.7;
    float luminance = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
    if (luminance > highlightThreshold) {
      color.rgb += (1.0 - color.rgb) * highlightAdjustment;
      color.rgb = clamp(color.rgb, 0.0, 1.0);
    }

    // shadows
    float shadowAdjustment = (u_shadows / 100.0) * 0.5;
    float shadowThreshold = 0.3;
    if (luminance < shadowThreshold) {
      color.rgb -= color.rgb * shadowAdjustment;
      color.rgb = clamp(color.rgb, 0.0, 1.0);
    }
      
    // vignette 
    float vignetteStrength = u_vignette * 0.8 / 100.0;
    vec2 center = vec2(0.5, 0.5); 
    vec2 coords = v_texCoord - center;
    float dist = length(coords * vec2(u_textureSize.x / u_textureSize.y, 1.0));
    float vignette = smoothstep(0.3, 0.5, dist); 
    color.rgb *= mix(1.0, 1.0 - vignette * vignetteStrength, vignetteStrength); 
      
    // grain 
    float grainAmount = u_grain * 0.3 / 100.0;
    vec2 noiseUV = v_texCoord * u_textureSize;
    float grain = noise(noiseUV) * grainAmount;
    color.rgb += grain;
    color.rgb = clamp(color.rgb, 0.0, 1.0); 

      
    // sharpening
    vec2 onePixel = vec2(1.0, 1.0) / u_textureSize;
    float sharpenAmount = u_sharpen / 100.0;
    vec4 colorLeft = texture2D(u_image, v_texCoord - onePixel * vec2(1.0, 0.0));
    vec4 colorRight = texture2D(u_image, v_texCoord + onePixel * vec2(1.0, 0.0));
    vec4 colorTop = texture2D(u_image, v_texCoord - onePixel * vec2(0.0, 1.0));
    vec4 colorBottom = texture2D(u_image, v_texCoord + onePixel * vec2(0.0, 1.0));
    vec4 sharpenedColor = color * (1.0 + 4.0 * sharpenAmount) - 
                            (colorLeft + colorRight + colorTop + colorBottom) * sharpenAmount;
    sharpenedColor.rgb = clamp(sharpenedColor.rgb, 0.0, 1.0);
    color = sharpenedColor;


    gl_FragColor = color;
  }
`;

export function createShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('An error occurred compiling the shaders:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export function createProgram(gl: WebGLRenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader) {
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if(!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Unable to initialize the shader program:', gl.getProgramInfoLog(program));
    return null;
  }
  return program;
}

export const positions = [
  -1, -1,
  1, -1,
  -1,  1,
  -1,  1,
  1, -1,
  1,  1
];

export const texCoords = [
  0, 0,
  1, 0,
  0, 1,
  0, 1,
  1, 0,
  1, 1
];
