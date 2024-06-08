import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

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
camera.position.y = 5;
controls.update();

const scene = new THREE.Scene();

for (let i = 0; i < 20; i++) {
	const shrink = 0.2 * Math.random();
	const bookGeometry = new THREE.BoxGeometry(0.3, 1.8 - shrink, 1.2);
	const material = new THREE.MeshPhongMaterial({ color: Math.floor(Math.random() * (1 << 24)) });
	const book = new THREE.Mesh(bookGeometry, material);
	book.position.set(0.4 * (i % 10) - 1.5, ((i >= 10) ? 8.9 : 11.5) - shrink / 2, 0);
	book.castShadow = true;
	book.receiveShadow = true;
	scene.add(book);
}

const promises = [];

const texLoader = new THREE.TextureLoader();
let sphere = null;
promises.push(new Promise((resolve) => {
	texLoader.load('earthmap.jpg', (texture) => {
		texture.colorSpace = THREE.SRGBColorSpace;
		const sphereGeometry = new THREE.SphereGeometry(0.8, 48, 24);
		const sphereMaterial = new THREE.MeshPhongMaterial({ map: texture });
		sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
		sphere.position.set(-1, 6.5, 0);
		sphere.castShadow = true;
		scene.add(sphere);
		resolve();
	});
}));

// from three.js skybox example: https://threejs.org/examples/webgl_panorama_equirectangular.html
promises.push(new Promise((resolve) => {
	texLoader.load('chapel_day_2k.jpg', (sky) => {
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
	{ color: 0xff00ff, intensity: 2, pos: [0, 2, 8] },
	{ color: 0xffffff, intensity: 2, pos: [-8, 2, 4] },
	{ color: 0xffff80, intensity: 2, pos: [8, 2, 4] },
];

for (const { color, intensity, pos } of lights) {
	const light = new THREE.DirectionalLight(color, intensity);
	light.position.set(...pos);
	light.castShadow = true;
	light.shadow.camera.left = -5;
	light.shadow.camera.right = 5;
	light.shadow.camera.bottom = -15;
	light.shadow.camera.top = 15;
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
	mtlLoader.load('bookshelf.mtl', (mtl) => {
		mtl.preload();
		objLoader.setMaterials(mtl);
		objLoader.load('bookshelf.obj', (bookshelf) => {
			bookshelf.traverseVisible(o => {
				o.castShadow = true;
				o.receiveShadow = true;
			})
			scene.add(bookshelf);
			console.log(bookshelf);
			resolve();
		});
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
