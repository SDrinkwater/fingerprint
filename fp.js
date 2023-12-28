// Define the shader source code as constants
const vertexShaderSource = `
  attribute vec2 aVertexPosition;
  void main() {
    gl_Position = vec4(aVertexPosition, 0, 1);
  }
`;
const fragmentShaderSource = `
  precision mediump float;
  uniform vec4 uColor;
  void main() {
    gl_FragColor = uColor;
  }
`;
// Function to create and compile a shader
function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  if (!shader) {
    console.error("Error creating shader.");
    return null;
  }
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(
      "An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader)
    );
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}
// Function to create a program from vertex and fragment shaders
function createShaderProgram(gl, vertexSource, fragmentSource) {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertexShader || !fragmentShader) {
    return null;
  }
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(
      "Unable to initialize the shader program: " +
        gl.getProgramInfoLog(program)
    );
    return null;
  }
  return program;
}
// Main function to create the fingerprint
async function createDeviceFingerprint() {
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl");
  if (!gl) {
    throw new Error("WebGL is not supported");
  }
  // Configure the canvas to be invisible and not affect layout
  canvas.style.position = "absolute";
  canvas.style.top = "-9999px";
  canvas.style.width = "1px";
  canvas.style.height = "1px";
  // Create shader program
  const shaderProgram = createShaderProgram(
    gl,
    vertexShaderSource,
    fragmentShaderSource
  );
  if (!shaderProgram) {
    throw new Error("Shader program could not be initialized");
  }
  gl.useProgram(shaderProgram);
  // Define vertices for the triangle
  const vertices = new Float32Array([
    0.0,
    1.0, // Vertex 1
    -1.0,
    -1.0, // Vertex 2
    1.0,
    -1.0, // Vertex 3
  ]);
  // Create a buffer and put the vertices in it
  const vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  // Link the shader program with the buffer data
  const positionAttribLocation = gl.getAttribLocation(
    shaderProgram,
    "aVertexPosition"
  );
  gl.enableVertexAttribArray(positionAttribLocation);
  gl.vertexAttribPointer(positionAttribLocation, 2, gl.FLOAT, false, 0, 0);
  // Set the color to yellow
  const colorUniformLocation = gl.getUniformLocation(shaderProgram, "uColor");
  gl.uniform4f(colorUniformLocation, 1.0, 1.0, 0.0, 1.0); // RGBA for yellow
  // Draw the triangle
  gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  // Read the pixels to create a fingerprint
  const pixels = new Uint8Array(canvas.width * canvas.height * 4);
  gl.readPixels(
    0,
    0,
    canvas.width,
    canvas.height,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    pixels
  );
  // Hash the pixels data using SHA-256
  const hashBuffer = await crypto.subtle.digest("SHA-256", pixels);
  // Convert the hashBuffer to a hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashHex;
}

createDeviceFingerprint().then((fingerprint) => {
  const fingerprintEl = document.getElementById("fingerprint");
  fingerprintEl.textContent = fingerprint;
});
