import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const canvas = document.getElementById('canvas');
const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });

const fov = 75;
const aspect = 2;
const near = 0.1;
const far = 500;
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
	scene.add(book);
}

const texLoader = new THREE.TextureLoader();
let sphere = null;
texLoader.load('earthmap.jpg', (texture) => {
	texture.colorSpace = THREE.SRGBColorSpace;
	const sphereGeometry = new THREE.SphereGeometry(0.8, 48, 24);
	const sphereMaterial = new THREE.MeshPhongMaterial({ map: texture });
	sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
	sphere.position.set(-1, 6.5, 0);
	scene.add(sphere);
});

// from three.js skybox example: https://threejs.org/examples/webgl_panorama_equirectangular.html
texLoader.load('chapel_day_2k.jpg', (sky) => {
	sky.colorSpace = THREE.SRGBColorSpace;
	const skyGeometry = new THREE.SphereGeometry(400, 32, 16);
	skyGeometry.scale(-1, 1, 1);
	const material = new THREE.MeshBasicMaterial({ map: sky });
	const skySphere = new THREE.Mesh(skyGeometry, material);
	scene.add(skySphere);
});

const color = 0xFFFFFF;
const intensity = 3;
const light = new THREE.DirectionalLight(color, intensity);
light.position.set(-1, 4, 4);
scene.add(light);

const light2 = new THREE.DirectionalLight(0xff0000, 10, 3);
light2.position.set(0, 6.5, 0);
scene.add(light2);

const ambient = new THREE.AmbientLight(0x404040);
scene.add(ambient);

const objLoader = new OBJLoader();
const mtlLoader = new MTLLoader();
// bookshelf model from https://free3d.com/3d-model/bookshelf-778335.html
mtlLoader.load('bookshelf.mtl', (mtl) => {
	mtl.preload();
	objLoader.setMaterials(mtl);
	objLoader.load('bookshelf.obj', (bookshelf) => {
		scene.add(bookshelf);
	});
});

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

requestAnimationFrame(render);
