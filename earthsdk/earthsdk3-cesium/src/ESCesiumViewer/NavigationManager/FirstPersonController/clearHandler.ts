import * as Cesium from 'cesium';
export function clearHandler(handler: Cesium.ScreenSpaceEventHandler) {
    handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOWN);
    handler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_DOWN);
    handler.removeInputAction(Cesium.ScreenSpaceEventType.MIDDLE_DOWN);
    handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_UP);
    handler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_UP);
    handler.removeInputAction(Cesium.ScreenSpaceEventType.MIDDLE_UP);
}


export function look3D(_scene: Cesium.Scene, movement: any, screenSpaceCameraController: Cesium.ScreenSpaceCameraController, rotationAxis: Cesium.Cartesian3 | undefined = undefined) {
    const scene = _scene;
    const camera = scene.camera;

    const startPos = new Cesium.Cartesian2();
    startPos.x = movement.startPosition.x;
    startPos.y = 0.0;
    const endPos = new Cesium.Cartesian2();
    endPos.x = movement.endPosition.x;
    endPos.y = 0.0;

    let startRay = camera.getPickRay(startPos, new Cesium.Ray());
    let endRay = camera.getPickRay(endPos, new Cesium.Ray());
    let angle = 0.0;
    let start;
    let end;
    if (!startRay || !endRay) return;

    if (camera.frustum instanceof Cesium.OrthographicFrustum) {
        start = startRay.origin;
        end = endRay.origin;

        Cesium.Cartesian3.add(camera.direction, start, start);
        Cesium.Cartesian3.add(camera.direction, end, end);

        Cesium.Cartesian3.subtract(start, camera.position, start);
        Cesium.Cartesian3.subtract(end, camera.position, end);

        Cesium.Cartesian3.normalize(start, start);
        Cesium.Cartesian3.normalize(end, end);
    } else {
        start = startRay.direction;
        end = endRay.direction;
    }

    let dot = Cesium.Cartesian3.dot(start, end);
    if (dot < 1.0) {
        // dot is in [0, 1]
        angle = Math.acos(dot);
    }

    angle = movement.startPosition.x > movement.endPosition.x ? angle : -angle;

    //@ts-ignore
    const horizontalRotationAxis = screenSpaceCameraController._horizontalRotationAxis;
    if (Cesium.defined(rotationAxis)) {
        camera.look(rotationAxis, -angle);
    } else if (Cesium.defined(horizontalRotationAxis)) {
        camera.look(horizontalRotationAxis, -angle);
    } else {
        camera.lookLeft(angle);
    }

    startPos.x = 0.0;
    startPos.y = movement.startPosition.y;
    endPos.x = 0.0;
    endPos.y = movement.endPosition.y;

    startRay = camera.getPickRay(startPos, new Cesium.Ray());
    endRay = camera.getPickRay(endPos, new Cesium.Ray());
    angle = 0.0;
    if (!startRay || !endRay) return;

    if (camera.frustum instanceof Cesium.OrthographicFrustum) {
        start = startRay.origin;
        end = endRay.origin;

        Cesium.Cartesian3.add(camera.direction, start, start);
        Cesium.Cartesian3.add(camera.direction, end, end);

        Cesium.Cartesian3.subtract(start, camera.position, start);
        Cesium.Cartesian3.subtract(end, camera.position, end);

        Cesium.Cartesian3.normalize(start, start);
        Cesium.Cartesian3.normalize(end, end);
    } else {
        start = startRay.direction;
        end = endRay.direction;
    }

    dot = Cesium.Cartesian3.dot(start, end);
    if (dot < 1.0) {
        // dot is in [0, 1]
        angle = Math.acos(dot);
    }
    angle = movement.startPosition.y > movement.endPosition.y ? angle : -angle;

    rotationAxis = Cesium.defaultValue(rotationAxis, horizontalRotationAxis);
    if (Cesium.defined(rotationAxis)) {
        const direction = camera.direction;
        const negativeRotationAxis = Cesium.Cartesian3.negate(
            rotationAxis,
            new Cesium.Cartesian3()
        );
        const northParallel = Cesium.Cartesian3.equalsEpsilon(
            direction,
            rotationAxis,
            Cesium.Math.EPSILON2
        );
        const southParallel = Cesium.Cartesian3.equalsEpsilon(
            direction,
            negativeRotationAxis,
            Cesium.Math.EPSILON2
        );
        if (!northParallel && !southParallel) {
            dot = Cesium.Cartesian3.dot(direction, rotationAxis);
            let angleToAxis = Cesium.Math.acosClamped(dot);
            if (angle > 0 && angle > angleToAxis) {
                angle = angleToAxis - Cesium.Math.EPSILON4;
            }

            dot = Cesium.Cartesian3.dot(direction, negativeRotationAxis);
            angleToAxis = Cesium.Math.acosClamped(dot);
            if (angle < 0 && -angle > angleToAxis) {
                angle = -angleToAxis + Cesium.Math.EPSILON4;
            }

            const tangent = Cesium.Cartesian3.cross(rotationAxis, direction, new Cesium.Cartesian3());
            camera.look(tangent, angle);
        } else if ((northParallel && angle < 0) || (southParallel && angle > 0)) {
            camera.look(camera.right, -angle);
        }
    } else {
        camera.lookUp(angle);
    }
}
