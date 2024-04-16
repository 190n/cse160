class Triangle {
	static fromVertices(vertices, color) {
		const tri = Object.create(Triangle.prototype);
		tri.vertices = new Float32Array(vertices);
		tri.color = color;
		return tri;
	}

	constructor(x, y, size, color) {
		this.vertices = new Float32Array([
			x, y + size,
			x + size, y - size,
			x - size, y - size,
		]);
		this.color = color;
	}

	render(gl, a_Size, u_FragColor) {
		gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.DYNAMIC_DRAW);
		gl.vertexAttrib1f(a_Size, 1.0);
		gl.uniform4f(u_FragColor, ...this.color);
		gl.drawArrays(gl.TRIANGLES, 0, 3);
	}
}
