const LAT_SLICES = 16;
const LONG_SLICES = 32;

const SPHERE_VERTICES_INTERLEAVED = [];

function indicesToSpherical(lat, long) {
	return [lat / LAT_SLICES * Math.PI, long / LONG_SLICES * 2 * Math.PI];
}

function sphericalToCartesian(theta, phi) {
	return [
		Math.sin(theta) * Math.cos(phi),
		Math.sin(theta) * Math.sin(phi),
		Math.cos(theta)
	];
}

for (let lat = LAT_SLICES - 1; lat >= 0; lat--) {
	for (let long = 0; long < LONG_SLICES; long++) {
		const s1 = indicesToSpherical(lat, long);
		const s2 = indicesToSpherical(lat + 1, long);
		const s3 = indicesToSpherical(lat + 1, long + 1);
		const s4 = indicesToSpherical(lat, long + 1);
		// our triangles are 1-2-3 and 1-3-4
		for (const [theta, phi] of [s1, s2, s3, s1, s3, s4]) {
			// xyz
			SPHERE_VERTICES_INTERLEAVED.push(...sphericalToCartesian(theta, phi));
			// uv
			SPHERE_VERTICES_INTERLEAVED.push(0, 0);
			// normal
			SPHERE_VERTICES_INTERLEAVED.push(...sphericalToCartesian(theta, phi));
		}
	}
}

let sphereVertexBuffer = null;

class Sphere {
	static initBuffer() {
		sphereVertexBuffer = gl.createBuffer();
		if (!sphereVertexBuffer) {
			throw new Error('Failed to create vertex buffer for spheres');
		}
		gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexBuffer);

		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(SPHERE_VERTICES_INTERLEAVED), gl.DYNAMIC_DRAW);
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

		if (sphereVertexBuffer === null) {
			Sphere.initBuffer();
		}
	}

	render() {
		gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
		gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexBuffer);
		gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 8 * Float32Array.BYTES_PER_ELEMENT, 0);
		gl.enableVertexAttribArray(a_Position);

		gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 8 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT);
		gl.enableVertexAttribArray(a_UV);

		gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 8 * Float32Array.BYTES_PER_ELEMENT, 5 * Float32Array.BYTES_PER_ELEMENT);
		gl.enableVertexAttribArray(a_Normal);

		gl.uniform1i(u_WhichTexture, this.whichTexture);
		if (this.whichTexture == TEX_UNIFORM_COLOR) {
			gl.uniform4f(u_FragColor, ...this.color.elements, 1.0);
		}

		gl.drawArrays(gl.TRIANGLES, 0, LAT_SLICES * LONG_SLICES * 6);
	}
}
