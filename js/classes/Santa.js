import Colors from './Colors.js';

class Santa {
    constructor() {
        this.mesh = new THREE.Object3D();

        //Create the cabin
        const geomCockpit = new THREE.BoxGeometry(180, 50, 50, 1, 1, 1);
        const matCockpit = new THREE.MeshPhongMaterial({
            color: Colors.red, 
            shading: THREE.Flatshading
        });

        const cockpit = new THREE.Mesh(geomCockpit, matCockpit);
        cockpit.castShadow = true;
        cockpit.receiveShadow = true;
        this.mesh.add(cockpit);
        
        //Santa
    }
};

export default Santa;