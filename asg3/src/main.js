// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
const VSHADER_SOURCE = `
precision mediump float;
attribute vec4 a_Position;
attribute vec2 a_UV;
varying vec2 v_UV;
uniform mat4 u_ModelMatrix;
uniform mat4 u_ViewMatrix;
uniform mat4 u_ProjectionMatrix;

void main() {
	v_UV = a_UV;
	vec4 pos = u_ProjectionMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;
	gl_Position = pos;
}
`;

const TEX_UNIFORM_COLOR = 1;
const TEX_UV = 2;
const TEX_0 = 3;
const TEX_1 = 4;
const TEX_2 = 5;

// Fragment shader program
const FSHADER_SOURCE = `
precision mediump float;
varying vec2 v_UV;
uniform sampler2D u_Sampler0;
uniform sampler2D u_Sampler1;
uniform sampler2D u_Sampler2;
uniform int u_WhichTexture;
uniform vec4 u_FragColor;

void main() {
	if (u_WhichTexture == ${TEX_UNIFORM_COLOR}) {
		gl_FragColor = u_FragColor;
	} else if (u_WhichTexture == ${TEX_UV}) {
		gl_FragColor = vec4(v_UV, 1.0, 1.0);
	} else if (u_WhichTexture == ${TEX_0}) {
		gl_FragColor = texture2D(u_Sampler0, v_UV);
	} else if (u_WhichTexture == ${TEX_1}) {
		gl_FragColor = texture2D(u_Sampler1, v_UV);
	} else if (u_WhichTexture == ${TEX_2}) {
		gl_FragColor = texture2D(u_Sampler2, v_UV);
	} else {
		gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0);
	}
}
`;

let canvas, gl, a_Position, a_UV, u_ModelMatrix, u_FragColor, u_Sampler0, u_Sampler1, u_Sampler2;

let fpsEstimate = -1;

let camera;

let legBLAngle, legFLAngle, legBRAngle, legFRAngle;

function main() {
	// Retrieve <canvas> element
	canvas = document.getElementById('webgl');
	camera = new Camera(60, new Vector3([12, 0.5, 5]), new Vector3([11, 0.5, 5]), new Vector3([0, 1, 0]));
	camera.moveBackward(1);
	camera.updateMatrices();
	gl = setUpWebGL();
	if (gl === null) {
		return;
	}
	connectVariablesToGLSL();
	initTextures();
	handleClicks();
	handleKeys();
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

	[u_ModelMatrix, u_Sampler0, u_Sampler1, u_Sampler2, u_FragColor, u_WhichTexture, u_ViewMatrix, u_ProjectionMatrix] =
		['u_ModelMatrix', 'u_Sampler0', 'u_Sampler1', 'u_Sampler2', 'u_FragColor', 'u_WhichTexture', 'u_ViewMatrix', 'u_ProjectionMatrix'].map(name => {
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
	image0.onload = () => loadTexture(texture0, u_Sampler0, image0, 0);
	image0.src = 'stonebrick.png';

	const texture1 = gl.createTexture();
	const image1 = new Image();
	image1.onload = () => loadTexture(texture1, u_Sampler1, image1, 1);
	image1.src = 'sky.png';

	const texture2 = gl.createTexture();
	const image2 = new Image();
	image2.onload = () => loadTexture(texture2, u_Sampler2, image2, 2);
	image2.src = 'dirt.png';
}

function loadTexture(texture, u_Sampler, image, slot) {
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
	gl.activeTexture([gl.TEXTURE0, gl.TEXTURE1, gl.TEXTURE2][slot]);
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
	gl.uniform1i(u_Sampler, slot);
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

				camera.panLeft(dx / 8);
				camera.panUp(dy / 8);
			}
		}
	};

	canvas.onmouseup = canvas.onmouseleave = () => {
		lastX = undefined;
		lastY = undefined;
	};

	document.getElementById('add').onclick = () => {
		const x = Math.round(camera.at.elements[0]);
		const z = Math.round(camera.at.elements[2]);
		if (z >= 0 && z < map.length) {
			if (x >= 0 && x < map[z].length) {
				map[z][x]++;
				world = new World(map, TEX_0);
			}
		}
	};

	document.getElementById('delete').onclick = () => {
		const x = Math.round(camera.at.elements[0]);
		const z = Math.round(camera.at.elements[2]);
		if (z >= 0 && z < map.length) {
			if (x >= 0 && x < map[z].length) {
				map[z][x]--;
				if (map[z][x] < 0) map[z][x] = 0;
				world = new World(map, TEX_0);
			}
		}
	};
}

