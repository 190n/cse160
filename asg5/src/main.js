import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const continueButton = document.getElementById('continue');
const text = document.getElementById('text');
const canvas = document.getElementById('canvas');
const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
renderer.shadowMap.enabled = true;

const fov = 75;
const aspect = 2;
const near = 0.1;
const far = 20000;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
const controls = new OrbitControls(camera, renderer.domElement);
camera.position.z = 20;
camera.position.y = 10;
controls.update();

const scene = new THREE.Scene();

const bookColors = [
	0xfef536,
	0x52362b,
	0xff348d,
	0xdd212f,
	0x16b269,
	0x202020,
	0x8900c9,
	0xff8134,
	0xffffff,
	0x014ce3,
];

// Fisher-Yates shuffle algorithm from https://stackoverflow.com/a/2450976
function shuffle(array) {
	let currentIndex = array.length;

	// While there remain elements to shuffle...
	while (currentIndex != 0) {
		// Pick a remaining element...
		let randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex--;
		// And swap it with the current element.
		[array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
	}
}

shuffle(bookColors);

function getBookPosition(i) {
	return [0.45 * (i % 5) - (i >= 5 ? 1.9 : 0), (i >= 5) ? 8.9 : 11.4, 0];
}

const books = [];

function initBooks() {
	for (let i = 0; i < 10; i++) {
		const shrink = 0.2 * Math.random();
		const bookGeometry = new THREE.BoxGeometry(0.35, 1.8 - shrink, 1.2);
		const material = new THREE.MeshPhongMaterial({ color: bookColors[i] });
		const book = new THREE.Mesh(bookGeometry, material);
		const [x, y, z] = getBookPosition(i);
		book.position.set(x, y - shrink / 2, z);
		book.castShadow = true;
		book.receiveShadow = true;
		scene.add(book);
		books.push(book);
	}	
}

initBooks();

const floorGeometry = new THREE.BoxGeometry(30, 0.1, 30);
const floorMaterial = new THREE.MeshPhongMaterial({ color: 0x802020 });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.receiveShadow = true;
scene.add(floor);

const promises = [];

const texLoader = new THREE.TextureLoader();
let sphere = null;
promises.push(new Promise((resolve) => {
	texLoader.load('textures/earthmap.jpg', (texture) => {
		texture.colorSpace = THREE.SRGBColorSpace;
		const sphereGeometry = new THREE.SphereGeometry(0.8, 48, 24);
		const sphereMaterial = new THREE.MeshPhongMaterial({ map: texture });
		sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
		sphere.position.set(-1, 6.5, 0);
		sphere.castShadow = true;
		sphere.receiveShadow = true;
		scene.add(sphere);
		resolve();
	});
}));

const indicators = [];
let checkMaterial = null;
let xMaterial = null;

const checkTexturePromise = new Promise((resolve) => {
	texLoader.load('textures/check.png', (texture) => {
		texture.colorSpace = THREE.SRGBColorSpace;
		resolve(texture);
	});
});

const xTexturePromise = new Promise((resolve) => {
	texLoader.load('textures/x.png', (texture) => {
		texture.colorSpace = THREE.SRGBColorSpace;
		resolve(texture);
	});
});

promises.push((async () => {
	const indicatorGeometry = new THREE.PlaneGeometry(0.5, 0.5);
	const [checkTexture, xTexture] = await Promise.all([checkTexturePromise, xTexturePromise]);

	checkMaterial = new THREE.MeshPhongMaterial({ map: checkTexture, transparent: true });
	xMaterial = new THREE.MeshPhongMaterial({ map: xTexture, transparent: true });

	for (let i = 0; i < 10; i++) {
		const indicator = new THREE.Mesh(indicatorGeometry, checkMaterial);
		const [x, y, z] = getBookPosition(i);
		indicator.position.set(x, y - 0.6, z + 0.9);
		indicators.push(indicator);
	}
})());

// from three.js skybox example: https://threejs.org/examples/webgl_panorama_equirectangular.html
promises.push(new Promise((resolve) => {
	texLoader.load('textures/chapel_day_2k.jpg', (sky) => {
		sky.colorSpace = THREE.SRGBColorSpace;
		const skyGeometry = new THREE.SphereGeometry(10000, 32, 16);
		skyGeometry.scale(-1, 1, 1);
		const material = new THREE.MeshBasicMaterial({ map: sky });
		const skySphere = new THREE.Mesh(skyGeometry, material);
		skySphere.rotation.y = -Math.PI / 4;
		scene.add(skySphere);
		resolve();
	});
}));

const lights = [
	{ color: 0xff00ff, intensity: 1, pos: [0, 8, 32] },
	{ color: 0xffffff, intensity: 2, pos: [-32, 8, 16] },
	{ color: 0xffff80, intensity: 2, pos: [32, 8, 16] },
];

for (const { color, intensity, pos } of lights) {
	const light = new THREE.DirectionalLight(color, intensity);
	light.position.set(...pos);
	light.castShadow = true;
	light.shadow.camera.left = -15;
	light.shadow.camera.right = 15;
	light.shadow.camera.bottom = -15;
	light.shadow.camera.top = 15;
	light.shadow.mapSize.width = light.shadow.mapSize.height = 2048;
	light.shadow.camera.updateProjectionMatrix();
	scene.add(light);
	// const cameraHelper = new THREE.CameraHelper(light.shadow.camera);
	// scene.add(cameraHelper);
}

const ambient = new THREE.AmbientLight(0x808080);
scene.add(ambient);

const objLoader = new OBJLoader();
const mtlLoader = new MTLLoader();
// bookshelf model from https://free3d.com/3d-model/bookshelf-778335.html
promises.push(new Promise((resolve) => {
	mtlLoader.load('objects/bookshelf/bookshelf.mtl', (mtl) => {
		mtl.preload();
		objLoader.setMaterials(mtl);
		objLoader.load('objects/bookshelf/bookshelf.obj', (bookshelf) => {
			bookshelf.traverseVisible(o => {
				o.castShadow = true;
				o.receiveShadow = true;
			})
			scene.add(bookshelf);
			resolve();
		});
	});
}));

// Kitty by Corentin Fatus [CC-BY] (https://creativecommons.org/licenses/by/3.0/) via Poly Pizza (https://poly.pizza/m/axMUjC7xwSa)
promises.push(new Promise((resolve) => {
	const gltfLoader = new GLTFLoader();
	gltfLoader.load('objects/Kitty.glb', (gltf) => {
		const root = gltf.scene;
		root.scale.set(4, 4, 4);
		root.rotation.y = Math.PI * 1.2;
		root.position.set(-1, 11.15, 0);
		root.traverseVisible(o => {
			o.castShadow = true;
			o.receiveShadow = true;
		})
		scene.add(root);
		resolve();
	});
}));

// from three.js example https://threejs.org/manual/#en/responsive
function resizeRendererToDisplaySize(renderer) {
	const canvas = renderer.domElement;
	const width = canvas.clientWidth;
	const height = canvas.clientHeight;
	const needResize = canvas.width !== width || canvas.height !== height;
	if (needResize) {
		renderer.setSize(width, height, false);
	}
	return needResize;
}

function render(time) {
	time /= 1000;

	if (resizeRendererToDisplaySize(renderer)) {
		const canvas = renderer.domElement;
		camera.aspect = canvas.clientWidth / canvas.clientHeight;
		camera.updateProjectionMatrix();
	}

	if (sphere) {
		sphere.rotation.y = time;
	}
	renderer.render(scene, camera);
	requestAnimationFrame(render);
}

Promise.all(promises).then(() => {
	document.getElementById('loader').style.display = 'none';
	canvas.style.display = 'block';
	requestAnimationFrame(render);
});

const STATE_INIT = 0;
const STATE_SCATTERED = 1;
const STATE_PICKUP = 2;
const STATE_RESULTS = 3;
const STATE_AGAIN = 4;

let state = STATE_INIT;

const placeholders = [];

continueButton.onclick = () => {
	state++;
	switch (state) {
		case STATE_SCATTERED:
			const validNewPositions = [];
			for (let x = -14; x <= 14; x++) {
				for (let z = 2; z <= 14; z++) {
					if (Math.sqrt(x ** 2 + z ** 2) > 15) {
						continue;
					}
					validNewPositions.push([x, z]);
				}
			}
			shuffle(validNewPositions);

			text.innerHTML = 'Oh no, the cat knocked them over!<br>Can you put them all back in the right place?';

			for (let i = 0; i < books.length; i++) {
				const book = books[i];
				let [x, z] = validNewPositions.pop();
				
				let didIntersect = true;
				while (didIntersect) {
					didIntersect = false;
					// check previous books
					for (let j = 0; j < i; j++) {
						const target = books[j];
						if (target.position.distanceTo(new THREE.Vector3(x, 0.05 + 0.175, z)) < 1.8) {
							didIntersect = true;
							break;
						}
					}
					if (didIntersect) {
						[x, z] = validNewPositions.pop();
					}
				}

				book.rotation.z = Math.PI / 2;
				book.rotation.y = Math.random() * Math.PI * 2;
				book.position.set(x, 0.05 + 0.175, z);
			}

			break;
		case STATE_PICKUP:
			text.innerHTML = 'Click on a book and then click on the right place in the shelf.';
			continueButton.style.display = 'none';

			const bookPlaceholderGeometry = new THREE.BoxGeometry(0.35, 1.7, 1.2);
			const bookPlaceholderMaterial = new THREE.MeshPhongMaterial({
				color: 0xffff00,
				opacity: 0.5,
				transparent: true,
			});
			for (let i = 0; i < 10; i++) {
				const placeholder = new THREE.Mesh(bookPlaceholderGeometry, bookPlaceholderMaterial);
				placeholder.position.set(...getBookPosition(i));
				scene.add(placeholder);
				placeholders.push(placeholder);
			}
			
			break;

		case STATE_RESULTS:
			let correct = 0;
			order.forEach((o, i) => {
				if (o == i) {
					correct++;
				}
				indicators[i].material = (o == i) ? checkMaterial : xMaterial;
				scene.add(indicators[i]);
			});
			text.textContent = `You placed ${correct} out of 10 books correctly.`;
			if (correct == 10) {
				text.textContent += ' Great job!'
			} else if (correct <= 5) {
				text.textContent += ' Better luck next time!';
			}
			continueButton.textContent = 'Play again';
			break;

		case STATE_AGAIN:
			state = STATE_INIT;

			text.innerHTML = `What a well-organized bookshelf! I sure hope nobody messes with it...<br>
				Better take a good look to remember where all the books were, just in case...`;
			continueButton.textContent = 'Continue';

			books.forEach(b => scene.remove(b));
			indicators.forEach(i => scene.remove(i));
			books.splice(0);
			initBooks();

			placeholders.splice(0);

			order.fill(-1);

			break;
	}
};

let selectedBook = -1;

const order = new Array(10).fill(-1);

canvas.onclick = (e) => {
	if (state != STATE_PICKUP) return;

	const pointer = new THREE.Vector2(
		(e.clientX / window.innerWidth) * 2 - 1,
		-(e.clientY / window.innerHeight) * 2 + 1,
	);
	const raycaster = new THREE.Raycaster();
	raycaster.setFromCamera(pointer, camera);
	let intersects = raycaster.intersectObjects(books);
	if (intersects.length > 0) {
		const clicked = intersects[0].object;
		const clickedIndex = books.indexOf(clicked);
		if (!order.includes(clickedIndex)) {
			selectedBook = books.indexOf(clicked);
			return;
		}
	}
	intersects = raycaster.intersectObjects(placeholders.filter((_, i) => order[i] < 0));
	if (intersects.length > 0 && selectedBook >= 0) {
		const clicked = intersects[0].object;
		const i = placeholders.indexOf(clicked);
		scene.remove(clicked);
		
		const book = books[selectedBook];
		const shrink = 1.8 - book.geometry.parameters.height;
		const [x, y, z] = getBookPosition(i);
		book.rotation.z = book.rotation.y = 0;
		book.position.set(x, y - shrink / 2, z);

		order[i] = selectedBook;
		selectedBook = -1;

		if (order.every(x => x >= 0)) {
			continueButton.style.display = 'inline';
		}
	}
}
