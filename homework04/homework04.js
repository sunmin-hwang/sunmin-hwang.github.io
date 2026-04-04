import { resizeAspectRatio } from '../util/util.js';
import { Shader, readShaderFile } from '../util/shader.js';

let isInitialized = false;
const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');
let shader;
let vaos = { pillar: null, largeBlade: null, smallBlade: null };
let startTime = 0;

document.addEventListener('DOMContentLoaded', () => {
    if (isInitialized) return;

    main().then(success => {
        if (!success) return;
        isInitialized = true;
        startTime = performance.now();
        requestAnimationFrame(animate);
    });
});

function initWebGL() {
    if (!gl) return false;
    canvas.width = 700;
    canvas.height = 700;
    resizeAspectRatio(gl, canvas);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.2, 0.3, 0.4, 1.0);
    return true;
}

function setupBuffers(vertices, colors, indices) {
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    shader.setAttribPointer("a_position", 2, gl.FLOAT, false, 0, 0);

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
    shader.setAttribPointer("a_color", 4, gl.FLOAT, false, 0, 0);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    gl.bindVertexArray(null);
    return vao;
}

function render(currentTime) {
    gl.clear(gl.COLOR_BUFFER_BIT);
    shader.use();

    const elapsedTime = (currentTime - startTime) / 1000;

    const baseTransform = mat4.create();
    mat4.translate(baseTransform, baseTransform, [0.0, 0.5, 0.0]);
    shader.setMat4("u_transform", baseTransform);
    gl.bindVertexArray(vaos.pillar);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

    const largeAngle = Math.sin(elapsedTime) * Math.PI * 2.0;
    const largeTransform = mat4.create();
    mat4.translate(largeTransform, largeTransform, [0.0, 0.5, 0.0]);
    mat4.rotate(largeTransform, largeTransform, largeAngle, [0, 0, 1]);
    shader.setMat4("u_transform", largeTransform);
    gl.bindVertexArray(vaos.largeBlade);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

    const smallAngle = Math.sin(elapsedTime) * Math.PI * -10.0;
    const positions = [-0.4, 0.4]; 

    for (let pos of positions) {
        const smallTransform = mat4.create();
        mat4.multiply(smallTransform, smallTransform, largeTransform);
        mat4.translate(smallTransform, smallTransform, [pos, 0, 0]);
        mat4.rotate(smallTransform, smallTransform, smallAngle, [0, 0, 1]);
        
        shader.setMat4("u_transform", smallTransform);
        gl.bindVertexArray(vaos.smallBlade);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    }
}

function animate(currentTime) {
    render(currentTime);
    requestAnimationFrame(animate);
}

async function main() {
    if (!initWebGL()) return false;

    const vSource = await readShaderFile('shVert.glsl');
    const fSource = await readShaderFile('shFrag.glsl');
    shader = new Shader(gl, vSource, fSource);

    const pillarVerts = new Float32Array([
        -0.1,  0.0,
        -0.1, -0.9,
         0.1, -0.9,
         0.1,  0.0
    ]);
    const pillarCols = new Float32Array(16).fill(0);
    for(let i=0; i<4; i++) {
        pillarCols[i*4] = 0.65; pillarCols[i*4+1] = 0.425; pillarCols[i*4+2] = 0.2; pillarCols[i*4+3] = 1.0;
    }
    const rectIndices = new Uint16Array([0, 1, 2, 0, 2, 3]);
    vaos.pillar = setupBuffers(pillarVerts, pillarCols, rectIndices);

    const largeVerts = new Float32Array([
        -0.4,  0.07,
        -0.4, -0.07,
         0.4, -0.07,
         0.4,  0.07
    ]);
    const largeCols = new Float32Array(16).fill(1.0);
    vaos.largeBlade = setupBuffers(largeVerts, largeCols, rectIndices);

    const smallVerts = new Float32Array([
        -0.03,  0.12,
        -0.03, -0.12,
         0.03, -0.12,
         0.03,  0.12
    ]);
    const smallCols = new Float32Array(16).fill(0.7);
    for(let i=0; i<4; i++) smallCols[i*4+3] = 1.0;
    vaos.smallBlade = setupBuffers(smallVerts, smallCols, rectIndices);

    return true;
}