const keys = {
	w: false,
	a: false,
	s: false,
	d: false,
	q: false,
	e: false,
}

function handleKeys() {
	window.onkeydown = (e) => {
		switch (e.code) {
			case 'KeyW': keys.w = true; break;
			case 'KeyA': keys.a = true; break;
			case 'KeyS': keys.s = true; break;
			case 'KeyD': keys.d = true; break;
			case 'KeyQ': keys.q = true; break;
			case 'KeyE': keys.e = true; break;
		}
	};

	window.onkeyup = (e) => {
		switch (e.code) {
			case 'KeyW': keys.w = false; break;
			case 'KeyA': keys.a = false; break;
			case 'KeyS': keys.s = false; break;
			case 'KeyD': keys.d = false; break;
			case 'KeyQ': keys.q = false; break;
			case 'KeyE': keys.e = false; break;
		}
	};
}

function updateAnimationAngles(time) {
	legBLAngle = Math.sin(Math.PI * (time + 0)) * 15;
	legFLAngle = Math.sin(Math.PI * (time + 0.5)) * 15;
	legBRAngle = Math.sin(Math.PI * (time + 1)) * 15;
	legFRAngle = Math.sin(Math.PI * (time + 1.5)) * 15;
}

let lastTick = 0;

function tick(ms) {
	const before = performance.now();
	updateAnimationAngles(ms / 1000);
	moveCamera(ms - lastTick);
	renderAllShapes();
	const elapsed = performance.now() - before;
	const fps = 1000.0 / elapsed;

	if (fpsEstimate < 0) {
		fpsEstimate = fps;
	} else {
		fpsEstimate = 0.99 * fpsEstimate + 0.01 * fps;
	}
	document.getElementById('fps').textContent = Math.floor(fpsEstimate).toString();
	lastTick = ms;
	requestAnimationFrame(tick);
}

function moveCamera(delta) {
	const speed = 1 / 500;
	if (keys.w) {
		camera.moveForward(delta * speed);
	}
	if (keys.s) {
		camera.moveBackward(delta * speed);
	}
	if (keys.a) {
		camera.moveLeft(delta * speed);
	}
	if (keys.d) {
		camera.moveRight(delta * speed);
	}
	if (keys.q) {
		camera.panLeft(delta / 5);
	}
	if (keys.e) {
		camera.panRight(delta / 5);
	}
	camera.updateMatrices();
}

const map = [[0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,1,0],[0,0,1,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,2,0,0,0,0,0,0,2,0,0,0,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0],[1,0,0,0,3,0,2,0,0,1,2,0,0,0,0,0,0,1,0,0,0,0,0,0,0,2,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,1,1,0,0,0,0,1,0,0,0,0,0,0,0,3,0],[0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,2,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,1,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,2,0,0,0,0,0,0,0,0,1,0,0,1,1,0,0,0,1,0,0,0,0,0,4,0,0,0],[0,0,0,0,0,0,0,0,0,0,2,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,2,0],[0,0,0,0,0,0,0,1,1,2,0,1,0,0,0,0,0,1,0,0,0,2,0,0,1,0,0,0,0,0,0,1],[0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,2,0,1,0,0,0,0],[0,0,0,0,0,0,1,0,0,1,1,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,1,0],[0,0,0,0,0,0,0,0,0,0,0,1,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,3,0,0],[0,0,0,0,0,1,0,0,0,1,0,1,0,0,1,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,0,0,0,1,0,0,0,0,0,0,0],[0,2,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,2,0,0,0,0,0,1,0],[0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0],[0,4,0,1,1,0,0,1,2,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,1,0],[0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,2,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0],[0,0,0,1,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0],[0,0,0,0,0,2,0,0,0,0,0,0,0,0,1,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],[1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0],[0,0,0,0,0,0,0,0,2,0,1,0,1,0,0,0,0,0,1,0,1,0,1,0,0,2,0,0,0,0,1,0],[0,0,0,0,2,0,0,0,1,0,0,0,0,2,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,2],[0,0,0,0,0,0,0,0,4,0,0,0,0,1,0,0,0,0,0,2,0,0,0,0,0,0,4,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0],[0,2,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,2,0,0,0,4,2,0,0,0,0,0,1,1,0,0],[0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,2,0,0,2,0,1,0,0,0,0,0],[0,0,0,0,0,1,1,0,0,3,1,0,0,0,1,0,0,0,2,0,0,0,1,0,3,0,0,0,0,0,0,0]];
let world = new World(map, TEX_0);

