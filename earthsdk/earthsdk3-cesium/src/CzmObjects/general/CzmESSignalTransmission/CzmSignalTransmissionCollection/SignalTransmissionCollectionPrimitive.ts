import { clamp, Destroyable } from "xbsj-base";
import { CzmSignalTransmissionCollection, STCRoutePathType } from ".";
import * as Cesium from 'cesium';
import { xbsjCreateODLinesPrimitive } from "../XbsjPolyline";

export class SignalTransmissionCollectionPrimitive extends Destroyable {
    private _nativePrimitive?: Cesium.Primitive;
    get nativePrimitive() { return this._nativePrimitive; }
    //@ts-ignore
    constructor(private _viewer: Cesium.Viewer, sceneObject: CzmSignalTransmissionCollection, getTextureFunc?: () => Cesium.Texture) {
        super();

        const viewer = this._viewer;

        // const routePaths: XbsjRoutePath[] = sceneObject.heightRatio === undefined ? [{ positions, width, sceneObject }] : [{ startPos: positions[0], endPos: positions[1], heightRatio: sceneObject.heightRatio, width, sceneObject }];
        // const routePaths: STCRoutePathType[] = positionsSet.map(e => ({ positions: e, width }));
        const routePaths = sceneObject.routePaths;
        if (!routePaths) {
            throw new Error(`!routePath`);
        }

        const arcType = sceneObject.arcType !== undefined ? Cesium.ArcType[sceneObject.arcType] : Cesium.ArcType.GEODESIC;
        const flightLinesPrimitive = xbsjCreateODLinesPrimitive(routePaths, [1, 1, 1, 1], arcType, (instanceIndex, frameState, result) => {
            const routePath = routePaths[instanceIndex] as STCRoutePathType;
            if (!sceneObject) {
                return result;
            }
            result.repeat = (routePath.repeat ?? 1) * sceneObject.repeat;
            const startTime = routePath.startTime ?? sceneObject.startTime;
            const transmissionTime = routePath.transmissionTime ?? sceneObject.transmissionTime ?? sceneObject.duration ?? CzmSignalTransmissionCollection.defaults.duration;
            const currentTime = sceneObject.currentTime ?? CzmSignalTransmissionCollection.defaults.currentTime;
            const timeRatio = clamp((currentTime - startTime) / transmissionTime, 0, 1);
            result.timeRatio = timeRatio / result.repeat;

            const color = routePath.color ?? sceneObject.color;
            const bgColor = routePath.bgColor ?? sceneObject.bgColor;
            result.color.splice(0, 4, ...color);
            result.bgColor.splice(0, 4, ...bgColor);
            result.bidirectional = routePath.bidirectional ?? sceneObject.bidirectional;
            let result2 = sceneObject.routePathCallback && sceneObject.routePathCallback(result, instanceIndex, frameState);
            return result2 ?? result;
        }, sceneObject.brightening, sceneObject.depthTest, getTextureFunc, sceneObject.id);
        if (!flightLinesPrimitive) {
            return;
        }
        viewer.scene.primitives.add(flightLinesPrimitive);
        this.dispose(() => {
            viewer.scene.primitives.remove(flightLinesPrimitive);
        })
        flightLinesPrimitive.show = sceneObject.show ?? true;
        this.dispose(sceneObject.showChanged.disposableOn(() => {
            flightLinesPrimitive && (flightLinesPrimitive.show = sceneObject.show ?? true);
        }));

        this._nativePrimitive = flightLinesPrimitive;
    }
}