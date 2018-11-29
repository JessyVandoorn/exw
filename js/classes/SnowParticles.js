import Colors from './Colors.js';
class SnowParticles {
    constructor() {
        this.mesh = new THREE.Object3D();

        const flakeCount = 9000;
        const flakeGeometry = new THREE.OctahedronGeometry(.02, 1);
        const flakeMaterial = new THREE.MeshStandardMaterial({
            color: Colors.white,
            shading: THREE.FlatShading,
            metalness: 0,
        });

        const snow = new THREE.Group();
        for (let i = 0; i < flakeCount; i++) {
            var flakeMesh = new THREE.Mesh(flakeGeometry, flakeMaterial);
            flakeMesh.position.set(
                (Math.random() - 0.5) * 40,
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 40
            );
            snow.add(flakeMesh);
        }
        this.mesh.add(snow);
    }
}
export default SnowParticles;