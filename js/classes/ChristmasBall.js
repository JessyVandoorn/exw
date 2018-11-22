class ChristmasBall {

    constructor() {
        this.mesh = new THREE.Object3D();
        this.mesh.name = "ball";

        // A random color
        const colors = ['#ff0051', '#f56762','#a53c6c','#f19fa0','#72bdbf','#47689b'];

        // The main ball
        const geomBall = new THREE.OctahedronGeometry(12, 1);
        const matBall = new THREE.MeshStandardMaterial({
            color: colors[Math.floor(Math.random()*colors.length)],
            shading: THREE.FlatShading ,
            metalness: 0,
            roughness: 0.8,
            refractionRatio: 0.25
        });
        const ball = new THREE.Mesh(geomBall, matBall);
        ball.castShadow = true;
        ball.receiveShadow = true;
        this.mesh.add(ball);

        // The top of the ball
        const geomShape = new THREE.CylinderGeometry(4, 6, 10, 6, 1);
        const matShape = new THREE.MeshStandardMaterial( {
            color: 0xf8db08,
            shading: THREE.FlatShading ,
            metalness: 0,
            roughness: 0.8,
            refractionRatio: 0.25
        });
        const shape = new THREE.Mesh(geomShape, matShape);
        shape.position.y += 8;
        shape.castShadow = true;
        shape.receiveShadow = true;
        this.mesh.add(shape);

        // A Torus the top hook
        const geomShapeTwo = new THREE.TorusGeometry( 2,1, 6, 4, Math.PI);
        const matShapeTwo = new THREE.MeshStandardMaterial( {
            color: 0xf8db08,
            shading: THREE.FlatShading ,
            metalness: 0,
            roughness: 0.8,
            refractionRatio: 0.25
        });
        const shapeTwo = new THREE.Mesh(geomShapeTwo, matShapeTwo);
        shapeTwo.position.y += 13;
        shapeTwo.castShadow = true;
        shapeTwo.receiveShadow = true;
        this.mesh.add(shapeTwo);
    }
}
export default ChristmasBall;