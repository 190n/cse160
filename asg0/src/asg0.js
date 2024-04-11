const canvas = document.getElementById('example');
if (!canvas) {
	console.log('Failed to retrieve the <canvas> element');
}

const ctx = canvas.getContext('2d');

function angleBetween(v1, v2) {
	const radians = Math.acos(Vector3.dot(v1, v2) / (v1.magnitude() * v2.magnitude()));
	return radians * 180 / Math.PI;
}

function drawVector(v, color) {
	ctx.strokeStyle = color;
	ctx.beginPath();
	ctx.moveTo(200, 200);
	ctx.lineTo(
		200 + 20 * v.elements[0],
		200 - 20 * v.elements[1],
	);
	ctx.closePath();
	ctx.stroke();
}


function handleDrawEvent() {
	const v1x = parseFloat(document.getElementById('v1x').value);
	const v1y = parseFloat(document.getElementById('v1y').value);
	const v1 = new Vector3([v1x, v1y, 0]);

	const v2x = parseFloat(document.getElementById('v2x').value);
	const v2y = parseFloat(document.getElementById('v2y').value);
	const v2 = new Vector3([v2x, v2y, 0]);

	ctx.fillStyle = 'black';
	ctx.fillRect(0, 0, 400, 400);
	drawVector(v1, 'red');
	drawVector(v2, 'blue');

	return [v1, v2];
}

function handleDrawOperationEvent() {
	const [v1, v2] = handleDrawEvent();
	const operation = document.getElementById('operation').value;
	const scalar = parseFloat(document.getElementById('scalar').value);
	let v3;

	switch (operation) {
		case 'add':
			drawVector(v1.add(v2), 'green');
			break;
		case 'sub':
			drawVector(v1.sub(v2), 'green');
			break;
		case 'mul':
			v3 = new Vector3;
			v3.set(v1).mul(scalar);
			drawVector(v3, 'green');
			v3.set(v2).mul(scalar);
			drawVector(v3, 'green');
			break;
		case 'div':
			v3 = new Vector3;
			v3.set(v1).div(scalar);
			drawVector(v3, 'green');
			v3.set(v2).div(scalar);
			drawVector(v3, 'green');
			break;
		case 'angle':
			console.log(`Angle: ${angleBetween(v1, v2)}`);
			break;
		case 'area':
			console.log(`Area of the triangle: ${Vector3.cross(v1, v2).magnitude() / 2}`);
			break;
		case 'mag':
			console.log(`Magnitude v1: ${v1.magnitude()}`);
			console.log(`Magnitude v2: ${v2.magnitude()}`);
			break;
		case 'norm':
			drawVector(v1.normalize(), 'green');
			drawVector(v2.normalize(), 'green');
			break;
	}
}

ctx.fillStyle = 'black';
ctx.fillRect(0, 0, 400, 400);

function drawVector(v, color) {
	ctx.strokeStyle = color;
	ctx.beginPath();
	ctx.moveTo(200, 200);
	ctx.lineTo(
		200 + 20 * v.elements[0],
		200 - 20 * v.elements[1],
	);
	ctx.closePath();
	ctx.stroke();
}

const v1 = new Vector3([2.25, 2.25, 0]);
drawVector(v1, 'red');
