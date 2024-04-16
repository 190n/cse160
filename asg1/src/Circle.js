class Circle {
	constructor(x, y, size, color, segments) {
		const vertices = [x, y];
		for (let i = 0; i <= segments; i++) {
			const angle = i / segments * 2 * Math.PI;
			vertices.push(x + size * Math.cos(angle));
			vertices.push(y + size * Math.sin(angle));
		}

		this.vertices = new Float32Array(vertices);
		this.color = color;
	}

	render(gl, a_Size, u_FragColor) {
		gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.DYNAMIC_DRAW);
		gl.vertexAttrib1f(a_Size, 1.0);
		gl.uniform4f(u_FragColor, ...this.color);
		gl.drawArrays(gl.TRIANGLE_FAN, 0, this.vertices.length / 2);
	}
}
