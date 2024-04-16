class Point {
	constructor(x, y, size, color) {
		this.x = x;
		this.y = y;
		this.size = size;
		this.color = color;
	}

	render(gl, a_Size, u_FragColor) {
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([this.x, this.y]), gl.DYNAMIC_DRAW);
		gl.vertexAttrib1f(a_Size, this.size);
		gl.uniform4f(u_FragColor, ...this.color);
		gl.drawArrays(gl.POINTS, 0, 1);
	}
}
