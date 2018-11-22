import Colors from './Colors.js';
class SnowBall {

    constructor() {
        this.mesh = new THREE.Object3D();

        const sphereGeometry = new THREE.DodecahedronGeometry(0.2, 4);
		const sphereMaterial = new THREE.MeshStandardMaterial({
			color: Colors.white,
			shading: THREE.FlatShading
        })
        
        const heroSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        heroSphere.receiveShadow = true;
        heroSphere.castShadow = true;
        this.mesh.add(heroSphere);

        heroSphere.position.y = 1.8;
        heroSphere.position.z = 4.95;
    }
}
export default SnowBall;