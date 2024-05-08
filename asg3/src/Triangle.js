function drawTriangle3D(vertices) {
	const vertexBuffer = gl.createBuffer();
	if (!vertexBuffer) {
		throw new Error('Failed to create buffer object');
	}

	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
	gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(a_Position);
	gl.drawArrays(gl.TRIANGLES, 0, 3);
}
