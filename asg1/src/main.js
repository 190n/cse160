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

let shapeMode = 'squares';

function main() {
	// Retrieve <canvas> element
	const canvas = document.getElementById('webgl');
	const gl = setUpWebGL(canvas);
	if (gl === null) {
		return;
	}
	const [a_Position, a_Size, u_FragColor] = connectVariablesToGLSL(gl);
	if (!initVertexBuffers(gl, a_Position)) {
		return;
	}
	handleClicks(canvas, gl, a_Size, u_FragColor);
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

function initVertexBuffers(gl, a_Position) {
	// Create a buffer object
	const vertexBuffer = gl.createBuffer();
	if (!vertexBuffer) {
		console.log('Failed to create the buffer object');
		return false;
	}

	// Bind the buffer object to target
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	// Write date into the buffer object
	// gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

	// Assign the buffer object to a_Position variable
	gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);

	// Enable the assignment to a_Position variable
	gl.enableVertexAttribArray(a_Position);
	return true;
}

function handleClicks(canvas, gl, a_Size, u_FragColor) {
	// Register function (event handler) to be called on a mouse press
	canvas.onmousedown = (ev) => click(ev, gl, canvas, a_Size, u_FragColor);
	canvas.onmousemove = (ev) => {
		if (ev.buttons == 1) {
			click(ev, gl, canvas, a_Size, u_FragColor);
		}
	};

	document.getElementById('clear').onclick = () => clearCanvas(gl, a_Size, u_FragColor);
	document.getElementById('draw').onclick = () => {
		points.splice(0);
		points.push(...drawing);
		renderAllShapes(gl, a_Size, u_FragColor);
	};

	document.getElementById('mode-squares').onclick = () => shapeMode = 'squares';
	document.getElementById('mode-triangles').onclick = () => shapeMode = 'triangles';
	document.getElementById('mode-circles').onclick = () => shapeMode = 'circles';
};

function clearCanvas(gl, a_Size, u_FragColor) {
	points.splice(0);
	renderAllShapes(gl, a_Size, u_FragColor);
}

const drawing = [
	Triangle.fromVertices([0, 3/8, 0, 6/8, 3/8, 3/8], [0.8, 0.45, 0.1, 1.0]),
	Triangle.fromVertices([3/8, 3/8, 6/8, 6/8, 6/8, 3/8], [0.8, 0.45, 0.1, 1.0]),
	Triangle.fromVertices([0, 3/8, 6/8, 3/8, 3/8, -1/8], [0.8, 0.45, 0.1, 1.0]),
	Triangle.fromVertices([0, 3/8, 3/8, -1/8, 0, 0], [0.8, 0.45, 0.1, 1.0]),
	Triangle.fromVertices([6/8, 3/8, 6/8, 0, 3/8, -1/8], [0.8, 0.45, 0.1, 1.0]),

	Triangle.fromVertices([4/16, 3/16, 4/16, 4/16, 3/16, 3/16], [0.05, 0.3, 0.1, 1.0]),
	Triangle.fromVertices([8/16, 3/16, 8/16, 4/16, 9/16, 3/16], [0.05, 0.3, 0.1, 1.0]),

	Triangle.fromVertices([6/16, 0, 5/16, 1/16, 7/16, 1/16], [0.3, 0.15, 0, 1.0]),

	Triangle.fromVertices([3/16, -1/16, -4/16, -12/16, 6/16, -2/16], [0.6, 0.4, 0.2, 1.0]),
	Triangle.fromVertices([6/16, -2/16, 4/16, -12/16, -4/16, -12/16], [0.6, 0.4, 0.2, 1.0]),
	Triangle.fromVertices([6/16, -2/16, 9/16, -1/16, 6/16, -8/16], [0.6, 0.4, 0.2, 1.0]),
	Triangle.fromVertices([6/16, -2/16, 6/16, -12/16, 4/16, -12/16], [0.6, 0.4, 0.2, 1.0]),
	Triangle.fromVertices([-8/32, -24/32, -16/32, -22/32, -13/32, -21/32], [0.6, 0.4, 0.2, 1.0]),
	Triangle.fromVertices([-13/32, -21/32, -16/32, -8/32, -16/32, -22/32], [0.6, 0.4, 0.2, 1.0]),

	Triangle.fromVertices([6/16, -12/16, 7/16, -12/16, 6/16, -11/16], [1.0, 1.0, 1.0, 1.0]),
	Triangle.fromVertices([2/16, 0, -4/16, -1/16, -4/16, -2/16], [1.0, 1.0, 1.0, 1.0]),
	Triangle.fromVertices([10/16, 0, 1, -1/16, 1, -2/16], [1.0, 1.0, 1.0, 1.0]),
];

const points = [];

function click(ev, gl, canvas, a_Size, u_FragColor) {
	let x = ev.clientX; // x coordinate of a mouse pointer
	let y = ev.clientY; // y coordinate of a mouse pointer
	const rect = ev.target.getBoundingClientRect();

	x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
	y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

	const size = parseFloat(document.getElementById('size').value);

	const red = parseFloat(document.getElementById('red').value);
	const green = parseFloat(document.getElementById('green').value);
	const blue = parseFloat(document.getElementById('blue').value);

	switch (shapeMode) {
		case 'squares':
			points.push(new Point(x, y, size, [red, green, blue, 1.0]));
			break;
		case 'triangles':
			points.push(new Triangle(x, y, size / canvas.width, [red, green, blue, 1.0]));
			break;
		case 'circles':
			const segments = parseInt(document.getElementById('segments').value);
			points.push(new Circle(x, y, size / canvas.width, [red, green, blue, 1.0], segments));
			break;
	}

	renderAllShapes(gl, a_Size, u_FragColor);
}

function renderAllShapes(gl, a_Size, u_FragColor) {
	// Clear <canvas>
	gl.clear(gl.COLOR_BUFFER_BIT);

	for (const p of points) {
		p.render(gl, a_Size, u_FragColor);
	}
}
