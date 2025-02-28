import * as Cesium from 'cesium';
import { ESCesiumViewer } from '../index';

function getResolution(destination: Cesium.Cartesian3, cameraDir: Cesium.Cartesian3, cameraPos: Cesium.Cartesian3, fovyInRadians: number, heightInPixels: number) {
    var diff = Cesium.Cartesian3.subtract(destination, cameraPos, new Cesium.Cartesian3);
    var cameraDirectionDistance = Cesium.Cartesian3.dot(diff, cameraDir);
    if (cameraDirectionDistance <= 0) {
        return;
    }
    return cameraDirectionDistance * Math.tan(fovyInRadians * .5) * 2.0 / heightInPixels;
}

export async function getCenterResolution(czmViewer: ESCesiumViewer) {
    const { viewer } = czmViewer;
    if (!viewer) return undefined;
    const { width, height } = viewer.canvas;

    // const destination = viewer.scene.pickPosition(new Cesium.Cartesian2(width*.5, height*.5)); // 这个计算会有问题
    // const destinationInDegreesPromise = czmViewer.pickPosition([width * .5, height * .5])
    //pickPosition会导致3Dtileset加载卡顿，所以用quickPickPosition
    const destinationInDegreesPromise = czmViewer.quickPickPosition([width * .5, height * .5]);
    // console.log('destinationInDegreesPromise', destinationInDegreesPromise);
    if (!destinationInDegreesPromise) return undefined;
    const destinationInDegrees = await destinationInDegreesPromise;
    if (!destinationInDegrees) return undefined;
    const destination = Cesium.Cartesian3.fromDegrees(...destinationInDegrees);
    if (!destination) return undefined;

    const cameraPos = viewer.camera.positionWC;
    const cameraDir = viewer.camera.directionWC;
    // @ts-ignore
    const fovyInRadians = viewer.camera.frustum.fovy;
    if (fovyInRadians === undefined) return undefined;

    const heightInPixels = viewer.canvas.height;

    const resolution = getResolution(destination, cameraDir, cameraPos, fovyInRadians, heightInPixels);
    return [resolution, destinationInDegrees] as [number, [number, number, number]];
}

const c = Cesium.Ellipsoid.WGS84.maximumRadius * 2 * Math.PI / 512;
export function getZoomFromResolution(resolution: number) {
    return -Math.log2(resolution / c);
}
