class World {
	constructor(map, whichTexture) {
		this.map = map;
		this.vertexBuffer = null;

		this.whichTexture = whichTexture;
		this.matrix = new Matrix4().setIdentity();

		const verts = [];

		for (let z = 0; z < this.map.length; z++) {
			for (let x = 0; x < this.map.length; x++) {
				for (let y = 0; y < this.map[z][x]; y++) {
					for (let i = 0; i < CUBE_VERTS_INTERLEAVED.length; i++) {
						const value = CUBE_VERTS_INTERLEAVED[i];
						switch (i % 5) {
							case 0: verts.push(x + value); break;
							case 1: verts.push(y + value); break;
							case 2: verts.push(z + value); break;
							default: verts.push(value); break;
						}
					}
				}
			}
		}

		console.log(verts);

		this.verts = new Float32Array(verts);
	}

	initBuffer() {
		this.vertexBuffer = gl.createBuffer();
		if (!this.vertexBuffer) {
			throw new Error('Failed to create vertex buffer for cubes');
		}
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, this.verts, gl.DYNAMIC_DRAW);

	}

	render() {
		if (this.vertexBuffer === null) {
			this.initBuffer();
		}

		gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
		gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 5 * Float32Array.BYTES_PER_ELEMENT, 0);
		gl.enableVertexAttribArray(a_Position);

		gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 5 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT);
		gl.enableVertexAttribArray(a_UV);
		gl.uniform1i(u_WhichTexture, this.whichTexture);

		gl.drawArrays(gl.TRIANGLES, 0, this.verts.length / 5);
	}
}
