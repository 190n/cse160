class Camera {
	constructor(fov, eye, at, up) {
		this.fov = fov;
		this.eye = eye;
		this.at = at;
		this.up = up;
		this.viewMatrix = new Matrix4();
		this.projectionMatrix = new Matrix4();
		this.updateMatrices();
	}

	updateMatrices() {
		this.viewMatrix.setLookAt(...this.eye.elements, ...this.at.elements, ...this.up.elements);
		this.projectionMatrix.setPerspective(this.fov, canvas.width / canvas.height, 0.1, 1000);
	}

	move(towards, amount) {
		towards.normalize();
		towards.mul(amount);
		this.eye.add(towards);
		this.at.add(towards);
	}

	moveForward(amount) {
		const f = new Vector3(this.at.elements).sub(this.eye);
		this.move(f, amount);
	}

	moveBackward(amount) {
		const f = new Vector3(this.eye.elements).sub(this.at);
		this.move(f, amount);
	}

	moveLeft(amount) {
		const f = new Vector3(this.at.elements).sub(this.eye);
		const s = Vector3.cross(this.up, f);
		this.move(s, amount);
	}

	moveRight(amount) {
		const f = new Vector3(this.at.elements).sub(this.eye);
		const s = Vector3.cross(f, this.up);
		this.move(s, amount);
	}

	panLeft(alpha) {
		const f = new Vector3(this.at.elements).sub(this.eye);
		const rot = new Matrix4().setRotate(alpha, ...this.up.elements);
		const fPrime = rot.multiplyVector3(f);
		this.at.set(this.eye).add(fPrime);
	}

	panRight(alpha) {
		this.panLeft(-alpha);
	}

	panUp(alpha) {
		const f = new Vector3(this.at.elements).sub(this.eye);
		const alignment = Vector3.dot(f, this.up);
		if ((alpha > 0 && alignment > 0.99) || (alpha < 0 && alignment < -0.99)) {
			return;
		}
		const s = Vector3.cross(f, this.up);
		const rot = new Matrix4().setRotate(alpha, ...s.elements);
		const fPrime = rot.multiplyVector3(f);
		this.at.set(this.eye).add(fPrime);
	}
}
