import Colors from './Colors.js';
class World {
    constructor() {
        const geom = new THREE.SphereGeometry(26,40,40);
        geom.applyMatrix(new THREE.Matrix4().makeRotationZ(-Math.PI/2));
    
        const mat = new THREE.MeshStandardMaterial({
            color: Colors.white,
            flatShading: THREE.FlatShading
        });

        this.mesh = new THREE.Mesh(geom, mat);
        this.mesh.receiveShadow = true;
    }
}
export default World;