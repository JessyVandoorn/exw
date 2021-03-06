import Colors from './classes/Colors.js';
import SnowBall from './classes/SnowBall.js';
import ChristmasBall from './classes/ChristmasBall.js';
import SnowParticles from './classes/SnowParticles.js';
import World from './classes/World.js';

{
	let sceneWidth, sceneHeight, camera, scene, renderer, fieldOfView, aspectRatio, nearPlane, farPlane, container;
	let sun, christmasBall, particlesSnow, heroSphere;

	let particles, currentLane, clock, jumping, particleGeometry, hasCollided;

	let circle, boxTree, id, note, noteString;

	let fieldLives = document.querySelector(`.value`);

	let isInitialized = false;

	let collidableMeshList = [];

	let bounceValue = 0.1;
	let gravity = 0.005;
	// kijken of hoger meer bomen geeft in middenvak
	let treeReleaseInterval = 0.5;

	let lives = 9;

	let highNote = false;
	let lowNote = false;
	let game = false;

	let hogeNoot;
	let lageNoot;

	const description = document.createElement(`p`);
	const title = document.createElement(`h1`);
	const containerdiv = document.createElement(`div`);
	const containerbody = document.querySelector(`body`);
	const descriptiondetail = document.createElement(`p`);
	const livesDiv = document.querySelector('.lives_value');

	let mic, pitch, sound, ac;

	let treesInPath, treesPool, ballsPool, world, snowBall, heroRollingSpeed, sphericalHelper, pathAngleValues;

	window.AudioContext = window.AudioContext || window.webkitAudioContext;

	let audioContext = null;
	let isPlaying = false;
	let sourceNode = null;
	let analyser = null;
	let theBuffer = null;
	let DEBUGCANVAS = null;
	let mediaStreamSource = null;

	window.onload = function () {
		audioContext = new AudioContext();
	};

	const error = () => {
		alert('Stream generation failed.');
	};

	const getUserMedia = (dictionary, callback) => {
		try {
			navigator.getUserMedia =
				navigator.getUserMedia ||
				navigator.webkitGetUserMedia ||
				navigator.mozGetUserMedia;
			navigator.getUserMedia(dictionary, callback, error);
		} catch (e) {
			alert('getUserMedia threw exception :' + e);
		}
	};

	const gotStream = (stream) => {
		// Create an AudioNode from the stream.
		mediaStreamSource = audioContext.createMediaStreamSource(stream);

		// Connect it to the destination.
		analyser = audioContext.createAnalyser();
		analyser.fftSize = 2048;
		mediaStreamSource.connect(analyser);
		updatePitch();
	};

	//togglePlayGame
	const togglePlayGame = () => {
		audioContext.resume();
		if (isPlaying) {
			//stop playing and return
			sourceNode.stop(0);
			sourceNode = null;
			analyser = null;
			isPlaying = false;
			if (!window.cancelAnimationFrame)
				window.cancelAnimationFrame = window.webkitCancelAnimationFrame;
			window.cancelAnimationFrame(rafID);
		}
		getUserMedia({
			"audio": {
				"mandatory": {
					"googEchoCancellation": "false",
					"googAutoGainControl": "false",
					"googNoiseSuppression": "false",
					"googHighpassFilter": "false"
				},
				"optional": []
			},
		}, gotStream);
	};

	const toggleLowNote = () => {

		navigator.mediaDevices.getUserMedia({
				audio: true
			})
			.then(stream => {

				gotStream(stream);

				setTimeout(() => {
					audioContext.suspend();
				}, 3000);

			});
	};

	const toggleHighNote = () => {
		if (audioContext.state === 'suspended') {
			audioContext.resume().then(function () {
				console.log(audioContext);
			});

			navigator.mediaDevices.getUserMedia({
					audio: true
				})
				.then(stream => {


					gotStream(stream);

					setTimeout(() => {
						audioContext.suspend();
					}, 6000);

				});
		};
	};

	let rafID = null;
	let tracks = null;
	let buflen = 1024;
	let buf = new Float32Array(buflen);

	const noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

	const noteFromPitch = (frequency) => {
		var noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
		return Math.round(noteNum) + 69;
	}

	const frequencyFromNoteNumber = (note) => {
		return 440 * Math.pow(2, (note - 69) / 12);
	}

	const centsOffFromPitch = (frequency, note) => {
		return Math.floor(1200 * Math.log(frequency / frequencyFromNoteNumber(note)) / Math.log(2));
	}


	let MIN_SAMPLES = 0; // will be initialized when AudioContext is created.
	let GOOD_ENOUGH_CORRELATION = 0.9; // this is the "bar" for how close a correlation needs to be

	const autoCorrelate = (buf, sampleRate) => {
		let SIZE = buf.length;
		let MAX_SAMPLES = Math.floor(SIZE / 2);
		let best_offset = -1;
		let best_correlation = 0;
		let rms = 0;
		let foundGoodCorrelation = false;
		let correlations = new Array(MAX_SAMPLES);

		for (let i = 0; i < SIZE; i++) {
			let val = buf[i];
			rms += val * val;
		}
		rms = Math.sqrt(rms / SIZE);
		if (rms < 0.01) // not enough signal
			return -1;

		let lastCorrelation = 1;
		for (let offset = MIN_SAMPLES; offset < MAX_SAMPLES; offset++) {
			let correlation = 0;

			for (let i = 0; i < MAX_SAMPLES; i++) {
				correlation += Math.abs((buf[i]) - (buf[i + offset]));
			}
			correlation = 1 - (correlation / MAX_SAMPLES);
			correlations[offset] = correlation; // store it, for the tweaking we need to do below.
			if ((correlation > GOOD_ENOUGH_CORRELATION) && (correlation > lastCorrelation)) {
				foundGoodCorrelation = true;
				if (correlation > best_correlation) {
					best_correlation = correlation;
					best_offset = offset;
				}
			} else if (foundGoodCorrelation) {
				let shift = (correlations[best_offset + 1] - correlations[best_offset - 1]) / correlations[best_offset];
				return sampleRate / (best_offset + (8 * shift));
			}
			lastCorrelation = correlation;
		}
		if (best_correlation > 0.01) {
			// console.log("f = " + sampleRate/best_offset + "Hz (rms: " + rms + " confidence: " + best_correlation + ")")
			return sampleRate / best_offset;
		}
		return -1;
		//	let best_frequency = sampleRate/best_offset;
	};

	const updatePitch = (time) => {
		let cycles = new Array;
		//if set of, snowBall is not moving anymore
		analyser.getFloatTimeDomainData(buf);
		//sampleRate is set by the machine on 44.1kHz
		ac = autoCorrelate(buf, audioContext.sampleRate);

		pitch = ac;
		 note = noteFromPitch(pitch);
		 noteString = noteStrings[note % 12];

		if (!window.requestAnimationFrame)
			window.requestAnimationFrame = window.webkitRequestAnimationFrame;
		rafID = window.requestAnimationFrame(updatePitch);
	};

	const loadAudio = () => {
		//inladen kerstmuziek
		const audioLoader = new THREE.AudioLoader();
		audioLoader.load('./assets/audio/music.mp3', function (buffer) {
			sound.setBuffer(buffer);
			sound.setLoop(true);
			sound.setVolume(0.5);
			sound.play();
		})
	};

	const addAudio = () => {
		//toevoegen kerstmuziek
		const listener = new THREE.AudioListener();
		camera.add(listener);
		sound = new THREE.Audio(listener);

		loadAudio();
	};

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
		const maxTreesInPool = 20;
		let newTree;
		for (let i = 0; i < maxTreesInPool; i++) {
			newTree = createTree();
			treesPool.push(newTree);
		}
	};

	const addSnowBall = () => {
		snowBall = new SnowBall();
		scene.add(snowBall.mesh);
	};

	const createWorld = () => {
		world = new World();
		world.mesh.rotation.z = -Math.PI / 2;
		world.mesh.position.y = -24;
		world.mesh.position.z = 2;
		scene.add(world.mesh);
		addWorldTrees();
	};

	const createLight = () => {
		const ambientLight = new THREE.AmbientLight(0xffffff, 1);
		scene.add(ambientLight);
		sun = new THREE.DirectionalLight(0xffffff, 1);
		sun.position.set(12, 6, -7);
		sun.castShadow = true;
		scene.add(sun);
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
		const numTrees = 20;
		const gap = 6.28 / 20;
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
			sphericalHelper.set(26 - 0.3, pathAngleValues[row], -world.mesh.rotation.x + 4);
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
		let rollingGroundVector = world.mesh.position.clone().normalize();
		let treeVector = newTree.position.clone().normalize();
		newTree.quaternion.setFromUnitVectors(treeVector, rollingGroundVector);
		newTree.rotation.x += (Math.random() * (2 * Math.PI / 10)) + -Math.PI / 10;

		world.mesh.add(newTree);
	};

	const createTree = () => {
		let sides = 8;
		let tiers = 6;
		let midPointVector = new THREE.Vector3();
		let treeGeometry = new THREE.ConeGeometry(0.5, 1, sides, tiers);
		let treeMaterial = new THREE.MeshStandardMaterial({
			color: Colors.treeMaterial,
			flatShading: THREE.FlatShading
		});

		let offset;
		midPointVector = treeGeometry.vertices[0].clone();

		const treeTop = new THREE.Mesh(treeGeometry, treeMaterial);
		treeTop.castShadow = true;
		treeTop.receiveShadow = false;
		treeTop.position.y = 0.9;
		treeTop.rotation.y = (Math.random() * (Math.PI));

		const treeTrunkGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.5);
		const trunkMaterial = new THREE.MeshStandardMaterial({
			color: Colors.trunkMaterial,
			flatShading: THREE.FlatShading
		});

		const treeTrunk = new THREE.Mesh(treeTrunkGeometry, trunkMaterial);
		treeTrunk.position.y = 0.3;

		const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
		boxTree = new THREE.Mesh(boxGeometry);
		boxTree.name = "treeBox";
		boxTree.material.visible = false;
		boxTree.position.y = 0.3;
		collidableMeshList.push(boxTree);

		const tree = new THREE.Object3D();
		tree.name = "tree";
		tree.add(treeTrunk);
		tree.add(treeTop);
		tree.add(boxTree);

		return tree;
	};

	const checkCollision = () => {
		circle = snowBall.mesh.children[1];
		let originPoint = circle.position.clone();

		for (let vertexIndex = 0; vertexIndex < circle.geometry.vertices.length; vertexIndex++) {
			let localVertex = circle.geometry.vertices[vertexIndex].clone();
			let globalVertex = localVertex.applyMatrix4(circle.matrix);
			let directionVector = globalVertex.sub(circle.position);

			let ray = new THREE.Raycaster(originPoint, directionVector.clone().normalize());
			let collisionResults = ray.intersectObjects(collidableMeshList);
			if (collisionResults.length > 0 && collisionResults[0].distance < directionVector.length()) {
				if (collisionResults[0].object.name == "kerstBal") {
					collisionResults[0].object.parent.visible = false;
					collisionResults[0].object.visible = false;
					lives++;
				} else if (collisionResults[0].object.name == "treeBox") {
					collisionResults[0].object.parent.visible = false;
					lives--;
				}
			}
		}
	};

	const createSnow = () => {
		particlesSnow = new SnowParticles();
		scene.add(particlesSnow.mesh);
	};

	const addWorldBalls = () => {
		christmasBall = new ChristmasBall();
		christmasBall.mesh.scale.set(.01, .01, .01);
		christmasBall.mesh.position.z = 0;
		christmasBall.mesh.position.y = 2;
		christmasBall.mesh.position.x = Math.random() * 6.5 - 3.5;
		collidableMeshList.push(christmasBall.mesh.children[1]);
		scene.add(christmasBall.mesh);
	};


	const updateSnowBall = () => {
		if(ac == -1) {
			
		}
		else if (ac < 300) {
			snowBall.mesh.position.x -= .025;
			if (snowBall.mesh.position.x < -1.5) {
				snowBall.mesh.position.x += .25;
			}
		} else if (ac > 300) {
			snowBall.mesh.position.x += .025;
			if (snowBall.mesh.position.x > 1.5) {
				snowBall.mesh.position.x -= .025;
			}
		}
	};

	const loop = () => {
		world.mesh.rotation.x += 0.005;
		if (snowBall.mesh.position.y <= 1.8) {
			jumping = false;
			bounceValue = (Math.random() * .04) + 0.005;
		}

		snowBall.mesh.position.y = bounceValue;
		bounceValue -= gravity;

		if (clock.getElapsedTime() > treeReleaseInterval) {
			clock.start();
			addPathTree();
			addWorldBalls();
		}

		updateSnowBall();

		if (isInitialized) {
			checkCollision();
		}

		audioContext = new window.AudioContext();

		particlesSnow.mesh.position.y -= 0.02;
		if (particlesSnow.mesh.position.y < -4) {
			particlesSnow.mesh.position.y += 8;
		}

		christmasBall.mesh.position.z += 0.25;
		if(christmasBall.mesh.position.z == 5.5) {
			christmasBall.mesh.visible = false;
			console.log(christmasBall);
		}

		fieldLives.innerHTML = lives;

		renderer.render(scene, camera);
		id = requestAnimationFrame(loop);
		if (lives <= 0) {
			cancelAnimationFrame(id);
			gameOver();
		}
	};

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

		title.textContent = 'Save Christmas';
		title.classList.add(`title`);

		description.textContent = 'Press space to start';
		description.classList.add(`description`);

		descriptiondetail.textContent = 'Make high or low pitches to move the snowball to the left or to the right. But pay attention to the Christmas trees that you do not hit them otherwise you will lose a life. When catching Christmas balls you get a life.';
		descriptiondetail.classList.add(`descriptiondetail`);

		containerdiv.setAttribute(`id`, 'container');
		containerdiv.appendChild(title);
		containerdiv.appendChild(description);
		containerdiv.appendChild(descriptiondetail);


		containerbody.appendChild(containerdiv);

		
		livesDiv.classList.add(`hide`);

		document.addEventListener('keypress', (event) => {
			if (event.keyCode === 32) {
				captureLowPitch();
			}
		})
	};

	const captureLowPitch = () => {
		description.textContent = 'Make a low note for 3 seconds';
		description.classList.add(`description`);

		//show 3 seconds or show lowest note

		setTimeout(() => {
			description.textContent = "Press space to capture a high note";
		}, 5000);

		descriptiondetail.classList.add(`hide`);

		containerdiv.setAttribute(`id`, 'container');
		containerdiv.appendChild(description);

		containerbody.appendChild(containerdiv);

		toggleLowNote();

		document.addEventListener('keypress', (event) => {
			if (event.keyCode === 32) {
				captureHighPitch();
			}
		})
	}

	const captureHighPitch = () => {
		description.textContent = 'Make a high note for 3 seconds';
		description.classList.add(`description`);

		toggleHighNote(); 

		setTimeout(() => {
			description.textContent = "Press space to start the game";
		}, 5000);

		containerdiv.setAttribute(`id`, 'container');
		containerdiv.appendChild(description);

		document.addEventListener('keypress', (event) => {
			if (event.keyCode === 32) {
				game = true;
				togglePlayGame();
				loop();
				containerdiv.classList.add(`hide`);
				container = document.getElementById('world');
				livesDiv.classList.remove(`hide`);
				lives = 9;
				container.appendChild(renderer.domElement);
				isInitialized = true;
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

		const startbtn = document.querySelector('.description');
		startbtn.textContent = 'Play again';
		startbtn.classList.add('startbtn');
		startbtn.addEventListener('click', handlePlayAgain);

		livesDiv.classList.add(`hide`);

		const containerInfo = document.querySelector('#container');
		containerInfo.classList.remove('hide');
	};

	const handlePlayAgain = e => {
		e.currentTarget;
		location.reload();
	};

	const init = () => {
		createScene();
		createLight();

		createSnow();
		addWorldBalls();
		createTreesPool();
		addSnowBall();
		createWorld();

		startGame();

		addAudio();
	};

	init();
}