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
camera.position.z = 10;
controls.update();

const scene = new THREE.Scene();

const geometry = new THREE.BoxGeometry(2, 2, 2);
const material = new THREE.MeshPhongMaterial({ color: 0x44aa88 });
const cube = new THREE.Mesh(geometry, material);
cube.position.set(-3, 0, 1);
scene.add(cube);

const sphereGeometry = new THREE.SphereGeometry(1.5, 32, 16);
const sphereMaterial = new THREE.MeshPhongMaterial({ color: 0xff8000 });
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
sphere.position.set(3, 0, 1);
scene.add(sphere);

const color = 0xFFFFFF;
const intensity = 3;
const light = new THREE.DirectionalLight(color, intensity);
light.position.set(-1, 2, 4);
scene.add(light);

const objLoader = new OBJLoader();
const mtlLoader = new MTLLoader();
// plant model from https://free3d.com/3d-model/indoor-pot-plant-77983.html
mtlLoader.load('indoor plant_02.mtl', (mtl) => {
	mtl.preload();
	objLoader.setMaterials(mtl);
	objLoader.load('indoor plant_02.obj', (root) => {
		root.position.y -= 2;
		scene.add(root);
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

	cube.rotation.x = time;
	cube.rotation.y = time;
	renderer.render(scene, camera);
	requestAnimationFrame(render);
}

requestAnimationFrame(render);
