import type { WebGLRenderer } from "three";

let hitTestSource: XRHitTestSource | null = null; //debe aceptar null para quitar hitTestSource
let hitTestSourceRequested = false;

export function handleXRHitTest(
  renderer: WebGLRenderer,
  frame: XRFrame,
  onHitTestResultReady: (hitPoseMatrix: Float32Array) => void,
  onHitTestResultEmpty: () => void,
) {
  const referenceSpace = renderer.xr.getReferenceSpace();
  const session = renderer.xr.getSession();

  let xrHitPoseMatrix: Float32Array;

  if (session && hitTestSourceRequested === false) {
    session.requestReferenceSpace("viewer")
        .then((referenceSpace) => {
            if (session) {
                session
                    .requestHitTestSource?.({ space: referenceSpace })
                    ?.then((source) => {
                        hitTestSource = source;
                    })
                    .catch((err) => console.warn("HitTest source omitido")); //para intentar evitar hardlocks
            }
        })
        .catch((err) => console.warn("ReferenceSpace omitido")); 

    session.addEventListener('end', () => {
        hitTestSourceRequested = false;
        hitTestSource = null;
    });

    hitTestSourceRequested = true;
  }

  if (hitTestSource) {
    const hitTestResults = frame.getHitTestResults(hitTestSource);

    if (hitTestResults.length) {
      const hit = hitTestResults[0];

      if (hit && hit !== null && referenceSpace) {
        const xrHitPose = hit.getPose(referenceSpace);

        if (xrHitPose) {
          xrHitPoseMatrix = xrHitPose.transform.matrix;
          onHitTestResultReady(xrHitPoseMatrix);
        }
      }
    } else {
      onHitTestResultEmpty();
    }
  }
};
