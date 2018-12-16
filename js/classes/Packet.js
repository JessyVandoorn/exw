import Colors from './Colors.js';

class Packet {

    constructor() {
        this.mesh = new THREE.Object3D();

        const colors = ['#ff0051', '#f56762','#a53c6c','#f19fa0','#72bdbf','#47689b'];

        //Create the shapepacket
        const geomCockpit = new THREE.BoxGeometry(60, 50, 50, 1, 1, 1);
        const matCockpit = new THREE.MeshPhongMaterial({
            color: colors[Math.floor(Math.random()*colors.length)],
            flatShading: THREE.Flatshading
        });
        const cockpit = new THREE.Mesh(geomCockpit, matCockpit);
        cockpit.castShadow = true;
        cockpit.receiveShadow = true;
        this.mesh.add(cockpit);

        //Create the tail right
        const geomTailPlaneRight = new THREE.BoxGeometry(7, 56, 2, 1, 1, 1);
	    const matTailPlaneRight = new THREE.MeshPhongMaterial({
            color:Colors.white, 
            flatShading:THREE.FlatShading
        });
	    const tailPlaneRight = new THREE.Mesh(geomTailPlaneRight, matTailPlaneRight);
	    tailPlaneRight.position.set(30,0,0);
	    tailPlaneRight.castShadow = true;
	    tailPlaneRight.receiveShadow = true;
        this.mesh.add(tailPlaneRight);

        //Create the tail left
        const geomTailPlaneLeft = new THREE.BoxGeometry(2, 56, 7, 1, 1, 1);
	    const matTailPlaneLeft = new THREE.MeshPhongMaterial({
            color:Colors.white, 
            flatShading:THREE.FlatShading
        });
	    const tailPlaneLeft = new THREE.Mesh(geomTailPlaneLeft, matTailPlaneLeft);
	    tailPlaneLeft.position.set(-30,0,0);
	    tailPlaneLeft.castShadow = true;
	    tailPlaneLeft.receiveShadow = true;
        this.mesh.add(tailPlaneLeft);

        // Create the wing sides
	    const geomSideWing = new THREE.BoxGeometry(7, 50, 55, 1, 1, 1);
	    const matSideWing = new THREE.MeshPhongMaterial({
            color:Colors.white, 
            flatShading:THREE.FlatShading
        });
	    const sideWing = new THREE.Mesh(geomSideWing, matSideWing);
	    sideWing.castShadow = true;
	    sideWing.receiveShadow = true;
        this.mesh.add(sideWing);
        
        // Create the wing top
	    const geomSideWingUp = new THREE.BoxGeometry(7, 2, 55, 1, 1, 1);
	    const matSideWingUp = new THREE.MeshPhongMaterial({
            color:Colors.white, 
            flatShading:THREE.FlatShading
        });
	    const sideWingUp = new THREE.Mesh(geomSideWingUp, matSideWingUp);
	    sideWingUp.castShadow = true;
        sideWingUp.receiveShadow = true;
        sideWingUp.position.set(0, 27, 0);
        this.mesh.add(sideWingUp);

        // Create the wing bottom
	    const geomSideWingBottom = new THREE.BoxGeometry(7, 2, 55, 1, 1, 1);
	    const matSideWingBottom = new THREE.MeshPhongMaterial({
            color:Colors.white, 
            flatShading:THREE.FlatShading
        });
	    const sideWingBottom = new THREE.Mesh(geomSideWingBottom, matSideWingBottom);
	    sideWingBottom.castShadow = true;
        sideWingBottom.receiveShadow = true;
        sideWingBottom.position.set(0, -26, 0);
        this.mesh.add(sideWingBottom);
        
        // Create the wing top bottom
	    const geomSideWingUpRotate = new THREE.BoxGeometry(58, 2, 7, 1, 1, 1);
	    const matSideWingUpRotate = new THREE.MeshPhongMaterial({
            color:Colors.white, 
            flatShading:THREE.FlatShading
        });
	    const sideWingUpRotate = new THREE.Mesh(geomSideWingUpRotate, matSideWingUpRotate);
	    sideWingUpRotate.castShadow = true;
        sideWingUpRotate.receiveShadow = true;
        sideWingUpRotate.position.set(0, 27, 0);
	    this.mesh.add(sideWingUpRotate);
    }

}
export default Packet;