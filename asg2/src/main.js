// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
const VSHADER_SOURCE = `
attribute vec4 a_Position;
uniform mat4 u_ModelMatrix;
uniform mat4 u_GlobalRotateMatrix;

void main() {
	gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
}
`;

// Fragment shader program
const FSHADER_SOURCE = `
precision mediump float;
uniform vec4 u_FragColor;

void main() {
	gl_FragColor = u_FragColor;
}
`;

let canvas, gl, a_Position, u_FragColor, u_ModelMatrix, u_GlobalRotateMatrix;
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
	[a_Position, u_FragColor, u_ModelMatrix, u_GlobalRotateMatrix] = connectVariablesToGLSL();
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
	// Get the storage location of a_Position
	const a_Position = gl.getAttribLocation(gl.program, 'a_Position');
	if (a_Position < 0) {
		throw new Error('Failed to get the storage location of a_Position');
	}

	// Get the storage location of u_FragColor
	const u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
	if (!u_FragColor) {
		throw new Error('Failed to get the storage location of u_FragColor');
	}

	const u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
	if (!u_ModelMatrix) {
		throw new Error('Failed to get the storage location of u_ModelMatrix');
	}

	const u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
	if (!u_GlobalRotateMatrix) {
		throw new Error('Failed to get the storage location of u_GlobalRotateMatrix');
	}

	return [a_Position, u_FragColor, u_ModelMatrix, u_GlobalRotateMatrix];
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

	const tail1 = new Cylinder(0xffc080, 8);
	tail1.matrix.translate(-0.4, 0.1, 0.0);
	tail1.matrix.translate(0.0, -0.15, 0.0);
	tail1.matrix.rotate(tail1Angle, 0.0, 0.0, 1.0);
	tail1.matrix.translate(0.0, 0.15, 0.0);
	const tail1Matrix = new Matrix4(tail1.matrix);
	tail1.matrix.scale(0.08, 0.3, 0.08);
	tail1.render();

	const tail2 = new Cylinder(0xffc080, 8);
	tail2.matrix.multiply(tail1Matrix);
	tail2.matrix.translate(0.0, 0.15, 0.0);
	tail2.matrix.rotate(tail2Angle, 0.0, 0.0, 1.0);
	tail2.matrix.translate(0.0, 0.15, 0.0);
	const tail2Matrix = new Matrix4(tail2.matrix);
	tail2.matrix.scale(0.08, 0.3, 0.08);
	tail2.render();

	const tail3 = new Cylinder(0xffc080, 8);
	tail3.matrix.multiply(tail2Matrix);
	tail3.matrix.translate(0.0, 0.15, 0.0);
	tail3.matrix.rotate(tail3Angle, 0.0, 0.0, 1.0);
	tail3.matrix.translate(0.0, 0.15, 0.0);
	tail3.matrix.scale(0.08, 0.3, 0.08);
	tail3.render();

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
