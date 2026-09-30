import React, { useEffect, useRef } from 'react';

const VERTEX_SHADER = `
  attribute vec4 a_position;
  void main() {
    gl_Position = a_position;
  }
`;

const FRAGMENT_SHADER = `
  precision mediump float;

  uniform vec2 iResolution;
  uniform float iTime;
  uniform vec3 u_color;

  void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 centeredUV = (2.0 * fragCoord - iResolution.xy) / min(iResolution.x, iResolution.y);

    // Continuous, steady linear flow over time
    float time = iTime * 0.55;

    vec2 distortion = centeredUV;
    // Autonomous multi-octave trigonometric wave distortion (pure linear progression)
    for (float i = 1.0; i < 8.0; i++) {
      distortion.x += (0.5 / i) * cos(i * 2.0 * distortion.y + time);
      distortion.y += (0.5 / i) * sin(i * 2.0 * distortion.x + time);
    }

    // Glowing wave pattern with smooth continuous flow
    float wave = abs(sin(distortion.x + distortion.y + time));
    float glow = smoothstep(0.9, 0.2, wave);

    fragColor = vec4(u_color * glow, 1.0);
  }

  void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
  }
`;

const BLUR_MAP: Record<string, string> = {
  none: 'backdrop-blur-none',
  sm: 'backdrop-blur-sm',
  md: 'backdrop-blur-md',
  lg: 'backdrop-blur-lg',
  xl: 'backdrop-blur-xl',
  '2xl': 'backdrop-blur-2xl',
  '3xl': 'backdrop-blur-3xl',
};

export interface SmokeyBackgroundProps {
  backdropBlurAmount?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  color?: string;
  className?: string;
  speed?: number;
}

export const SmokeyBackground: React.FC<SmokeyBackgroundProps> = ({
  backdropBlurAmount = 'sm',
  color = '#4f46e5',
  className = '',
  speed = 1.0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const hexToRgb = (hex: string): [number, number, number] => {
    let cleanHex = hex.replace('#', '');
    if (cleanHex.length === 3) {
      cleanHex = cleanHex.split('').map(c => c + c).join('');
    }
    const r = parseInt(cleanHex.substring(0, 2), 16) / 255 || 0.31;
    const g = parseInt(cleanHex.substring(2, 4), 16) / 255 || 0.27;
    const b = parseInt(cleanHex.substring(4, 6), 16) / 255 || 0.90;
    return [r, g, b];
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { powerPreference: 'high-performance', alpha: false });
    if (!gl) {
      console.warn('WebGL is not supported in this browser.');
      return;
    }

    const compileShader = (type: number, source: string): WebGLShader | null => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertShader = compileShader(gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragShader = compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vertShader || !fragShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const aPosition = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    const iResolution = gl.getUniformLocation(program, 'iResolution');
    const iTime = gl.getUniformLocation(program, 'iTime');
    const uColor = gl.getUniformLocation(program, 'u_color');

    const startTime = performance.now();
    const [r, g, b] = hexToRgb(color);
    gl.uniform3f(uColor, r, g, b);

    let animationFrameId: number;
    let isRunning = true;

    // Linear continuous render loop - runs autonomously without mouse hover
    const render = (now: number) => {
      if (!isRunning) return;

      const width = canvas.clientWidth || window.innerWidth;
      const height = canvas.clientHeight || window.innerHeight;

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }

      // Linear continuous time progression
      const elapsedSec = ((now - startTime) / 1000) * speed;
      gl.uniform2f(iResolution, width, height);
      gl.uniform1f(iTime, elapsedSec);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      cancelAnimationFrame(animationFrameId);
      gl.deleteProgram(program);
      gl.deleteShader(vertShader);
      gl.deleteShader(fragShader);
      gl.deleteBuffer(buffer);
    };
  }, [color, speed]);

  const blurClass = BLUR_MAP[backdropBlurAmount] || BLUR_MAP.sm;

  return (
    <div className={`absolute inset-0 w-full h-full overflow-hidden ${className}`}>
      <canvas ref={canvasRef} className="w-full h-full block" />
      <div className={`absolute inset-0 pointer-events-none ${blurClass}`} />
    </div>
  );
};

export default SmokeyBackground;
