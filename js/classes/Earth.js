import Colors from './Colors.js';

class Earth {
    constructor() {
        const geom = new THREE.CylinderGeometry(600, 600, 500, 40, 10);

        geom.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI/2));

        geom.mergeVertices();

        this.waves = [];

        geom.vertices.forEach(vertex => {
            this.waves.push({
                x: vertex.x,
                y: vertex.y,
                z: vertex.z,
                ang: Math.random() * Math.PI * 2,
                amp: 2 + Math.random() * 5,
                speed: 0.016 + Math.random() * 0.032
            });
        })

        const mat = new THREE.MeshPhongMaterial({
            color: Colors.red,
            transparent: true,
		    opacity: .9,
		    shading: THREE.FlatShading,
        });

        this.mesh = new THREE.Mesh(geom, mat);
	    this.mesh.receiveShadow = true;
    }

    moveWaves() {
        this.mesh.geometry.vertices.forEach((vertex, index) => {
            const wave = this.waves[index];
            vertex.x = wave.x + Math.cos(wave.ang)*wave.amp;
            vertex.y = wave.y + Math.sin(wave.ang)*wave.amp;
            wave.ang +=wave.speed;
        });

        this.mesh.geometry.verticesNeedUpdate = true;

	    this.mesh.rotation.z += .005;
    }
};

export default Earth;