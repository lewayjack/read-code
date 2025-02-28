import * as Cesium from 'cesium';
import { pickVirtualPlane } from './pickVirtualPlane';
import { GeoRotator } from '.';
import { HasOwner } from 'xbsj-base';
import { toCartesian2 } from '../../../../../utils';

export class BasePlane extends HasOwner<GeoRotator> {
    get viewer() { return this.owner.czmViewer.viewer as Cesium.Viewer; }
    get scene() { return this.viewer.scene as Cesium.Scene; }
    get sceneObject() { return this.owner; }

    protected _valid = false;
    get valid() { return this._valid; }

    protected _normal = new Cesium.Cartesian3(0, 0, 0);
    get normal() { return this._valid && this._normal || undefined; }

    protected _origin = new Cesium.Cartesian3(0, 0, 0);
    get origin() { return this._valid && this._origin; }

    constructor(czmGeoRotator: GeoRotator) {
        super(czmGeoRotator);
    }

    pick(windowPos: [number, number]) {
        if (!this.normal) return;
        if (!this.owner.cartesian) return;
        const planePivot = this.owner.cartesian;
        const windowCoordinates = toCartesian2(windowPos);
        const v = pickVirtualPlane(this.scene, planePivot, this.normal, windowCoordinates);
        return v;
    }
}
