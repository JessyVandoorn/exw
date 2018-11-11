import Colors from './Colors.js';
import Santa from './Santa.js';

class SantaCabin {

    constructor() {
        this.mesh = new THREE.Object3D();

        //Create the cabin
        const geomCockpit = new THREE.BoxGeometry(160, 50, 50, 1, 1, 1);
        const matCockpit = new THREE.MeshPhongMaterial({
            color: Colors.brown, 
            shading: THREE.Flatshading
        });
        const cockpit = new THREE.Mesh(geomCockpit, matCockpit);
        cockpit.castShadow = true;
        cockpit.receiveShadow = true;
        this.mesh.add(cockpit);

        //Create the tail
        const geomTailPlane = new THREE.BoxGeometry(180, 10, 5, 1, 1, 1);
	    const matTailPlane = new THREE.MeshPhongMaterial({
            color: Colors.white, 
            shading:THREE.FlatShading
        });
	    const tailPlane = new THREE.Mesh(geomTailPlane, matTailPlane);
	    tailPlane.position.set(0, -67, 0);
	    tailPlane.castShadow = true;
	    tailPlane.receiveShadow = true;
        this.mesh.add(tailPlane);

        //Create the tail up
        const geomTailPlaneUp = new THREE.BoxGeometry(10, 30, 5, 1, 1, 1);
	    const matTailPlaneUp = new THREE.MeshPhongMaterial({
            color: Colors.white, 
            shading:THREE.FlatShading
        });
	    const tailPlaneUp = new THREE.Mesh(geomTailPlaneUp, matTailPlaneUp);
	    tailPlaneUp.position.set(86, -57,0);
	    tailPlaneUp.castShadow = true;
	    tailPlaneUp.receiveShadow = true;
        this.mesh.add(tailPlaneUp);

        this.santa = new Santa();
        this.santa.mesh.position.set(0, 60, 0);
        this.santa.mesh.scale.set(2.5, 2.5, 2.5);
        this.mesh.add(this.santa.mesh);

        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;

    }

}
export default SantaCabin;