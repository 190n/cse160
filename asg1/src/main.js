// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
const VSHADER_SOURCE = `
attribute vec4 a_Position;
attribute float a_Size;

void main() {
	gl_Position = a_Position;
	gl_PointSize = a_Size;
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

function main() {
	// Retrieve <canvas> element
	const canvas = document.getElementById('webgl');
	const gl = setUpWebGL(canvas);
	if (gl === null) {
		return;
	}
	const [a_Position, a_Size, u_FragColor] = connectVariablesToGLSL(gl);
	handleClicks(canvas, gl, a_Position, a_Size, u_FragColor);
}

function setUpWebGL(canvas) {
	// Get the rendering context for WebGL
	const gl = getWebGLContext(canvas, { preserveDrawingBuffer: true });
	if (!gl) {
		console.log('Failed to get the rendering context for WebGL');
		return null;
	}

	// Initialize shaders
	if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
		console.log('Failed to intialize shaders.');
		return null;
	}

	// Specify the color for clearing <canvas>
	gl.clearColor(0.0, 0.0, 0.0, 1.0);

	// Clear <canvas>
	gl.clear(gl.COLOR_BUFFER_BIT);

	return gl;
}

function connectVariablesToGLSL(gl) {
	// Get the storage location of a_Position
	const a_Position = gl.getAttribLocation(gl.program, 'a_Position');
	if (a_Position < 0) {
		console.log('Failed to get the storage location of a_Position');
		return;
	}

	const a_Size = gl.getAttribLocation(gl.program, 'a_Size');
	if (a_Size < 0) {
		console.log('Failed to get the storage location of a_Size');
		return;
	}

	// Get the storage location of u_FragColor
	const u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
	if (!u_FragColor) {
		console.log('Failed to get the storage location of u_FragColor');
		return;
	}
	return [a_Position, a_Size, u_FragColor];
}

function handleClicks(canvas, gl, a_Position, a_Size, u_FragColor) {
	// Register function (event handler) to be called on a mouse press
	canvas.onmousedown = (ev) => click(ev, gl, canvas, a_Position, a_Size, u_FragColor);
	canvas.onmousemove = (ev) => {
		if (ev.buttons == 1) {
			click(ev, gl, canvas, a_Position, a_Size, u_FragColor);
		}
	};

	document.getElementById('clear').onclick = () => clearCanvas(gl, a_Position, a_Size, u_FragColor);
};

function clearCanvas(gl, a_Position, a_Size, u_FragColor) {
	points.splice(0);
	renderAllShapes(gl, a_Position, a_Size, u_FragColor);
}

class Point {
	constructor(x, y, size, color) {
		this.x = x;
		this.y = y;
		this.size = size;
		this.color = color;
	}

	render(gl, a_Position, a_Size, u_FragColor) {
		gl.vertexAttrib3f(a_Position, this.x, this.y, 0.0);
		gl.vertexAttrib1f(a_Size, this.size);
		gl.uniform4f(u_FragColor, ...this.color);
		gl.drawArrays(gl.POINTS, 0, 1);
	}
}

const points = [];

function click(ev, gl, canvas, a_Position, a_Size, u_FragColor) {
	let x = ev.clientX; // x coordinate of a mouse pointer
	let y = ev.clientY; // y coordinate of a mouse pointer
	const rect = ev.target.getBoundingClientRect();

	x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
	y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

	const size = parseFloat(document.getElementById('size').value);

	const red = parseFloat(document.getElementById('red').value);
	const green = parseFloat(document.getElementById('green').value);
	const blue = parseFloat(document.getElementById('blue').value);

	points.push(new Point(x, y, size, [red, green, blue, 1.0]));

	renderAllShapes(gl, a_Position, a_Size, u_FragColor);
}

function renderAllShapes(gl, a_Position, a_Size, u_FragColor) {
	// Clear <canvas>
	gl.clear(gl.COLOR_BUFFER_BIT);

	for (const p of points) {
		p.render(gl, a_Position, a_Size, u_FragColor);
	}
}
