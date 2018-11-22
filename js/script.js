import Colors from './classes/Colors.js';
import SnowBall from './classes/SnowBall.js';
import ChristmasBall from './classes/ChristmasBall.js'; 
{
	let sceneWidth, sceneHeight, camera, scene, renderer, fieldOfView, aspectRatio, nearPlane, farPlane, container;
	let sun, santaCabin, packet, ball, christmasBall;

	var particlesSnow = [];
	var particleImage = new Image(); //THREE.ImageUtils.loadTexture( "http://i.imgur.com/cTALZ.png" );
	particleImage.src = '../assets/img/particleSmoke.png';

	let particles, currentLane, clock, jumping, particleGeometry, hasCollided;

	let bounceValue = 0.1;
	let gravity = 0.005;
	let leftLane = -1;
	let rightLane = 1;
	let middleLane = 0;
	let treeReleaseInterval = 0.5;
	let lastTreeReleaseTime = 0;
	let explosionPower = 1.06;

	let lives = 3;
	const nBalls = 10;
	let id;

	let treesInPath, treesPool, ballsPool, world, heroSphere, heroRollingSpeed, sphericalHelper, pathAngleValues;

	const createScene = () => {
		treesInPath = [];
		treesPool = [];
		ballsPool = [];

		clock = new THREE.Clock();
		clock.start();

		heroRollingSpeed = (0.008 * 26 / 0.3) / 5;
		sphericalHelper = new THREE.Spherical();
		pathAngleValues = [1.52, 1.57, 1.62];

		sceneWidth = window.innerWidth;
		sceneHeight = window.innerHeight;
		scene = new THREE.Scene();
		scene.fog = new THREE.FogExp2(0xf0fff0, 0.14);

		aspectRatio = sceneWidth / sceneHeight;
		fieldOfView = 60;
		nearPlane = 0.1;
		farPlane = 1000;
		camera = new THREE.PerspectiveCamera(
			fieldOfView,
			aspectRatio,
			nearPlane,
			farPlane
		)

		renderer = new THREE.WebGLRenderer({
			alpha: true
		});
		renderer.shadowMap.enabled = true;
		renderer.shadowMap.type = THREE.PCFSoftShadowMap;
		renderer.setSize(sceneWidth, sceneHeight);

		container = document.getElementById('world');
		container.appendChild(renderer.domElement);

		camera.position.z = 6.5;
		camera.position.y = 2.5;

		window.addEventListener('resize', handleWindowResize, false);
	};

	const createTreesPool = () => {
		const maxTreesInPool = 10;
		let newTree;
		for (let i = 0; i < maxTreesInPool; i++) {
			newTree = createTree();
			treesPool.push(newTree);
		}
	};

	const addSanta = () => {
		heroSphere = new SnowBall();
		jumping = false;
		heroSphere.mesh.position.y = .05;
		scene.add(heroSphere.mesh);
	};

	const createWorld = () => {
		const sides = 40;
		const tiers = 40;
		const sphereGeometry = new THREE.SphereGeometry(26, sides, tiers);
		const sphereMaterial = new THREE.MeshStandardMaterial({
			color: Colors.white,
			shading: THREE.FlatShading
		})

		let vertexIndex;
		let vertexVector = new THREE.Vector3();
		let nextVertexVector = new THREE.Vector3();
		let firstVertexVector = new THREE.Vector3();
		let offset = new THREE.Vector3();
		let currentTier = 1;
		let lerpValue = 0.5;
		let heightValue;
		let maxHeight = 0.07;

		for (let j = 1; j < tiers - 2; j++) {
			currentTier = j;
			for (let i = 0; i < sides; i++) {
				vertexIndex = (currentTier * sides) + 1;
				vertexVector = sphereGeometry.vertices[i + vertexIndex].clone();
				if (j % 2 !== 0) {
					if (i == 0) {
						firstVertexVector = vertexVector.clone();
					}
					nextVertexVector = sphereGeometry.vertices[i + vertexIndex + 1].clone();
					if (i == sides - 1) {
						nextVertexVector = firstVertexVector;
					}
					lerpValue = (Math.random() * (0.75 - 0.25)) + 0.25;
					vertexVector.lerp(nextVertexVector, lerpValue);
				}
				heightValue = (Math.random() * maxHeight) - (maxHeight / 2);
				offset = vertexVector.clone().normalize().multiplyScalar(heightValue);
				sphereGeometry.vertices[i + vertexIndex] = (vertexVector.add(offset));
			}
		}

		world = new THREE.Mesh(sphereGeometry, sphereMaterial);
		world.receiveShadow = true;
		world.castShadow = false;
		world.rotation.z = -Math.PI / 2;
		scene.add(world);
		world.position.y = -24;
		world.position.z = 2;
		addWorldTrees();
		//addWorldBalls();
	};

	const createLight = () => {
		const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x000000, 1)
		scene.add(hemisphereLight);
		sun = new THREE.DirectionalLight(0xffffff, 1);
		sun.position.set(12, 6, -7);
		sun.castShadow = true;
		scene.add(sun);

		//Set up shadow properties for the sun light
		sun.shadow.mapSize.width = 256;
		sun.shadow.mapSize.height = 256;
		sun.shadow.camera.near = 0.5;
		sun.shadow.camera.far = 50;
	};

	const addPathTree = () => {
		const options = [0, 1, 2];
		let lane = Math.floor(Math.random() * 3);
		addTree(true, lane);
		options.splice(lane, 1);
		if (Math.random() > 0.5) {
			lane = Math.floor(Math.random() * 2);
			addTree(true, options[lane]);
		}
	};

	const addWorldTrees = () => {
		const numTrees = 36;
		const gap = 6.28 / 36;
		for (let i = 0; i < numTrees; i++) {
			addTree(false, i * gap, true);
			addTree(false, i * gap, false);
		}
	};

	const addTree = (inPath, row, isLeft) => {
		let newTree;
		if (inPath) {
			if (treesPool.length == 0) return;
			newTree = treesPool.pop();
			newTree.visible = true;

			treesInPath.push(newTree);
			//plaats van bomen op de planeet - ze kunnen eropgezet worden
			sphericalHelper.set(26 - 0.3, pathAngleValues[row], -world.rotation.x + 4);
		} else {
			newTree = createTree();
			let forestAreaAngle = 0;
			if (isLeft) {
				forestAreaAngle = 1.68 + Math.random() * 0.1;
			} else {
				forestAreaAngle = 1.46 - Math.random() * 0.1;
			}
			sphericalHelper.set(26 - 0.3, forestAreaAngle, row);
		}

		newTree.position.setFromSpherical(sphericalHelper);
		let rollingGroundVector = world.position.clone().normalize();
		let treeVector = newTree.position.clone().normalize();
		newTree.quaternion.setFromUnitVectors(treeVector, rollingGroundVector);
		newTree.rotation.x += (Math.random() * (2 * Math.PI / 10)) + -Math.PI / 10;

		world.add(newTree);
	};

	const createTree = () => {
		let sides = 8;
		let tiers = 6;
		let scalarMultiplier = (Math.random() * (0.25 - 0.1)) + 0.05;
		let midPointVector = new THREE.Vector3();
		let vertexVector = new THREE.Vector3();
		let treeGeometry = new THREE.ConeGeometry(0.5, 1, sides, tiers);
		let treeMaterial = new THREE.MeshStandardMaterial({
			color: Colors.treeMaterial,
			shading: THREE.FlatShading
		});

		let offset;
		midPointVector = treeGeometry.vertices[0].clone();
		let currentTier = 0;
		let vertexIndex;

		blowUpTree(treeGeometry.vertices, sides, 0, scalarMultiplier);
		tightenTree(treeGeometry.vertices, sides, 1);
		blowUpTree(treeGeometry.vertices, sides, 2, scalarMultiplier * 1.1, true);
		tightenTree(treeGeometry.vertices, sides, 3);
		blowUpTree(treeGeometry.vertices, sides, 4, scalarMultiplier * 1.2);
		tightenTree(treeGeometry.vertices, sides, 5);

		const treeTop = new THREE.Mesh(treeGeometry, treeMaterial);
		treeTop.castShadow = true;
		treeTop.receiveShadow = false;
		treeTop.position.y = 0.9;
		treeTop.rotation.y = (Math.random() * (Math.PI));

		const treeTrunkGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.5);
		const trunkMaterial = new THREE.MeshStandardMaterial({
			color: Colors.trunkMaterial,
			shading: THREE.FlatShading
		});

		const treeTrunk = new THREE.Mesh(treeTrunkGeometry, trunkMaterial);
		treeTrunk.position.y = 0.25;

		const tree = new THREE.Object3D();
		tree.add(treeTrunk);
		tree.add(treeTop);

		return tree;
	};

	const blowUpTree = (vertices, sides, currentTier, scalarMultiplier, odd) => {
		let vertexIndex;
		let vertexVector = new THREE.Vector3();
		let midPointVector = vertices[0].clone();
		let offset;

		for (let i = 0; i < sides; i++) {
			vertexIndex = (currentTier * sides) + 1;
			vertexVector = vertices[i + vertexIndex].clone();
			midPointVector.y = vertexVector.y;
			offset = vertexVector.sub(midPointVector);

			if (odd) {
				if (i % 2 === 0) {
					offset.normalize().multiplyScalar(scalarMultiplier / 6);
					vertices[i + vertexIndex].add(offset);
				} else {
					offset.normalize().multiplyScalar(scalarMultiplier);
					vertices[i + vertexIndex].add(offset);
					vertices[i + vertexIndex].y = vertices[i + vertexIndex + sides].y + 0.05;
				}
			} else {
				if (i % 2 !== 0) {
					offset.normalize().multiplyScalar(scalarMultiplier / 6);
					vertices[i + vertexIndex].add(offset);
				} else {
					offset.normalize().multiplyScalar(scalarMultiplier);
					vertices[i + vertexIndex].add(offset);
					vertices[i + vertexIndex].y = vertices[i + vertexIndex + sides].y + 0.05;
				}
			}
		}
	};

	const tightenTree = (vertices, sides, currentTier) => {
		let vertexIndex;
		let vertexVector = new THREE.Vector3();
		let midPointVector = vertices[0].clone();
		let offset;

		for (let i = 0; i < sides; i++) {
			vertexIndex = (currentTier * sides) + 1;
			vertexVector = vertices[i + vertexIndex].clone();
			midPointVector.y = vertexVector.y;
			offset = vertexVector.sub(midPointVector);
			offset.normalize().multiplyScalar(0.06);
			vertices[i + vertexIndex].sub(offset);
		}
	};

	const doTreeLogic = () => {
		let oneTree;
		let treePos = new THREE.Vector3();
		let treesToRemove = [];

		treesInPath.forEach(function (element, index) {
			oneTree = treesInPath[index];
			treePos.setFromMatrixPosition(oneTree.matrixWorld);

			if (treePos.z > 6 && oneTree.visible) { //gone out of our view zone
				treesToRemove.push(oneTree);
			} else { //check collision
				// if (treePos.distanceTo(heroSphere.mesh.position) <= 0.6) {
				// 	console.log("hit");
				// 	hasCollided = true;
				// 	lives--;
				// 	if (lives <= 0) {
				// 		gameOver();
				// 	}
				// }
			}
		});

		let fromWhere;
		treesToRemove.forEach(function (element, index) {
			oneTree = treesToRemove[index];
			fromWhere = treesInPath.indexOf(oneTree);
			treesInPath.splice(fromWhere, 1);
			treesPool.push(oneTree);
			oneTree.visible = false;
			console.log("remove tree");
		});
	};

	const loop = () => {
		world.rotation.x += 0.005;
		//heroSphere.mesh.rotation.x -= .002;

		if (heroSphere.mesh.position.y <= 1.8) {
			jumping = false;
			bounceValue = (Math.random() * .04) + 0.005;
		}

		heroSphere.mesh.position.y = bounceValue;
		//heroSphere.mesh.position.x = THREE.Math.lerp(heroSphere.mesh.position.x, currentLane, 2 * clock.getDelta()); //clock.getElapsedTime());
		bounceValue -= gravity;

		if (clock.getElapsedTime() > treeReleaseInterval) {
			clock.start();
			addPathTree();
		}

		doTreeLogic();
		

		renderer.render(scene, camera);
		id = requestAnimationFrame(loop);
		if (lives <= 0) {
			cancelAnimationFrame(id);
		}
	};

	window.setInterval(function(){addWorldBalls()}, Math.random()*1000);

	const handleWindowResize = () => {
		sceneHeight = window.innerHeight;
		sceneWidth = window.innerWidth;
		renderer.setSize(sceneWidth, sceneHeight);
		camera.aspect = sceneWidth / sceneHeight;
		camera.updateProjectionMatrix();
	};

	const startGame = () => {
		if (document.getElementById('container')) {
			document.getElementById('container').remove();
		}
		const title = document.createElement(`h1`);
		title.textContent = 'Save Christmas';
		title.classList.add(`title`);

		const description = document.createElement(`p`);
		description.textContent = 'Press space to start the game';
		description.classList.add(`description`);

		const containerdiv = document.createElement(`div`);
		containerdiv.setAttribute(`id`, 'container');
		containerdiv.appendChild(title);
		containerdiv.appendChild(description);

		const containerbody = document.querySelector(`body`);
		containerbody.appendChild(containerdiv);

		document.addEventListener('keypress', (event) => {
			if (event.keyCode === 32) {
				loop();
				containerdiv.classList.add(`hide`);
				container = document.getElementById('world');
				lives = 3;
				container.appendChild(renderer.domElement);
			} else {
				console.log('error');
			}
		})
	};

	const gameOver = () => {
		const container = document.getElementById(`world`);
		if (container.contains(document.querySelector('canvas'))) {
			container.removeChild(document.querySelector(`canvas`));
		}

		const element = document.querySelector(`h1`);
		element.textContent = 'Game over';

		const startbtn = document.querySelector('p');
		startbtn.textContent = 'Play again';
		startbtn.classList.add('startbtn');
		startbtn.addEventListener('click', handlePlayAgain);

		const containerInfo = document.querySelector('#container');
		containerInfo.classList.remove('hide');
	};

	const handlePlayAgain = e => {
		e.currentTarget;
		startGame();
	};

	const init = () => {
		createScene();
		createLight();

		createTreesPool();
		addSanta();
		createWorld();

		startGame();
	};

	const addWorldBalls = () => {
		christmasBall = new ChristmasBall();
		const numBalls = 1;
		// const gap = 6.28 / 36;
		for (let i = 0; i < numBalls; i++) {
			christmasBall = new ChristmasBall();
			christmasBall.mesh.scale.set(.02,.02,.02);
			christmasBall.mesh.position.x = Math.random()*6.5 - 3.5;
			christmasBall.mesh.position.y = Math.random()*2.5;
			christmasBall.mesh.position.z = Math.random()*.5;
			scene.add(christmasBall.mesh);
		}
	};

	init();
}