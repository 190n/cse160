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

const CUBE_VERTS_INTERLEAVED = [];

for (const { xyz, uv } of CUBE_TRIS) {
	for (let point = 0; point < 3; point++) {
		for (let i = 0; i < 3; i++) {
			CUBE_VERTS_INTERLEAVED.push(xyz[3 * point + i]);
		}
		for (let i = 0; i < 2; i++) {
			CUBE_VERTS_INTERLEAVED.push(uv[2 * point + i]);
		}
	}
}

let cubeVertexBuffer = null;

class Cube {
	static initBuffer() {
		cubeVertexBuffer = gl.createBuffer();
		if (!cubeVertexBuffer) {
			throw new Error('Failed to create vertex buffer for cubes');
		}
		gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexBuffer);

		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(CUBE_VERTS_INTERLEAVED), gl.DYNAMIC_DRAW);
	}

	constructor(whichTexture, colorHex) {
		this.whichTexture = whichTexture;
		if (whichTexture == TEX_UNIFORM_COLOR) {
			this.color = new Vector3([
				((colorHex >> 16) & 0xff) / 255.0,
				((colorHex >> 8) & 0xff) / 255.0,
				((colorHex >> 0) & 0xff) / 255.0,
			]);
		}
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
		if (this.whichTexture == TEX_UNIFORM_COLOR) {
			gl.uniform4f(u_FragColor, ...this.color.elements, 1.0);
		}

		// 	for (let i = 0; i < 6; i++) {
		// 		const light = [1.0, 0.7, 0.2, 0.4, 1.0, 0.2][i];
		// 		gl.drawArrays(gl.TRIANGLES, 6 * i, 6);
		// 	}
		// } else {
			gl.drawArrays(gl.TRIANGLES, 0, 36);
		// }
	}
}
