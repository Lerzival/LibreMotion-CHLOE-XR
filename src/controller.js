import * as THREE from "three";

export function interaction(renderer, scene, objective){
    const raycaster = new THREE.Raycaster();
    const tempMatrix = new THREE.Matrix4();
    const cajaAntes = new THREE.Box3(); 
    const cajaDespues = new THREE.Box3();

    const propiedadesMandos = [];
    
    let mandos = [];
    let agarrado = null;
    const vecMano1 = new THREE.Vector3();
    const vecMano2 = new THREE.Vector3();
    let anguloActual = 0;
    let anguloAnterior = 0;
    let distanciaActual = 0;
    let distanciaAnterior = 0;

    // Un vector vacío para guardar dónde choca el láser
    const puntoInterseccion = new THREE.Vector3();
    // Un vector para recordar dónde pinchaste exactamente relativo al centro del cubo
    const offsetAgarre = new THREE.Vector3();
    
    let distanciaAgarre = 0;
    
    let alturaFija = 0;

    for (let i = 0; i < 2; i++) {
        const controller = renderer.xr.getController(i);
        scene.add(controller);

        // Al meter la creación DENTRO del bucle, fabricamos 2 láseres distintos
        const laser = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, -0.1), 
            new THREE.Vector3(0, 0, -0.5)
        ]);
        const material = new THREE.LineBasicMaterial({
            color: 0xffffff,
        });
        const laserFinal = new THREE.Line(laser, material);

        controller.add(laserFinal);

        controller.addEventListener("selectstart", () => {
            if (!objective.visible) return; // si el cubo aún no ha nacido, el láser no hace nada

            tempMatrix.identity().extractRotation(controller.matrixWorld); //logica de rotacion. Borras la tempmatrix con la identidad, le pones la rotacion del mando, haces que el rayo salga de una posicion matricial (del mando) y le das una direccion (0,0,-1) que es hacia delante, y la aplicas a la tempmatrix para que el rayo salga hacia delante del mando
            raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
            raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

            const hitbox = objective.getObjectByName('hitbox');
            const objetivoColision = hitbox ? hitbox : objective;
            const intersecciones = raycaster.intersectObject(objetivoColision, false);

            if (intersecciones.length > 0) {
                    if (!mandos.includes(controller)) {
                        agarrado = objective;
                        mandos.push(controller);
                        if (mandos.length === 1) {
                            alturaFija = agarrado.position.y; //capturamos la altura del cubo en el momento de agarrarlo para que el plano de colisión esté a esa altura
                            distanciaAgarre = intersecciones[0].distance; //capturamos la distancia del rayo al cubo en el momento de agarrarlo para que el cubo no se mueva hacia la mano
                            offsetAgarre.subVectors(agarrado.position, intersecciones[0].point); //capturamos el offset del punto de agarre para que el cubo no se mueva hacia la mano
                        } else if (mandos.length === 2) {
                    
                            mandos[0].getWorldPosition(vecMano1);
                            mandos[1].getWorldPosition(vecMano2);
                            anguloAnterior = Math.atan2(vecMano2.z - vecMano1.z, vecMano2.x - vecMano1.x);
                            distanciaAnterior = vecMano1.distanceTo(vecMano2);}
                    }
                    }
                });
        controller.addEventListener("selectend", () => {
            const index = mandos.indexOf(controller);
            if (index !== -1) { //miro si el mando está en el array de mandos
                mandos.splice(index, 1); //si lo  está, lo quito con splice (al que le indicas la posicion y el numero de elementos a cortar a partir de ella) para que el array se reorganice. El que queda es el mando que manda jaja
                
                if (mandos.length === 0) {
                    agarrado = null; //si solo queda un mando (corregido a 0), el objeto deja de estar agarrado y se suelta
                } 
                else if (mandos.length === 1 && agarrado) {
                    tempMatrix.identity().extractRotation(mandos[0].matrixWorld);
                    raycaster.ray.origin.setFromMatrixPosition(mandos[0].matrixWorld);
                    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
                    
                    raycaster.ray.at(distanciaAgarre, puntoInterseccion); //calcula el punto de intersección a la distancia que estaba agarrado el cubo para que no se mueva hacia la mano
                    agarrado.position.copy(puntoInterseccion).add(offsetAgarre); //aplica el offset para que el cubo no se mueva hacia la mano
                    agarrado.position.y = alturaFija; //fija la altura del cubo para que no se mueva en y
                }
                }
            }
        );

        propiedadesMandos.push({
            espacio: controller,
            lineaVisual: laserFinal,
            estaAgarrandoAlgo: () => mandos.includes(controller) //guardo estos valores en un array externo para poder usarlos despues antes de que se destruyan al salir del bucle
        })
    } 

    const comprobarColisiones = () => {
        // si el cubo aún no ha nacido, no colorear láseres ⬇
        if (!objective.visible) return; 

        for (let i = 0; i < propiedadesMandos.length; i++) {
            const mando = propiedadesMandos[i].espacio;
            const laser = propiedadesMandos[i].lineaVisual;
            const estaAgarrando = propiedadesMandos[i].estaAgarrandoAlgo();

            if (estaAgarrando) {
                laser.material.color.setHex(0x00ff00); // Cambia el color del láser a verde si está agarrando algo
                continue;
            }

            tempMatrix.identity().extractRotation(mando.matrixWorld);
            raycaster.ray.origin.setFromMatrixPosition(mando.matrixWorld);
            raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

            const hitbox = objective.getObjectByName('hitbox');
            const objetivoColision = hitbox ? hitbox : objective;
            const intersecciones = raycaster.intersectObject(objetivoColision, false);

            if (intersecciones.length > 0) {
                laser.material.color.setHex(0x00cdf8); // Cambia el color del láser a azul celeste si hay colisión
            }else {
                laser.material.color.setHex(0xffffff); // Cambia el color del láser a blanco si no hay colisión
            }
        }

        //lógica de arrastre 
        if (mandos.length === 1 && agarrado) {
            tempMatrix.identity().extractRotation(mandos[0].matrixWorld);
            raycaster.ray.origin.setFromMatrixPosition(mandos[0].matrixWorld);
            raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

            raycaster.ray.at(distanciaAgarre, puntoInterseccion); //calcula el punto de intersección a la distancia que estaba agarrado el cubo para que no se mueva hacia la mano
            agarrado.position.copy(puntoInterseccion).add(offsetAgarre); //aplica el offset para que el cubo no se mueva hacia la mano
            agarrado.position.y = alturaFija; //fija la altura del cubo para que no se mueva en y
        }
        // Lógica de rotación con dos mandos
        if (mandos.length === 2 && agarrado) {
            mandos[0].getWorldPosition(vecMano1);
            mandos[1].getWorldPosition(vecMano2);
            
            anguloActual = Math.atan2(vecMano2.z - vecMano1.z, vecMano2.x - vecMano1.x); //calcula el angulo entre ambos mandos en el plano xz
            let deltaAngulo = anguloActual - anguloAnterior;

            if (deltaAngulo > Math.PI) deltaAngulo -= Math.PI * 2;
            if (deltaAngulo < -Math.PI) deltaAngulo += Math.PI * 2;
            
            agarrado.rotation.y += -deltaAngulo; //aplicas el deltaAngulo como una rotación en y sobre el objeto
            anguloAnterior = anguloActual; //actualizas el ángulo para seguir comparando en siguientes frames

            distanciaActual = vecMano1.distanceTo(vecMano2);
            const escala = distanciaActual / distanciaAnterior;

            if (distanciaAnterior > 0.001) {
                //mide dónde están apoyados los pies AHORA MISMO
                cajaAntes.setFromObject(agarrado);
                const nivelSuelo = cajaAntes.min.y;

                //Aplica la escala
                agarrado.scale.multiplyScalar(escala);

                agarrado.updateMatrixWorld(true); //actualiza la matriz del objeto para que la escala se aplique correctamente

                //Vuelve a medir la base, que ha cambiado al escalar desde el centro y se habra metido en el suelo
                cajaDespues.setFromObject(agarrado);
                
                //Levanta la figura exactamente lo que se haya hundido
                agarrado.position.y += (nivelSuelo - cajaDespues.min.y);

                agarrado.updateMatrixWorld(true); //actualiza la matriz del objeto para que la escala se aplique correctamente
                
                alturaFija = agarrado.position.y;
            }
            distanciaAnterior = distanciaActual;
        }
    };

    return comprobarColisiones;
}
