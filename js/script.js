import Santa from './classes/Santa.js';
import Earth from './classes/Earth.js';
import Tree from './classes/Tree.js';
// import SantaCabin from './classes/SantaCabin.js';
// import Packet from './classes/Packet.js';
import Colors from './classes/Colors.js';
// import Ball from './classes/Ball.js';

{
	let sceneWidth, sceneHeight, camera, scene, renderer, fieldOfView, aspectRatio, nearPlane, farPlane, container;
	let sun, santaCabin, packet, ball;

	let particles, currentLane, clock, jumping, particleGeometry, hasCollided;

	let mic;
	let pitch;

	let bounceValue = 0.1;
	let gravity = 0.005;
	let leftLane = -1;
	let rightLane = 1;
	let middleLane = 0;
	let treeReleaseInterval = 0.5;
	let lastTreeReleaseTime = 0;
	let explosionPower = 1.06;

	let sound;

	let treesInPath, treesPool, rollingGroundSphere, heroSphere, heroRollingSpeed, sphericalHelper, pathAngleValues;

	window.AudioContext = window.AudioContext || window.webkitAudioContext;

	var audioContext = null;
	var isPlaying = false;
	var sourceNode = null;
	var analyser = null;
	var theBuffer = null;
	var DEBUGCANVAS = null;
	var mediaStreamSource = null;
	var detectorElem,
		canvasElem,
		waveCanvas,
		pitchElem,
		noteElem,
		detuneElem,
		detuneAmount;

	window.onload = function () {
		audioContext = new AudioContext();

		detectorElem = document.getElementById("detector");
		canvasElem = document.getElementById("output");

		pitchElem = document.getElementById("pitch");
		noteElem = document.getElementById("note");
		detuneElem = document.getElementById("detune");
		detuneAmount = document.getElementById("detune_amt");

	}

	function error() {
		alert('Stream generation failed.');
	}

	function getUserMedia(dictionary, callback) {
		try {
			navigator.getUserMedia =
				navigator.getUserMedia ||
				navigator.webkitGetUserMedia ||
				navigator.mozGetUserMedia;
			navigator.getUserMedia(dictionary, callback, error);
		} catch (e) {
			alert('getUserMedia threw exception :' + e);
		}
	}

	function gotStream(stream) {
		// Create an AudioNode from the stream.
		mediaStreamSource = audioContext.createMediaStreamSource(stream);

		// Connect it to the destination.
		analyser = audioContext.createAnalyser();
		analyser.fftSize = 2048;
		mediaStreamSource.connect(analyser);
		updatePitch();
	}


	function toggleLiveInput() {
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
	}

	let ac;
	var rafID = null;
	var tracks = null;
	var buflen = 1024;
	var buf = new Float32Array(buflen);

	var noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

	function noteFromPitch(frequency) {
		var noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
		return Math.round(noteNum) + 69;
	}

	function frequencyFromNoteNumber(note) {
		return 440 * Math.pow(2, (note - 69) / 12);
	}

	function centsOffFromPitch(frequency, note) {
		return Math.floor(1200 * Math.log(frequency / frequencyFromNoteNumber(note)) / Math.log(2));
	}

	var MIN_SAMPLES = 0; // will be initialized when AudioContext is created.
	var GOOD_ENOUGH_CORRELATION = 0.9; // this is the "bar" for how close a correlation needs to be

	function autoCorrelate(buf, sampleRate) {
		var SIZE = buf.length;
		var MAX_SAMPLES = Math.floor(SIZE / 2);
		var best_offset = -1;
		var best_correlation = 0;
		var rms = 0;
		var foundGoodCorrelation = false;
		var correlations = new Array(MAX_SAMPLES);

		for (var i = 0; i < SIZE; i++) {
			var val = buf[i];
			rms += val * val;
		}
		rms = Math.sqrt(rms / SIZE);
		if (rms < 0.01) // not enough signal
			return -1;

		var lastCorrelation = 1;
		for (var offset = MIN_SAMPLES; offset < MAX_SAMPLES; offset++) {
			var correlation = 0;

			for (var i = 0; i < MAX_SAMPLES; i++) {
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
				var shift = (correlations[best_offset + 1] - correlations[best_offset - 1]) / correlations[best_offset];
				return sampleRate / (best_offset + (8 * shift));
			}
			lastCorrelation = correlation;
		}
		if (best_correlation > 0.01) {
			// console.log("f = " + sampleRate/best_offset + "Hz (rms: " + rms + " confidence: " + best_correlation + ")")
			return sampleRate / best_offset;
		}
		return -1;
		//	var best_frequency = sampleRate/best_offset;
	}

	function updatePitch(time) {
		var cycles = new Array;
		analyser.getFloatTimeDomainData(buf);
		 ac = autoCorrelate(buf, audioContext.sampleRate);

		// if (ac == -1) {
		// 	detectorElem.className = "vague";
		// 	pitchElem.innerText = "--";
		// 	noteElem.innerText = "-";
		// 	detuneElem.className = "";
		// 	detuneAmount.innerText = "--";
		// } else {
		// 	detectorElem.className = "confident";
		// 	pitch = ac;
		// 	console.log(ac);
		// 	pitchElem.innerText = Math.round(pitch);
		// 	var note = noteFromPitch(pitch);
		// 	noteElem.innerHTML = noteStrings[note % 12];
		// 	var detune = centsOffFromPitch(pitch, note);
		// 	if (detune == 0) {
		// 		detuneElem.className = "";
		// 		detuneAmount.innerHTML = "--";
		// 	} else {
		// 		if (detune < 0)
		// 			detuneElem.className = "flat";
		// 		else
		// 			detuneElem.className = "sharp";
		// 		detuneAmount.innerHTML = Math.abs(detune);
		// 	}
		// }

		// console.log(ac);

		if(ac == -1){
			console.log('geen toonhoogtes');
		} else if(ac < 300){
			console.log('lage toonhoogtes');
		} else if(ac > 300) {
			console.log('hoge toonhoogtes');
		}

		if (!window.requestAnimationFrame)
			window.requestAnimationFrame = window.webkitRequestAnimationFrame;
		rafID = window.requestAnimationFrame(updatePitch);
	}




	const createScene = () => {
		treesInPath = [];
		treesPool = [];

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

		addExplosion();

		camera.position.z = 6.5;
		camera.position.y = 2.5;

		window.addEventListener('resize', handleWindowResize, false);

		// document.onkeydown = handleKeyDown;

	};

	const addExplosion = () => {
		particleGeometry = new THREE.Geometry();

		for (let i = 0; i < 20; i++) {
			const vertex = new THREE.Vector3();
			particleGeometry.vertices.push(vertex);
		}

		const pMaterial = new THREE.ParticleBasicMaterial({
			color: 0xfffafa,
			size: 0.2
		});

		particles = new THREE.Points(particleGeometry, pMaterial);
		scene.add(particles);
		particles.visible = false;
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
		const sphereGeometry = new THREE.DodecahedronGeometry(0.2, 4);
		const sphereMaterial = new THREE.MeshStandardMaterial({
			color: Colors.white,
			shading: THREE.FlatShading
		})

		jumping = false;
		heroSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
		heroSphere.receiveShadow = true;
		heroSphere.castShadow = true;
		scene.add(heroSphere);

		heroSphere.position.y = 1.8;
		heroSphere.position.z = 4.8;
		currentLane = middleLane;
		heroSphere.position.x = currentLane;
	};

	const createWorld = () => {
		const sides = 40;
		const tiers = 40;
		const sphereGeometry = new THREE.SphereGeometry(26, sides, tiers);
		const sphereMaterial = new THREE.MeshStandardMaterial({
			color: Colors.colorGround,
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

		rollingGroundSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
		rollingGroundSphere.receiveShadow = true;
		rollingGroundSphere.castShadow = false;
		rollingGroundSphere.rotation.z = -Math.PI / 2;
		scene.add(rollingGroundSphere);
		rollingGroundSphere.position.y = -24;
		rollingGroundSphere.position.z = 2;
		addWorldTrees();
	};

	const createLight = () => {
		const hemisphereLight = new THREE.HemisphereLight(0xfffafa, 0x000000, 1)
		scene.add(hemisphereLight);
		sun = new THREE.DirectionalLight(0xcdc1c5, 1);
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
			sphericalHelper.set(26 - 0.3, pathAngleValues[row], -rollingGroundSphere.rotation.x + 4);
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
		let rollingGroundVector = rollingGroundSphere.position.clone().normalize();
		let treeVector = newTree.position.clone().normalize();
		newTree.quaternion.setFromUnitVectors(treeVector, rollingGroundVector);
		newTree.rotation.x += (Math.random() * (2 * Math.PI / 10)) + -Math.PI / 10;

		rollingGroundSphere.add(newTree);
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
				if (treePos.distanceTo(heroSphere.position) <= 0.6) {
					// console.log("hit");
					hasCollided = true;
					addExplosion();
				}
			}
		});

		let fromWhere;
		treesToRemove.forEach(function (element, index) {
			oneTree = treesToRemove[index];
			fromWhere = treesInPath.indexOf(oneTree);
			treesInPath.splice(fromWhere, 1);
			treesPool.push(oneTree);
			oneTree.visible = false;
			//console.log("remove tree");
		});
	};

	

	 const updateSphere = () => {
		// const old = {
		// 	x: heroSphere.position.x,
		// 	y: heroSphere.position.y
		// };

		if(ac == -1){
			// heroSphere.position.x = O;
			//heroSphere.position.y = old.y;

		} else if(ac < 300){
			heroSphere.position.x -= .025;
			// heroSphere.position.y -
		} else if(ac > 300){
			heroSphere.position.x += .025;
			heroSphere.position.y += .025;
		}
	 }

	const loop = () => {
		rollingGroundSphere.rotation.x += 0.005;
		heroSphere.rotation.x -= heroRollingSpeed;

		if (heroSphere.position.y <= 1.8) {
			jumping = false;
			bounceValue = (Math.random() * 0.04) + 0.005;
		}

		heroSphere.position.y += bounceValue;
		// heroSphere.position.x = THREE.Math.lerp(heroSphere.position.x,currentLane, 2*clock.getDelta());//clock.getElapsedTime());
		bounceValue -= gravity;

		if (clock.getElapsedTime() > treeReleaseInterval) {
			clock.start();
			addPathTree();
		}

		

		updateSphere();

		doTreeLogic();
		audioContext = new window.AudioContext();

		//santaCabin.santa.updateHairs();

		renderer.render(scene, camera);
		requestAnimationFrame(loop);
	};

	const handleWindowResize = () => {
		sceneHeight = window.innerHeight;
		sceneWidth = window.innerWidth;
		renderer.setSize(sceneWidth, sceneHeight);
		camera.aspect = sceneWidth / sceneHeight;
		camera.updateProjectionMatrix();
	};

	const loadAudio = () => {
		const audioLoader = new THREE.AudioLoader();
		audioLoader.load('../assets/audio/music.mp3', function(buffer){
			sound.setBuffer(buffer);
			sound.setLoop(true);
			sound.setVolume(1);
			sound.play();
		})
	}

	const addAudio = () => {
		const listener = new THREE.AudioListener();
		camera.add(listener);
		sound = new THREE.Audio(listener);

		loadAudio();
	}



	const init = () => {
		createScene();
		createLight();

		createTreesPool();
		addSanta();
		createWorld();

		// createSantaCabin();
		// createChristmasPacket();
		// createChristmasBall();

		loop();

		addAudio();

		toggleLiveInput();

		document.querySelector('button').addEventListener('click', function() {
			context.resume().then(() => {
			  console.log('Playback resumed successfully');
			});
		})


	};

	const createSantaCabin = () => {
		santaCabin = new SantaCabin();
		scene.add(santaCabin.mesh);
	};

	const createChristmasPacket = () => {
		packet = new Packet();
		//packet.mesh.position.y = -600;
		scene.add(packet.mesh);
	};

	const createChristmasBall = () => {
		ball = new Ball();
		//ball.mesh.position.y = -600;
		ball.mesh.scale.set(2.5, 2.5, 2.5);
		scene.add(ball.mesh);
	};

	init();
}