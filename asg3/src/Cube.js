const CUBE_TRIS = [
	// front
	[
		[0.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0],
		[0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0],
	],
	// right
	[
		[1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 1.0],
		[1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 1.0],
	],
	// back
	[
		[1.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0],
		[1.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 1.0, 1.0],
	],
	// left
	[
		[0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0],
		[0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0],
	],
	// top
	[
		[0.0, 1.0, 0.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.0],
		[0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 1.0],
	],
	// bottom
	[
		[0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0],
		[0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0],
	],
];

let cubeVertexBuffer = null;

class Cube {
	constructor(colorHex) {
		this.color = new Vector3([
			((colorHex >> 16) & 0xff) / 255.0,
			((colorHex >> 8) & 0xff) / 255.0,
			((colorHex >> 0) & 0xff) / 255.0,
		]);
		this.matrix = new Matrix4();

		if (cubeVertexBuffer === null) {
			cubeVertexBuffer = gl.createBuffer();
			if (!cubeVertexBuffer) {
				throw new Error('Failed to create vertex buffer for cubes');
			}
			gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(CUBE_TRIS.flat(2)), gl.DYNAMIC_DRAW);
		}
	}

	render() {
		gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
		gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexBuffer);
		gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(a_Position);

		for (let i = 0; i < CUBE_TRIS.length; i++) {
			const light = [1.0, 0.7, 0.2, 0.4, 1.0, 0.2][i];
			gl.uniform4f(u_FragColor, light * this.color.elements[0], light * this.color.elements[1], light * this.color.elements[2], 1.0);
			gl.drawArrays(gl.TRIANGLES, 6 * i, 6);
		}
	}
}
