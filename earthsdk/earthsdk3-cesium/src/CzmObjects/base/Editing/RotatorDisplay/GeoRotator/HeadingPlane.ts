import { BasePlane } from './BasePlane';
import { GeoRotator } from '.';
import * as Cesium from 'cesium';
import { computeCzmModelMatrix } from '../../../../../utils';

export class HeadingPlane extends BasePlane {
    constructor(czmGeoRotator: GeoRotator) {
        super(czmGeoRotator);

        const update = () => {
            const m = computeCzmModelMatrix({
                position: this.sceneObject.position,
                rotation: this.sceneObject.rotation,
            });
            this._valid = !!m;
            if (!m) return;
            {
                const v = this._normal;
                v.x = m[8];
                v.y = m[9];
                v.z = m[10];
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
    }
}
