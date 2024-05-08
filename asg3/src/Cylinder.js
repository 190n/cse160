class Cylinder {
	constructor(colorHex, sides) {
		this.color = new Vector3([
			((colorHex >> 16) & 0xff) / 255.0,
			((colorHex >> 8) & 0xff) / 255.0,
			((colorHex >> 0) & 0xff) / 255.0,
		]);
		this.matrix = new Matrix4();
		this.sides = sides;

		const vertices = [];
		for (let i = 0; i < sides; i++) {
			// base
			vertices.push(0.0, -0.5, 0.0);
			vertices.push(0.5 * Math.cos(2 * Math.PI * i / sides), -0.5, 0.5 * Math.sin(2 * Math.PI * i / sides));
			vertices.push(0.5 * Math.cos(2 * Math.PI * (i - 1) / sides), -0.5, 0.5 * Math.sin(2 * Math.PI * (i - 1) / sides));

			// top
			vertices.push(0.0, 0.5, 0.0);
			vertices.push(0.5 * Math.cos(2 * Math.PI * i / sides), 0.5, 0.5 * Math.sin(2 * Math.PI * i / sides));
			vertices.push(0.5 * Math.cos(2 * Math.PI * (i - 1) / sides), 0.5, 0.5 * Math.sin(2 * Math.PI * (i - 1) / sides));

			// side
			vertices.push(0.5 * Math.cos(2 * Math.PI * i / sides), -0.5, 0.5 * Math.sin(2 * Math.PI * i / sides));
			vertices.push(0.5 * Math.cos(2 * Math.PI * i / sides), 0.5, 0.5 * Math.sin(2 * Math.PI * i / sides));
			vertices.push(0.5 * Math.cos(2 * Math.PI * (i - 1) / sides), 0.5, 0.5 * Math.sin(2 * Math.PI * (i - 1) / sides));

			vertices.push(0.5 * Math.cos(2 * Math.PI * (i - 1) / sides), 0.5, 0.5 * Math.sin(2 * Math.PI * (i - 1) / sides));
			vertices.push(0.5 * Math.cos(2 * Math.PI * (i - 1) / sides), -0.5, 0.5 * Math.sin(2 * Math.PI * (i - 1) / sides));
			vertices.push(0.5 * Math.cos(2 * Math.PI * i / sides), -0.5, 0.5 * Math.sin(2 * Math.PI * i / sides));
		}

		this.vertexBuffer = gl.createBuffer();
		if (!this.vertexBuffer) {
			throw new Error('Failed to create cylinder vertex buffer');
		}
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
	}

	render() {
		gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
		gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(a_Position);
		gl.uniform4f(u_FragColor, this.color.elements[0], this.color.elements[1], this.color.elements[2], 1.0);
		gl.drawArrays(gl.TRIANGLES, 0, this.sides * 12);
	}
}