function renderAllShapes() {
	// Clear <canvas>
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	gl.uniformMatrix4fv(u_ProjectionMatrix, false, camera.projectionMatrix.elements);
	gl.uniformMatrix4fv(u_ViewMatrix, false, camera.viewMatrix.elements);

	const ground = new Cube(TEX_2);
	ground.matrix.scale(50.0, 0.1, 50.0);
	ground.matrix.translate(-0.5, -1, -0.5);
	ground.render();

	const box1 = new Cube(TEX_UNIFORM_COLOR, 0x000ff);
	box1.matrix.translate(9, 0, 6);
	box1.matrix.scale(0.7, 0.7, 0.7);
	box1.render();

	const box2 = new Cube(TEX_UNIFORM_COLOR, 0xff8080);
	box2.matrix.translate(9, 0.7, 6);
	box2.matrix.rotate(30, 0, 1, 0);
	box2.matrix.scale(0.5, 0.5, 0.5);
	box2.render();

	const sky = new Cube(TEX_1);
	sky.matrix.scale(100.0, 100.0, 100.0);
	sky.matrix.translate(-0.5, -0.5, -0.5);
	sky.render();

	world.render();

	const base = new Matrix4().translate(-0.5, -0.5, -0.5);

	const body = new Cube(TEX_UNIFORM_COLOR, 0xff8000);
	body.matrix.scale(0.8, 0.5, 0.5);
	body.matrix.multiply(base);
	body.render();

	const head = new Cube(TEX_UNIFORM_COLOR, 0xff8000);
	head.matrix.setTranslate(0.5, 0.25, 0.0);
	const headBase = new Matrix4(head.matrix);
	head.matrix.scale(0.4, 0.4, 0.4);
	head.matrix.multiply(base);
	head.render();

	const leftEye = new Cube(TEX_UNIFORM_COLOR, 0x404040);
	leftEye.matrix.translate(0.11, 0.0, -0.15);
	leftEye.matrix.multiply(headBase);
	leftEye.matrix.scale(0.1, 0.1, 0.1);
	leftEye.render();

	const rightEye = new Cube(TEX_UNIFORM_COLOR, 0x404040);
	rightEye.matrix.translate(0.11, 0.0, 0.05);
	rightEye.matrix.multiply(headBase);
	rightEye.matrix.scale(0.1, 0.1, 0.1);
	rightEye.render();

	const nose = new Cube(TEX_UNIFORM_COLOR, 0xff8080);
	nose.matrix.translate(0.2, -0.1, -0.05);
	nose.matrix.multiply(headBase);
	nose.matrix.scale(0.05, 0.05, 0.05);
	nose.matrix.rotate(45, 1.0, 0.0, 0.0);
	nose.render();

	const leftEar = new Cube(TEX_UNIFORM_COLOR, 0xffc080);
	leftEar.matrix.scale(1.0, 1.5, 1.0);
	leftEar.matrix.translate(0.1, 0.05, -0.1);
	leftEar.matrix.multiply(headBase);
	leftEar.matrix.rotate(45, 1.0, 0.0, 0.0);
	leftEar.matrix.scale(0.05, 0.1, 0.1);
	leftEar.matrix.multiply(base);
	leftEar.render();

	const rightEar = new Cube(TEX_UNIFORM_COLOR, 0xffc080);
	rightEar.matrix.scale(1.0, 1.5, 1.0);
	rightEar.matrix.translate(0.1, 0.05, 0.1);
	rightEar.matrix.multiply(headBase);
	rightEar.matrix.rotate(45, 1.0, 0.0, 0.0);
	rightEar.matrix.scale(0.05, 0.1, 0.1);
	rightEar.matrix.multiply(base);
	rightEar.render();

	// const tail1 = new Cylinder(0xffc080, 8);
	// tail1.matrix.translate(-0.4, 0.1, 0.0);
	// tail1.matrix.translate(0.0, -0.15, 0.0);
	// tail1.matrix.rotate(tail1Angle, 0.0, 0.0, 1.0);
	// tail1.matrix.translate(0.0, 0.15, 0.0);
	// const tail1Matrix = new Matrix4(tail1.matrix);
	// tail1.matrix.scale(0.08, 0.3, 0.08);
	// tail1.render();

	// const tail2 = new Cylinder(0xffc080, 8);
	// tail2.matrix.multiply(tail1Matrix);
	// tail2.matrix.translate(0.0, 0.15, 0.0);
	// tail2.matrix.rotate(tail2Angle, 0.0, 0.0, 1.0);
	// tail2.matrix.translate(0.0, 0.15, 0.0);
	// const tail2Matrix = new Matrix4(tail2.matrix);
	// tail2.matrix.scale(0.08, 0.3, 0.08);
	// tail2.render();

	// const tail3 = new Cylinder(0xffc080, 8);
	// tail3.matrix.multiply(tail2Matrix);
	// tail3.matrix.translate(0.0, 0.15, 0.0);
	// tail3.matrix.rotate(tail3Angle, 0.0, 0.0, 1.0);
	// tail3.matrix.translate(0.0, 0.15, 0.0);
	// tail3.matrix.scale(0.08, 0.3, 0.08);
	// tail3.render();

	const legFL = new Cube(TEX_UNIFORM_COLOR, 0xc06000);
	legFL.matrix.translate(0.25, -0.35, 0.1);
	legFL.matrix.translate(0.0, 0.15, 0.0);
	legFL.matrix.rotate(legFLAngle, 0.0, 0.0, 1.0);
	legFL.matrix.translate(0.0, -0.15, 0.0);
	const legFLMatrix = new Matrix4(legFL.matrix);
	legFL.matrix.scale(0.1, 0.3, 0.1);
	legFL.matrix.multiply(base);
	legFL.render();

	const footFL = new Cube(TEX_UNIFORM_COLOR, 0xffffff);
	footFL.matrix.multiply(legFLMatrix);
	footFL.matrix.translate(0.025, -0.175, 0.0);
	footFL.matrix.scale(0.15, 0.05, 0.1);
	footFL.matrix.multiply(base);
	footFL.render();

	const legFR = new Cube(TEX_UNIFORM_COLOR, 0xc06000);
	legFR.matrix.translate(0.25, -0.35, -0.1);
	legFR.matrix.translate(0.0, 0.15, 0.0);
	legFR.matrix.rotate(legFRAngle, 0.0, 0.0, 1.0);
	legFR.matrix.translate(0.0, -0.15, 0.0);
	const legFRMatrix = new Matrix4(legFR.matrix);
	legFR.matrix.scale(0.1, 0.3, 0.1);
	legFR.matrix.multiply(base);
	legFR.render();

	const footFR = new Cube(TEX_UNIFORM_COLOR, 0xffffff);
	footFR.matrix.multiply(legFRMatrix);
	footFR.matrix.translate(0.025, -0.175, 0.0);
	footFR.matrix.scale(0.15, 0.05, 0.1);
	footFR.matrix.multiply(base);
	footFR.render();

	const legBL = new Cube(TEX_UNIFORM_COLOR, 0xc06000);
	legBL.matrix.translate(-0.25, -0.35, 0.1);
	legBL.matrix.translate(0.0, 0.15, 0.0);
	legBL.matrix.rotate(legBLAngle, 0.0, 0.0, 1.0);
	legBL.matrix.translate(0.0, -0.15, 0.0);
	const legBLMatrix = new Matrix4(legBL.matrix);
	legBL.matrix.scale(0.1, 0.3, 0.1);
	legBL.matrix.multiply(base);
	legBL.render();

	const footBL = new Cube(TEX_UNIFORM_COLOR, 0xffffff);
	footBL.matrix.multiply(legBLMatrix);
	footBL.matrix.translate(0.025, -0.175, 0.0);
	footBL.matrix.scale(0.15, 0.05, 0.1);
	footBL.matrix.multiply(base);
	footBL.render();

	const legBR = new Cube(TEX_UNIFORM_COLOR, 0xc06000);
	legBR.matrix.translate(-0.25, -0.35, -0.1);
	legBR.matrix.translate(0.0, 0.15, 0.0);
	legBR.matrix.rotate(legBRAngle, 0.0, 0.0, 1.0);
	legBR.matrix.translate(0.0, -0.15, 0.0);
	const legBRMatrix = new Matrix4(legBR.matrix);
	legBR.matrix.scale(0.1, 0.3, 0.1);
	legBR.matrix.multiply(base);
	legBR.render();

	const footBR = new Cube(TEX_UNIFORM_COLOR, 0xffffff);
	footBR.matrix.multiply(legBRMatrix);
	footBR.matrix.translate(0.025, -0.175, 0.0);
	footBR.matrix.scale(0.15, 0.05, 0.1);
	footBR.matrix.multiply(base);
	footBR.render();

}
