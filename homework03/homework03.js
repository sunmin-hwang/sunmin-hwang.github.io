import { resizeAspectRatio, setupText, updateText, Axes } from '../util/util.js';
import { Shader, readShaderFile } from '../util/shader.js';

const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');
let isInitialized = false;  
let shader;
let vao;
let positionBuffer; 
let isDrawing = false; 
let startPoint = null;  
let tempEndPoint = null; 
let lines = []; 
let textOverlay; 
let textOverlay2; 
let textOverlay3; 
let axes; 
let intersectionPoints = []; 

function handleResize() {
    if (!gl) return;
    resizeAspectRatio(gl, canvas);
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    if (axes) render(); 
}

window.addEventListener('resize', handleResize);

document.addEventListener('DOMContentLoaded', () => {
    if (isInitialized) return;
    main().then(success => { 
        if (success) isInitialized = true;
    });
});

function initWebGL() {
    if (!gl) return false;
    canvas.width = 700;
    canvas.height = 700;
    gl.clearColor(0.1, 0.2, 0.3, 1.0);
    handleResize(); 
    return true;
}

function setupBuffers() {
    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    shader.setAttribPointer('a_position', 2, gl.FLOAT, false, 0, 0); 
    gl.bindVertexArray(null);
}

function convertToWebGLCoordinates(x, y) {
    const rect = canvas.getBoundingClientRect();
    return [((x) / rect.width) * 2 - 1, -((y) / rect.height) * 2 + 1];
}

function setupMouseEvents() {
    canvas.addEventListener("mousedown", (event) => {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        if (!isDrawing && lines.length < 2) { 
            let [glX, glY] = convertToWebGLCoordinates(x, y);
            startPoint = [glX, glY];
            isDrawing = true;
        }
    });

    canvas.addEventListener("mousemove", (event) => {
        if (isDrawing) {
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            let [glX, glY] = convertToWebGLCoordinates(x, y);
            tempEndPoint = [glX, glY];

            if (lines.length === 0) {
                let r = Math.sqrt((tempEndPoint[0] - startPoint[0])**2 + (tempEndPoint[1] - startPoint[1])**2);
                updateText(textOverlay, `Circle: center (${startPoint[0].toFixed(2)}, ${startPoint[1].toFixed(2)}) radius = ${r.toFixed(2)}`);
            } else if (lines.length === 1) {
                updateText(textOverlay2, `Line segment: (${startPoint[0].toFixed(2)}, ${startPoint[1].toFixed(2)}) ~ (${tempEndPoint[0].toFixed(2)}, ${tempEndPoint[1].toFixed(2)})`);
            }
            render();
        }
    });

    canvas.addEventListener("mouseup", () => {
        if (isDrawing && tempEndPoint) {
            lines.push([...startPoint, ...tempEndPoint]); 
            if (lines.length === 2) {
                calculateIntersections();
            }
            isDrawing = false;
            startPoint = null;
            tempEndPoint = null;
            render();
        }
    });
}

function calculateIntersections() {
    const cX = lines[0][0], cY = lines[0][1];
    const r = Math.sqrt((lines[0][2] - lines[0][0])**2 + (lines[0][3] - lines[0][1])**2);
    const x1 = lines[1][0], y1 = lines[1][1], x2 = lines[1][2], y2 = lines[1][3];

    const dx = x2 - x1, dy = y2 - y1;
    const a = dx * dx + dy * dy;
    const b = 2 * (dx * (x1 - cX) + dy * (y1 - cY));
    const c = (x1 - cX)**2 + (y1 - cY)**2 - r * r;
    const det = b * b - 4 * a * c;

    intersectionPoints = [];
    if (det >= 0) {
        const t1 = (-b + Math.sqrt(det)) / (2 * a);
        const t2 = (-b - Math.sqrt(det)) / (2 * a);
        [t1, t2].forEach(t => { if (t >= 0 && t <= 1) intersectionPoints.push([x1 + t * dx, y1 + t * dy]); });
    }

    let msg = intersectionPoints.length > 0 ? `Intersection Points: ${intersectionPoints.length}` : "No intersection";
    if (intersectionPoints.length > 0) {
        intersectionPoints.forEach((p, i) => { msg += ` Point ${i + 1}: (${p[0].toFixed(2)}, ${p[1].toFixed(2)})`; });
    }
    updateText(textOverlay3, msg);
}

function drawCircle(p, color) {
    const center = [p[0], p[1]];
    const radius = Math.sqrt((p[2] - p[0])**2 + (p[3] - p[1])**2);
    let vertices = [];
    for (let i = 0; i <= 64; i++) {
        let angle = (i / 64) * 2 * Math.PI;
        vertices.push(center[0] + radius * Math.cos(angle), center[1] + radius * Math.sin(angle));
    }
    shader.setVec4("u_color", color);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);
    gl.drawArrays(gl.LINE_STRIP, 0, vertices.length / 2);
}

function render() {
    if (!gl || !shader) return;
    gl.clear(gl.COLOR_BUFFER_BIT);
    shader.use();
    gl.bindVertexArray(vao);

    if (lines.length > 0) drawCircle(lines[0], [1.0, 1.0, 0.0, 1.0]);
    else if (isDrawing && tempEndPoint) drawCircle([...startPoint, ...tempEndPoint], [0.5, 0.5, 0.5, 1.0]);

    if (lines.length > 1) {
        shader.setVec4("u_color", [1.0, 0.0, 1.0, 1.0]);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lines[1]), gl.STREAM_DRAW);
        gl.drawArrays(gl.LINES, 0, 2);
    } else if (isDrawing && lines.length === 1 && tempEndPoint) {
        shader.setVec4("u_color", [0.5, 0.5, 0.5, 1.0]);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([...startPoint, ...tempEndPoint]), gl.STREAM_DRAW);
        gl.drawArrays(gl.LINES, 0, 2);
    }

    if (intersectionPoints.length > 0) {
        shader.setVec4("u_color", [0.0, 1.0, 0.0, 1.0]);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(intersectionPoints.flat()), gl.STREAM_DRAW);
        gl.drawArrays(gl.POINTS, 0, intersectionPoints.length);
    }

    if (axes) axes.draw(mat4.create(), mat4.create());
}

async function main() {
    if (!initWebGL()) return false;
    const vs = await readShaderFile('shVert.glsl');
    const fs = await readShaderFile('shFrag.glsl');
    shader = new Shader(gl, vs, fs);
    setupBuffers();
    axes = new Axes(gl, 0.85); 
    textOverlay = setupText(canvas, "", 1);
    textOverlay2 = setupText(canvas, "", 2);
    textOverlay3 = setupText(canvas, "", 3);
    setupMouseEvents();
    render();
    return true;
}