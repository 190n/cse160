const CUBE_TRIS = [
	// front
	{ xyz: [0.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0], uv: [0.0, 0.0, 1.0, 1.0, 1.0, 0.0] },
	{ xyz: [0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0], uv: [0.0, 0.0, 0.0, 1.0, 1.0, 1.0] },
	// right
	{ xyz: [1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 1.0], uv: [0.0, 0.0, 1.0, 1.0, 1.0, 0.0] },
	{ xyz: [1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 1.0], uv: [0.0, 0.0, 0.0, 1.0, 1.0, 1.0] },
	// back
	{ xyz: [1.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0], uv: [0.0, 0.0, 1.0, 1.0, 1.0, 0.0] },
	{ xyz: [1.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 1.0, 1.0], uv: [0.0, 0.0, 0.0, 1.0, 1.0, 1.0] },
	// left
	{ xyz: [0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0], uv: [0.0, 0.0, 1.0, 1.0, 1.0, 0.0] },
	{ xyz: [0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0], uv: [0.0, 0.0, 0.0, 1.0, 1.0, 1.0] },
	// top
	{ xyz: [0.0, 1.0, 0.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.0], uv: [0.0, 0.0, 1.0, 1.0, 1.0, 0.0] },
	{ xyz: [0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 1.0], uv: [0.0, 0.0, 0.0, 1.0, 1.0, 1.0] },
	// bottom
	{ xyz: [0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0], uv: [0.0, 0.0, 1.0, 1.0, 1.0, 0.0] },
	{ xyz: [0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0], uv: [0.0, 0.0, 0.0, 1.0, 1.0, 1.0] },
];

let cubeVertexBuffer = null;

class Cube {
	static initBuffer() {
		cubeVertexBuffer = gl.createBuffer();
		if (!cubeVertexBuffer) {
			throw new Error('Failed to create vertex buffer for cubes');
		}
		gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexBuffer);

		const interleaved = [];
		for (const { xyz, uv } of CUBE_TRIS) {
			for (let point = 0; point < 3; point++) {
				for (let i = 0; i < 3; i++) {
					interleaved.push(xyz[3 * point + i]);
				}
				for (let i = 0; i < 2; i++) {
					interleaved.push(uv[2 * point + i]);
				}
			}
		}

		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(interleaved), gl.DYNAMIC_DRAW);
	}

	constructor(whichTexture, fragColor) {
		this.whichTexture = whichTexture;
		this.fragColor = fragColor;
		this.matrix = new Matrix4();

		if (cubeVertexBuffer === null) {
			Cube.initBuffer();
		}
	}

	render() {
		gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
		gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexBuffer);
		gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 5 * Float32Array.BYTES_PER_ELEMENT, 0);
		gl.enableVertexAttribArray(a_Position);

		gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 5 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT);
		gl.enableVertexAttribArray(a_UV);
		gl.uniform1i(u_WhichTexture, this.whichTexture);

		for (let i = 0; i < 6; i++) {
			if (this.whichTexture == TEX_UNIFORM_COLOR) {
				const light = [1.0, 0.7, 0.2, 0.4, 1.0, 0.2][i];
				gl.uniform4f(u_FragColor, light * this.color.elements[0], light * this.color.elements[1], light * this.color.elements[2], 1.0);
			}
			gl.drawArrays(gl.TRIANGLES, 6 * i, 6);
		}
	}
}
