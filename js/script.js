import Santa from './classes/Santa.js';
import Earth from './classes/Earth.js';
import Tree from './classes/Tree.js';
import Colors from './classes/Colors.js';

{
    let sceneWidth, sceneHeight, camera, scene, renderer, fieldOfView, aspectRatio, nearPlane, farPlane, container;
	let sun, santaCabin, packet, ball;
	
	let particles, currentLane, clock, jumping, particleGeometry, hasCollided;

	let recognizing;
        const transcription = document.getElementById('speech'),
        interim_span = document.getElementById('interim');

    const speech = new webkitSpeechRecognition() || speechRecognition();

	let bounceValue = 0.1;
	let gravity = 0.005;
	let leftLane = -1;
	let rightLane = 1;
	let middleLane = 0;
	let treeReleaseInterval=0.5;
	let lastTreeReleaseTime=0;
	let explosionPower =1.06;

	let treesInPath, treesPool, rollingGroundSphere, heroSphere, heroRollingSpeed, sphericalHelper, pathAngleValues;

	const createScene = () =>{
		treesInPath = [];
		treesPool = [];

		clock = new THREE.Clock();
		clock.start();

		heroRollingSpeed = (0.008 * 26/0.3) / 5;
		sphericalHelper = new THREE.Spherical();
		pathAngleValues=[1.52, 1.57, 1.62];
		
		sceneWidth = window.innerWidth;
    	sceneHeight = window.innerHeight;
    	scene = new THREE.Scene();
    	scene.fog = new THREE.FogExp2(0xf0fff0, 0.14);
		
		aspectRatio = sceneWidth/sceneHeight;
        fieldOfView = 60;
        nearPlane = 0.1;
        farPlane = 1000;
        camera = new THREE.PerspectiveCamera(
            fieldOfView,
            aspectRatio,
            nearPlane,
            farPlane
		)

    	renderer = new THREE.WebGLRenderer({alpha:true});
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

	const addExplosion = () =>{
		particleGeometry = new THREE.Geometry();
		
		for (let i = 0; i < 20; i ++ ) {
			const vertex = new THREE.Vector3();
			particleGeometry.vertices.push( vertex );
		}

		const pMaterial = new THREE.ParticleBasicMaterial({
	  		color: 0xfffafa,
	  		size: 0.2
		});

		particles = new THREE.Points( particleGeometry, pMaterial);
		scene.add(particles);
		particles.visible=false;
	};

	const createTreesPool = () => {
		const maxTreesInPool = 10;
		let newTree;
		for(let i=0; i<maxTreesInPool; i++){
			newTree = createTree();
			treesPool.push(newTree);
		}
	};

	// const handleKeyDown = (e) => {
	// 	if(jumping)return;

	// 	let validMove = true;
	// 	if (e.keyCode === 37) {//left
	// 		if(currentLane == middleLane){
	// 			currentLane = leftLane;
	// 		}else if(currentLane == rightLane){
	// 			currentLane = middleLane;
	// 		}else{
	// 			validMove = false;	
	// 		}
	// 	} else if (e.keyCode === 39) {//right
	// 		if(currentLane == middleLane) {
	// 			currentLane = rightLane;
	// 		}else if(currentLane == leftLane) {
	// 			currentLane = middleLane;
	// 		}else {
	// 			validMove=false;	
	// 		}
	// 	}else{
	// 		if (e.keyCode === 38){//up, jump
	// 			bounceValue = 0.1;
	// 			jumping = true;
	// 		}
	// 		validMove = false;
	// 	}

	// 	if(validMove){
	// 		jumping = true;
	// 		bounceValue = 0.06;
	// 	}

	// };

	const addSanta = () => {
		const sphereGeometry = new THREE.DodecahedronGeometry(0.2, 4);
		const sphereMaterial = new THREE.MeshStandardMaterial({ 
			color: Colors.white,
			shading:THREE.FlatShading
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
		
		for(let j=1; j<tiers-2; j++){
			currentTier = j;
			for(let i=0; i<sides; i++){
				vertexIndex=(currentTier*sides)+1;
				vertexVector=sphereGeometry.vertices[i+vertexIndex].clone();
				if(j%2!==0){
					if(i==0){
						firstVertexVector=vertexVector.clone();
					}
					nextVertexVector=sphereGeometry.vertices[i+vertexIndex+1].clone();
					if(i==sides-1){
						nextVertexVector=firstVertexVector;
					}
					lerpValue=(Math.random()*(0.75-0.25))+0.25;
					vertexVector.lerp(nextVertexVector,lerpValue);
				}
				heightValue=(Math.random()*maxHeight)-(maxHeight/2);
				offset=vertexVector.clone().normalize().multiplyScalar(heightValue);
				sphereGeometry.vertices[i+vertexIndex]=(vertexVector.add(offset));
			}
		}

		rollingGroundSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
		rollingGroundSphere.receiveShadow = true;
		rollingGroundSphere.castShadow = false;
		rollingGroundSphere.rotation.z = -Math.PI/2;
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
		sun.shadow.camera.far = 50 ;
	};

	const addPathTree = () => {
		const options = [0, 1, 2];
		let lane = Math.floor(Math.random()*3);
		// addTree(true, lane);
		options.splice(lane, 1);
		if(Math.random() > 0.5){
			lane = Math.floor(Math.random()*2);
			// addTree(true,options[lane]);
		}
	};

	const addWorldTrees = () => {
		const numTrees = 36;
		const gap = 6.28/36;
		for(let i=0; i<numTrees; i++){
			// addTree(false, i*gap, true);
			// addTree(false, i*gap, false);
		}
	};

	// const addTree = (inPath, row, isLeft) => {
	// 	let newTree;
	// 	if(inPath){
	// 		if(treesPool.length==0)return;
	// 		newTree = treesPool.pop();
	// 		newTree.visible=true;

	// 		treesInPath.push(newTree);
	// 		sphericalHelper.set(26-0.3, pathAngleValues[row], -rollingGroundSphere.rotation.x+4);
	// 	}else{
	// 		newTree = createTree();
	// 		let forestAreaAngle = 0;
	// 		if(isLeft){
	// 			forestAreaAngle=1.68+Math.random()*0.1;
	// 		}else{
	// 			forestAreaAngle=1.46-Math.random()*0.1;
	// 		}
	// 		sphericalHelper.set( 26-0.3, forestAreaAngle, row );
	// 	}

	// 	newTree.position.setFromSpherical(sphericalHelper);
	// 	let rollingGroundVector = rollingGroundSphere.position.clone().normalize();
	// 	let treeVector = newTree.position.clone().normalize();
	// 	newTree.quaternion.setFromUnitVectors(treeVector,rollingGroundVector);
	// 	newTree.rotation.x += (Math.random()*(2*Math.PI/10))+-Math.PI/10;
	
	// 	rollingGroundSphere.add(newTree);
	// };

	const createTree = () => {
		let sides = 8;
		let tiers = 6;
		let scalarMultiplier = (Math.random()*(0.25-0.1))+0.05;
		let midPointVector = new THREE.Vector3();
		let vertexVector = new THREE.Vector3();
		let treeGeometry = new THREE.ConeGeometry(0.5, 1, sides, tiers);
		let treeMaterial = new THREE.MeshStandardMaterial( { 
			color: Colors.treeMaterial,
			shading:THREE.FlatShading  
		});
		
		let offset;
		midPointVector = treeGeometry.vertices[0].clone();
		let currentTier = 0;
		let vertexIndex;
		
		blowUpTree(treeGeometry.vertices, sides, 0, scalarMultiplier);
		tightenTree(treeGeometry.vertices, sides, 1);
		blowUpTree(treeGeometry.vertices, sides, 2, scalarMultiplier*1.1, true);
		tightenTree(treeGeometry.vertices, sides, 3);
		blowUpTree(treeGeometry.vertices, sides, 4, scalarMultiplier*1.2);
		tightenTree(treeGeometry.vertices, sides, 5);
		
		const treeTop = new THREE.Mesh(treeGeometry, treeMaterial);
		treeTop.castShadow = true;
		treeTop.receiveShadow = false;
		treeTop.position.y = 0.9;
		treeTop.rotation.y = (Math.random()*(Math.PI));
		
		const treeTrunkGeometry = new THREE.CylinderGeometry(0.1, 0.1,0.5);
		const trunkMaterial = new THREE.MeshStandardMaterial({ 
			color: Colors.trunkMaterial,
			shading:THREE.FlatShading  
		});

		const treeTrunk = new THREE.Mesh(treeTrunkGeometry, trunkMaterial);
		treeTrunk.position.y = 0.25;
		
		const tree = new THREE.Object3D();
		tree.add(treeTrunk);
		tree.add(treeTop);

		return tree;
	};

	const blowUpTree = (vertices,sides,currentTier,scalarMultiplier,odd) => {
		let vertexIndex;
		let vertexVector = new THREE.Vector3();
		let midPointVector = vertices[0].clone();
		let offset;
		
		for(let i=0; i<sides; i++){
			vertexIndex = (currentTier*sides)+1;
			vertexVector = vertices[i+vertexIndex].clone();
			midPointVector.y = vertexVector.y;
			offset = vertexVector.sub(midPointVector);
			
			if(odd){
				if(i%2 === 0){
					offset.normalize().multiplyScalar(scalarMultiplier/6);
					vertices[i+vertexIndex].add(offset);
				}else{
					offset.normalize().multiplyScalar(scalarMultiplier);
					vertices[i+vertexIndex].add(offset);
					vertices[i+vertexIndex].y = vertices[i+vertexIndex+sides].y+0.05;
				}
			}else{
				if(i%2!==0){
					offset.normalize().multiplyScalar(scalarMultiplier/6);
					vertices[i+vertexIndex].add(offset);
				}else{
					offset.normalize().multiplyScalar(scalarMultiplier);
					vertices[i+vertexIndex].add(offset);
					vertices[i+vertexIndex].y = vertices[i+vertexIndex+sides].y+0.05;
				}
			}
		}
	};

	const tightenTree = (vertices,sides,currentTier) => {
		let vertexIndex;
		let vertexVector = new THREE.Vector3();
		let midPointVector = vertices[0].clone();
		let offset;
	
		for(let i=0; i<sides; i++){
			vertexIndex = (currentTier*sides)+1;
			vertexVector = vertices[i+vertexIndex].clone();
			midPointVector.y = vertexVector.y;
			offset = vertexVector.sub(midPointVector);
			offset.normalize().multiplyScalar(0.06);
			vertices[i+vertexIndex].sub(offset);
		}
	};

	const doTreeLogic = () => {
		let oneTree;
		let treePos = new THREE.Vector3();
		let treesToRemove = [];

		treesInPath.forEach(function (element, index) {
			oneTree=treesInPath[index];
			treePos.setFromMatrixPosition(oneTree.matrixWorld);
		
			if(treePos.z>6 &&oneTree.visible){//gone out of our view zone
				treesToRemove.push(oneTree);
			}else{//check collision
				if(treePos.distanceTo(heroSphere.position) <= 0.6){
					// console.log("hit");
					hasCollided = true;
				}
			}
		});
		
		let fromWhere;
		treesToRemove.forEach(function (element, index) {
			oneTree = treesToRemove[index];
			fromWhere = treesInPath.indexOf(oneTree);
			treesInPath.splice(fromWhere,1);
			treesPool.push(oneTree);
			oneTree.visible = false;
			//console.log("remove tree");
		});
	};

	const updateSphere = () => {
		speech.onresult = function (event) {
            let interim_transcript = '';
            let final_transcript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    final_transcript += event.results[i][0].transcript;
                } else {
                    interim_transcript += event.results[i][0].transcript;
                }
            }

            transcription.innerHTML = final_transcript;
            interim_span.innerHTML = interim_transcript;

            final_transcript = final_transcript.trim();
            console.log("[final_transcript] ", final_transcript, " => ", final_transcript.length);

            if (final_transcript.length > 0) {
                console.log("yay, I'm here");
                let old = {
                    x: heroSphere.position.x,
                    y: heroSphere.position.y
                };

                if (final_transcript == 'right') {
                    heroSphere.position.x += .5
                } // Left a
                else if (final_transcript == 'left') {
                    heroSphere.position.x -= .5
                } // Right d
                else if (final_transcript == 'up') {
                    heroSphere.position.y += .5
                } // Up w
                else if (final_transcript == 'down') {
                    heroSphere.position.y -= .5
                    console.log( heroSphere.position.y);
                } 

            }
        }
	}

	const loop = () => {
    	rollingGroundSphere.rotation.x += 0.005;
    	heroSphere.rotation.x -= heroRollingSpeed;
		
		if(heroSphere.position.y <= 1.8){
    		jumping = false;
    		bounceValue = (Math.random()*0.04) + 0.005;
    	}
		
		heroSphere.position.y += bounceValue;
    	// heroSphere.position.x = THREE.Math.lerp(heroSphere.position.x,currentLane, 2*clock.getDelta());//clock.getElapsedTime());
    	bounceValue -= gravity;
		
		if(clock.getElapsedTime() > treeReleaseInterval){
    		clock.start();
    		addPathTree();
		}

		updateSphere();
		
		doTreeLogic();
		
		//santaCabin.santa.updateHairs();

		renderer.render(scene, camera);
		requestAnimationFrame(loop);
	};

	const handleWindowResize = () => {
		sceneHeight = window.innerHeight;
		sceneWidth = window.innerWidth;
		renderer.setSize(sceneWidth, sceneHeight);
		camera.aspect = sceneWidth/sceneHeight;
		camera.updateProjectionMatrix();
	};

	const reset = () => {
		recognizing = false;
        interim_span.innerHTML = '';
        transcription.innerHTML = '';
	}

    const init = () => {
        createScene();
        createLight();

		createTreesPool();
		addSanta();
		createWorld();
		
		//createSantaCabin();
        //createChristmasPacket();
        //createChristmasBall();
        
		loop();
		
		if (!(window.webkitSpeechRecognition) && !(window.speechRecognition)) {
            upgrade();
        } else {

            interim_span.style.opacity = '0.5';
            reset();

            speech.continuous = true;
            speech.interimResults = true;
            speech.lang = 'en-US';
            speech.start();

            speech.onstart = function () {
                recognizing = true;
            }

            speech.onerror = function(event) {
                console.error(event.error);
            };

            speech.onend = function() {
                reset();
            }
        }
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