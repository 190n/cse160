// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
const VSHADER_SOURCE = `
precision mediump float;
attribute vec4 a_Position;
attribute vec2 a_UV;
varying vec2 v_UV;
uniform mat4 u_ModelMatrix;
uniform mat4 u_GlobalRotateMatrix;

void main() {
	v_UV = a_UV;
	vec4 pos = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
	gl_Position = vec4(pos.xy, (pos.z - 8.0) / 10.0, pos.w);
}
`;

const TEX_UNIFORM_COLOR = 1;
const TEX_UV = 2;
const TEX_0 = 3;

// Fragment shader program
const FSHADER_SOURCE = `
precision mediump float;
varying vec2 v_UV;
uniform sampler2D u_Sampler0;
uniform int u_WhichTexture;
uniform vec4 u_FragColor;

void main() {
	if (u_WhichTexture == ${TEX_UNIFORM_COLOR}) {
		gl_FragColor = u_FragColor;
	} else if (u_WhichTexture == ${TEX_UV}) {
		gl_FragColor = vec4(v_UV, 1.0, 1.0);
	} else if (u_WhichTexture == ${TEX_0}) {
		gl_FragColor = texture2D(u_Sampler0, v_UV);
	} else {
		gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0);
	}
}
`;

let canvas, gl, a_Position, a_UV, u_ModelMatrix, u_GlobalRotateMatrix;

let cameraAngleX = 0;
let cameraAngleY = 0;

let fpsEstimate = -1;

function main() {
	// Retrieve <canvas> element
	canvas = document.getElementById('webgl');
	gl = setUpWebGL();
	if (gl === null) {
		return;
	}
	connectVariablesToGLSL();
	initTextures();
	handleClicks();
	requestAnimationFrame(tick);
}

function setUpWebGL() {
	// Get the rendering context for WebGL
	const gl = getWebGLContext(canvas, { preserveDrawingBuffer: true });
	if (!gl) {
		throw new Error('Failed to get the rendering context for WebGL');
	}

	// Initialize shaders
	if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
		throw new Error('Failed to intialize shaders.');
	}

	// Specify the color for clearing <canvas>
	gl.clearColor(0.0, 0.0, 0.0, 1.0);

	gl.enable(gl.DEPTH_TEST);

	// Clear <canvas>
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	return gl;
}

function connectVariablesToGLSL() {
	[a_Position, a_UV] = ['a_Position', 'a_UV'].map(name => {
		const attribute = gl.getAttribLocation(gl.program, name);
		if (attribute < 0) {
			throw new Error(`Failed to get the storage location of ${name}`);
		}
		return attribute;
	});

	[u_ModelMatrix, u_GlobalRotateMatrix, u_Sampler0, u_FragColor, u_WhichTexture] =
		['u_ModelMatrix', 'u_GlobalRotateMatrix', 'u_Sampler0', 'u_FragColor', 'u_WhichTexture'].map(name => {
			const uniform = gl.getUniformLocation(gl.program, name);
			if (uniform < 0) {
				throw new Error(`Failed to get the storage location of ${name}`);
			}
			return uniform;
		});
}

function initTextures() {
	const texture0 = gl.createTexture();
	const image0 = new Image();
	image0.onload = () => loadTexture(texture0, u_Sampler0, image0);
	image0.src = 'sky.png';
}

function loadTexture(texture, u_Sampler, image) {
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
	gl.uniform1i(u_Sampler, 0);
}

function handleClicks() {
	let lastX, lastY;

	canvas.onmousemove = (e) => {
		if (e.buttons == 1) {
			if (lastX === undefined && lastY === undefined) {
				lastX = e.clientX;
				lastY = e.clientY;
			} else {
				const dx = e.clientX - lastX;
				const dy = e.clientY - lastY;
				lastX = e.clientX;
				lastY = e.clientY;

				cameraAngleX -= dx;
				cameraAngleX = (cameraAngleX + 540) % 360 - 180;
				
				cameraAngleY -= dy;
			}
		}
	};

	canvas.onmouseup = canvas.onmouseleave = () => {
		lastX = undefined;
		lastY = undefined;
	};
}

function tick(ms) {
	const before = performance.now();
	renderAllShapes();
	const elapsed = performance.now() - before;
	const fps = 1000.0 / elapsed;

	if (fpsEstimate < 0) {
		fpsEstimate = fps;
	} else {
		fpsEstimate = 0.99 * fpsEstimate + 0.01 * fps;
	}
	document.getElementById('fps').textContent = Math.floor(fpsEstimate).toString();
	requestAnimationFrame(tick);
}

function renderAllShapes() {
	// Clear <canvas>
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	const rotateMat = new Matrix4().rotate(cameraAngleY, 1, 0, 0).rotate(cameraAngleX, 0, 1, 0);
	gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, rotateMat.elements);

	const base = new Matrix4().translate(-0.5, -0.5, -0.5);

	const ground = new Cube(TEX_0);
	ground.matrix.translate(0.0, -0.5, 0.0);
	ground.matrix.scale(1.0, 0.1, 1.0);
	ground.matrix.multiply(base);
	ground.render();

	const box = new Cube(TEX_UNIFORM_COLOR, 0x000ff);
	box.matrix.translate(0.0, -0.3, 0.0);
	box.matrix.scale(0.3, 0.3, 0.3);
	box.matrix.multiply(base);
	box.render();

	const sky = new Cube(TEX_0);
	sky.matrix.scale(5.0, 5.0, 5.0);
	sky.matrix.multiply(base);
	sky.render();
}
