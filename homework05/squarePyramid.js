export class Pyramid {
    constructor(gl) {
        this.gl = gl;
        
        this.vao = gl.createVertexArray();
        this.vbo = gl.createBuffer();
        this.ebo = gl.createBuffer();

        this.vertices = new Float32Array([
             0.0,  1.0,  0.0,   -0.5, 0.0,  0.5,    0.5, 0.0,  0.5,
             0.0,  1.0,  0.0,    0.5, 0.0,  0.5,    0.5, 0.0, -0.5,
             0.0,  1.0,  0.0,    0.5, 0.0, -0.5,   -0.5, 0.0, -0.5,
             0.0,  1.0,  0.0,   -0.5, 0.0, -0.5,   -0.5, 0.0,  0.5,
            -0.5,  0.0,  0.5,   -0.5, 0.0, -0.5,    0.5, 0.0, -0.5,
             0.5,  0.0, -0.5,    0.5, 0.0,  0.5,   -0.5, 0.0,  0.5
        ]);

        this.colors = new Float32Array([
            1, 0, 0, 1,   1, 0, 0, 1,   1, 0, 0, 1,
            1, 1, 0, 1,   1, 1, 0, 1,   1, 1, 0, 1,
            0, 1, 0, 1,   0, 1, 0, 1,   0, 1, 0, 1,
            0, 1, 1, 1,   0, 1, 1, 1,   0, 1, 1, 1,
            0, 0, 1, 1,   0, 0, 1, 1,   0, 0, 1, 1,
            0, 0, 1, 1,   0, 0, 1, 1,   0, 0, 1, 1,
        ]);

        this.indices = new Uint16Array([
            0, 1, 2,
            3, 4, 5,
            6, 7, 8,
            9, 10, 11,
            12, 13, 14,
            15, 16, 17,
        ]);

        this.initBuffers();
    }

    initBuffers() {
        const gl = this.gl;

        const vSize = this.vertices.byteLength;
        const cSize = this.colors.byteLength;
        const totalSize = vSize + cSize;

        gl.bindVertexArray(this.vao);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, totalSize, gl.STATIC_DRAW);
        
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.vertices);
        gl.bufferSubData(gl.ARRAY_BUFFER, vSize, this.colors);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0); 
        gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 0, vSize); 

        gl.enableVertexAttribArray(0);
        gl.enableVertexAttribArray(2);

        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindVertexArray(null);
    }

    draw(shader) {
        const gl = this.gl;
        shader.use();
        gl.bindVertexArray(this.vao);
        gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);
        gl.bindVertexArray(null);
    }

    delete() {
        const gl = this.gl;
        gl.deleteBuffer(this.vbo);
        gl.deleteBuffer(this.ebo);
        gl.deleteVertexArray(this.vao);
    }
}