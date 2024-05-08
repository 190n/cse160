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
	gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
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
let cameraAngleX = parseFloat(document.getElementById('angle').value);
let tail1Angle = parseFloat(document.getElementById('tail1').value);
let tail2Angle = parseFloat(document.getElementById('tail2').value);
let tail3Angle = parseFloat(document.getElementById('tail3').value);

let animationRunning = true;
let cameraAngleY = 0;

let legBLAngle, legFLAngle, legBRAngle, legFRAngle;

let fpsEstimate = -1;

function main() {
	// Retrieve <canvas> element
	canvas = document.getElementById('webgl');
	gl = setUpWebGL();
	if (gl === null) {
		return;
	}
	connectVariablesToGLSL();
	handleClicks();
	initTextures();
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
	image0.src = 'smpte.png';
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
	// Register function (event handler) to be called on a mouse press
	const angleInput = document.getElementById('angle');
	angleInput.oninput = (e) => {
		cameraAngleX = parseFloat(e.target.value);
	};
	document.getElementById('tail1').oninput = (e) => {
		tail1Angle = parseFloat(e.target.value);
	};
	document.getElementById('tail2').oninput = (e) => {
		tail2Angle = parseFloat(e.target.value);
	};
	document.getElementById('tail3').oninput = (e) => {
		tail3Angle = parseFloat(e.target.value);
	};

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
				angleInput.value = cameraAngleX;
				
				cameraAngleY -= dy;
			}
		}
	};

	canvas.onmouseup = canvas.onmouseleave = () => {
		lastX = undefined;
		lastY = undefined;
	};

	document.getElementById('animate-off').onclick = () => animationRunning = false;
	document.getElementById('animate-on').onclick = () => animationRunning = true;
}

function updateAnimationAngles(time) {
	legBLAngle = Math.sin(Math.PI * (time + 0)) * 15;
	legFLAngle = Math.sin(Math.PI * (time + 0.5)) * 15;
	legBRAngle = Math.sin(Math.PI * (time + 1)) * 15;
	legFRAngle = Math.sin(Math.PI * (time + 1.5)) * 15;
}

