import { BasePlane } from './BasePlane';
import { GeoRotator } from '.';
import * as Cesium from 'cesium';
import { computeCzmModelMatrix } from '../../../../../utils';
import { ESJNativeNumber16 } from "earthsdk3";

export class PitchPlane extends BasePlane {
    constructor(czmGeoRotator: GeoRotator) {
        super(czmGeoRotator);

        const update = () => {
            const rm = computeCzmModelMatrix({
                rotation: [this.sceneObject.selfRotation[0], 0, 0],
            });
            if (!rm) {
                throw new Error('PitchPlane: rm is undefined');
            };
            const m = computeCzmModelMatrix({
                position: this.sceneObject.position,
                rotation: this.sceneObject.rotation,
                localModelMatrix: Cesium.Matrix4.toArray(rm) as ESJNativeNumber16,
            });
            this._valid = !!m;
            if (!m) return;
            {
                const v = this._normal;
                v.x = -m[0];
                v.y = -m[1];
                v.z = -m[2];
            }
            {
                const v = this._origin;
                v.x = m[4];
                v.y = m[5];
                v.z = m[6];
            }
        };
        update();
        this.dispose(this.sceneObject.positionChanged.disposableOn(update));
        this.dispose(this.sceneObject.rotationChanged.disposableOn(update));
        this.dispose(this.sceneObject.selfRotationChanged.disposableOn(update));
    }
}
