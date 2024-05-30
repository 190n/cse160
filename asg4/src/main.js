// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
const VSHADER_SOURCE = `
precision mediump float;
attribute vec4 a_Position;
attribute vec2 a_UV;
attribute vec3 a_Normal;

varying vec2 v_UV;
varying vec3 v_Normal;
varying float v_Lighting;

uniform mat4 u_ModelMatrix;
uniform mat4 u_ViewMatrix;
uniform mat4 u_ProjectionMatrix;
uniform vec3 u_LightPos;

void main() {
	v_UV = a_UV;
	vec4 pos = u_ProjectionMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;
	gl_Position = pos;
	v_Normal = a_Normal;

	vec3 light = normalize(u_LightPos - a_Position.xyz);
	v_Lighting = dot(light, v_Normal);
}
`;

const TEX_UNIFORM_COLOR = 1;
const TEX_UV = 2;
const TEX_0 = 3;
const TEX_1 = 4;
const TEX_2 = 5;
const TEX_NORMAL = 6;

// Fragment shader program
const FSHADER_SOURCE = `
precision mediump float;

varying vec2 v_UV;
varying vec3 v_Normal;
varying float v_Lighting;

uniform sampler2D u_Sampler0;
uniform sampler2D u_Sampler1;
uniform sampler2D u_Sampler2;
uniform int u_WhichTexture;
uniform vec4 u_FragColor;
uniform vec3 u_LightPos;

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
	} else if (u_WhichTexture == ${TEX_NORMAL}) {
		// gl_FragColor = v_Lighting * vec4(v_Normal / vec3(2.0) + vec3(0.5), 1.0);
		gl_FragColor = vec4(v_Lighting, 0, 0, 1);
		// gl_FragColor = vec4(v_Normal, 1.0);
	} else {
		gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0);
	}
}
`;

let canvas, gl, a_Position, a_UV, a_Normal, u_ModelMatrix, u_FragColor, u_Sampler0, u_Sampler1, u_Sampler2;

let fpsEstimate = -1;

let camera;

let lightAngle = 0;
let lightPos = new Vector3();
let lightAnimating = true;

const lightAngleElem = document.getElementById('light-angle');
const lightAnimateElem = document.getElementById('light-animate');
lightAnimateElem.checked = true;

function main() {
	// Retrieve <canvas> element
	canvas = document.getElementById('webgl');
	camera = new Camera(60, new Vector3([2, 0.5, 3.5]), new Vector3([0, 0.5, 0]), new Vector3([0, 1, 0]));
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
	[a_Position, a_UV, a_Normal] = ['a_Position', 'a_UV', 'a_Normal'].map(name => {
		const attribute = gl.getAttribLocation(gl.program, name);
		if (attribute < 0) {
			throw new Error(`Failed to get the storage location of ${name}`);
		}
		return attribute;
	});

	[u_ModelMatrix, u_Sampler0, u_Sampler1, u_Sampler2, u_FragColor, u_WhichTexture, u_ViewMatrix, u_ProjectionMatrix, u_LightPos] =
		['u_ModelMatrix', 'u_Sampler0', 'u_Sampler1', 'u_Sampler2', 'u_FragColor', 'u_WhichTexture', 'u_ViewMatrix', 'u_ProjectionMatrix', 'u_LightPos'].map(name => {
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

	lightAngleElem.oninput = (e) => {
		lightAnimating = false;
		lightAnimateElem.checked = false;
		lightAngle = parseFloat(e.target.value) / 360 * 2 * Math.PI;
	};

	lightAnimateElem.onchange = (e) => {
		lightAnimating = e.target.checked;
	}
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
	if (lightAnimating) {
		lightAngle += time / 1000;
		lightAngle = lightAngle % (2 * Math.PI);
		lightAngleElem.value = 360 * lightAngle / 2 / Math.PI;
	}
	lightPos = new Vector3([3 * Math.cos(lightAngle), 1, 3 * Math.sin(lightAngle)]);
}

let lastTick = 0;

function tick(ms) {
	const before = performance.now();
	updateAnimationAngles(ms - lastTick);
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

function renderAllShapes() {
	// Clear <canvas>
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	gl.uniformMatrix4fv(u_ProjectionMatrix, false, camera.projectionMatrix.elements);
	gl.uniformMatrix4fv(u_ViewMatrix, false, camera.viewMatrix.elements);
	gl.uniform3f(u_LightPos, ...lightPos.elements);

	const ground = new Cube(TEX_2);
	ground.matrix.scale(50.0, 0.1, 50.0);
	ground.matrix.translate(-0.5, -1, -0.5);
	ground.render();

	const box1 = new Cube(TEX_NORMAL);
	box1.matrix.translate(-1, 0, 2);
	box1.matrix.scale(0.7, 0.7, 0.7);
	box1.render();

	const box2 = new Cube(TEX_0);
	box2.matrix.translate(-1, 0.7, 2);
	box2.matrix.rotate(30, 0, 1, 0);
	box2.matrix.scale(0.5, 0.5, 0.5);
	box2.render();

	const sky = new Cube(TEX_1);
	sky.matrix.scale(100.0, 100.0, 100.0);
	sky.matrix.translate(-0.5, -0.5, -0.5);
	sky.render();

	const sphere = new Sphere(TEX_NORMAL);
	sphere.matrix.translate(0, 2, 0);
	sphere.render();

	const lightIndicator = new Cube(TEX_UNIFORM_COLOR, 0x800000);
	lightIndicator.matrix.translate(...lightPos.elements);
	lightIndicator.matrix.scale(0.2, 0.2, 0.2);
	lightIndicator.render();
}