function tick(ms) {
	const before = performance.now();
	if (animationRunning) {
		updateAnimationAngles(ms / 1000);
	}
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

	const body = new Cube(0xff8000);
	body.matrix.scale(0.8, 0.5, 0.5);
	body.matrix.multiply(base);
	body.render();

	const head = new Cube(0xff8000);
	head.matrix.setTranslate(0.5, 0.25, 0.0);
	const headBase = new Matrix4(head.matrix);
	head.matrix.scale(0.4, 0.4, 0.4);
	head.matrix.multiply(base);
	head.render();

	const leftEye = new Cube(0x404040);
	leftEye.matrix.translate(0.11, 0.0, -0.15);
	leftEye.matrix.multiply(headBase);
	leftEye.matrix.scale(0.1, 0.1, 0.1);
	leftEye.render();

	const rightEye = new Cube(0x404040);
	rightEye.matrix.translate(0.11, 0.0, 0.05);
	rightEye.matrix.multiply(headBase);
	rightEye.matrix.scale(0.1, 0.1, 0.1);
	rightEye.render();

	const nose = new Cube(0xff8080);
	nose.matrix.translate(0.2, -0.1, -0.05);
	nose.matrix.multiply(headBase);
	nose.matrix.scale(0.05, 0.05, 0.05);
	nose.matrix.rotate(45, 1.0, 0.0, 0.0);
	nose.render();

	const leftEar = new Cube(0xffc080);
	leftEar.matrix.scale(1.0, 1.5, 1.0);
	leftEar.matrix.translate(0.1, 0.05, -0.1);
	leftEar.matrix.multiply(headBase);
	leftEar.matrix.rotate(45, 1.0, 0.0, 0.0);
	leftEar.matrix.scale(0.05, 0.1, 0.1);
	leftEar.matrix.multiply(base);
	leftEar.render();

	const rightEar = new Cube(0xffc080);
	rightEar.matrix.scale(1.0, 1.5, 1.0);
	rightEar.matrix.translate(0.1, 0.05, 0.1);
	rightEar.matrix.multiply(headBase);
	rightEar.matrix.rotate(45, 1.0, 0.0, 0.0);
	rightEar.matrix.scale(0.05, 0.1, 0.1);
	rightEar.matrix.multiply(base);
	rightEar.render();

	const legFL = new Cube(0xc06000);
	legFL.matrix.translate(0.25, -0.35, 0.1);
	legFL.matrix.translate(0.0, 0.15, 0.0);
	legFL.matrix.rotate(legFLAngle, 0.0, 0.0, 1.0);
	legFL.matrix.translate(0.0, -0.15, 0.0);
	const legFLMatrix = new Matrix4(legFL.matrix);
	legFL.matrix.scale(0.1, 0.3, 0.1);
	legFL.matrix.multiply(base);
	legFL.render();

	const footFL = new Cube(0xffffff);
	footFL.matrix.multiply(legFLMatrix);
	footFL.matrix.translate(0.025, -0.175, 0.0);
	footFL.matrix.scale(0.15, 0.05, 0.1);
	footFL.matrix.multiply(base);
	footFL.render();

	const legFR = new Cube(0xc06000);
	legFR.matrix.translate(0.25, -0.35, -0.1);
	legFR.matrix.translate(0.0, 0.15, 0.0);
	legFR.matrix.rotate(legFRAngle, 0.0, 0.0, 1.0);
	legFR.matrix.translate(0.0, -0.15, 0.0);
	const legFRMatrix = new Matrix4(legFR.matrix);
	legFR.matrix.scale(0.1, 0.3, 0.1);
	legFR.matrix.multiply(base);
	legFR.render();

	const footFR = new Cube(0xffffff);
	footFR.matrix.multiply(legFRMatrix);
	footFR.matrix.translate(0.025, -0.175, 0.0);
	footFR.matrix.scale(0.15, 0.05, 0.1);
	footFR.matrix.multiply(base);
	footFR.render();

	const legBL = new Cube(0xc06000);
	legBL.matrix.translate(-0.25, -0.35, 0.1);
	legBL.matrix.translate(0.0, 0.15, 0.0);
	legBL.matrix.rotate(legBLAngle, 0.0, 0.0, 1.0);
	legBL.matrix.translate(0.0, -0.15, 0.0);
	const legBLMatrix = new Matrix4(legBL.matrix);
	legBL.matrix.scale(0.1, 0.3, 0.1);
	legBL.matrix.multiply(base);
	legBL.render();

	const footBL = new Cube(0xffffff);
	footBL.matrix.multiply(legBLMatrix);
	footBL.matrix.translate(0.025, -0.175, 0.0);
	footBL.matrix.scale(0.15, 0.05, 0.1);
	footBL.matrix.multiply(base);
	footBL.render();

	const legBR = new Cube(0xc06000);
	legBR.matrix.translate(-0.25, -0.35, -0.1);
	legBR.matrix.translate(0.0, 0.15, 0.0);
	legBR.matrix.rotate(legBRAngle, 0.0, 0.0, 1.0);
	legBR.matrix.translate(0.0, -0.15, 0.0);
	const legBRMatrix = new Matrix4(legBR.matrix);
	legBR.matrix.scale(0.1, 0.3, 0.1);
	legBR.matrix.multiply(base);
	legBR.render();

	const footBR = new Cube(0xffffff);
	footBR.matrix.multiply(legBRMatrix);
	footBR.matrix.translate(0.025, -0.175, 0.0);
	footBR.matrix.scale(0.15, 0.05, 0.1);
	footBR.matrix.multiply(base);
	footBR.render();
}
