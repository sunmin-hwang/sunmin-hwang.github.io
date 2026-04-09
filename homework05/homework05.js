import { resizeAspectRatio, Axes } from '../util/util.js';
import { Shader, readShaderFile } from '../util/shader.js';
import { Pyramid } from './squarePyramid.js';

const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');
let shader;
let startTime;

let isInitialized = false;

let viewMatrix = mat4.create();
let projMatrix = mat4.create();
let modelMatrix = mat4.create(); 

const pyramid = new Pyramid(gl);
const axes = new Axes(gl, 1.8);

document.addEventListener('DOMContentLoaded', () => {
    if (isInitialized) {
        return;
    }

    main().then(success => {
        if (!success) {
            return;
        }
        isInitialized = true;
    }).catch(error => {
        console.error(error);
    });
});

function initWebGL() {
    if (!gl) {
        return false;
    }

    canvas.width = 700;
    canvas.height = 700;
    resizeAspectRatio(gl, canvas);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.7, 0.8, 0.9, 1.0);
    
    return true;
}

async function initShader() {
    const vertexShaderSource = await readShaderFile('shVert.glsl');
    const fragmentShaderSource = await readShaderFile('shFrag.glsl');
    shader = new Shader(gl, vertexShaderSource, fragmentShaderSource);
}

function render() {
    const currentTime = Date.now();
    const elapsedTime = (currentTime - startTime) / 1000.0; 

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    let camX = 3.0 * Math.sin(glMatrix.toRadian(90.0 * elapsedTime));
    let camZ = 3.0 * Math.cos(glMatrix.toRadian(90.0 * elapsedTime));
    let camY = 5.0 + 5.0 * Math.sin(glMatrix.toRadian(45.0 * elapsedTime));
    
    mat4.lookAt(viewMatrix, 
        vec3.fromValues(camX, camY, camZ), 
        vec3.fromValues(0, 0, 0), 
        vec3.fromValues(0, 1, 0)); 

    shader.use();  
    shader.setMat4('u_model', modelMatrix);
    shader.setMat4('u_view', viewMatrix);
    shader.setMat4('u_projection', projMatrix);
    
    pyramid.draw(shader);

    axes.draw(viewMatrix, projMatrix);

    requestAnimationFrame(render);
}

async function main() {
    try {
        if (!initWebGL()) {
            throw new Error();
        }
        
        await initShader();

        mat4.perspective(
            projMatrix,
            glMatrix.toRadian(60),  
            canvas.width / canvas.height, 
            0.1, 
            100.0 
        );

        startTime = Date.now();

        requestAnimationFrame(render);

        return true;
    } catch (error) {
        return false;
    }
}