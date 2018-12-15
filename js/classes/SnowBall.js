import Colors from './Colors.js';
class SnowBall {

    constructor() {
        this.mesh = new THREE.Object3D();

        const sphereGeometry = new THREE.DodecahedronGeometry(0.2, 4);
		const sphereMaterial = new THREE.MeshStandardMaterial({
			color: Colors.white,
			flatShading: THREE.FlatShading
        })
        
        const heroSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        heroSphere.receiveShadow = true;
        heroSphere.castShadow = true;
        this.mesh.add(heroSphere);

        const circleGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
		const circle = new THREE.Mesh(circleGeometry);
		circle.name = "circle";
		circle.material.visible = false;
		circle.position.y = 1.9;
		circle.position.z = 4.95;
		this.mesh.add(circle);

        heroSphere.position.y = 1.9;
        heroSphere.position.z = 4.95;
    }
}
export default SnowBall;