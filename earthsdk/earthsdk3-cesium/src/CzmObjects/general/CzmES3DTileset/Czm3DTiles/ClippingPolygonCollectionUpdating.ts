import { Destroyable } from "xbsj-base";
import { Czm3DTiles } from ".";
import * as Cesium from 'cesium';
import { createClippingPolygonCollection } from "../../../../utils";

export class ClippingPolygonCollectionUpdating extends Destroyable {
    get tileset() { return this._tileset; }
    get czmCzm3DTiles() { return this._czm3DTiles; }

    constructor(private _tileset: Cesium.Cesium3DTileset, private _czm3DTiles: Czm3DTiles) {
        super();

        const { tileset, czmCzm3DTiles: sceneObject } = this;
        {
            const update = () => {
                tileset.clippingPolygons = sceneObject.clippingPolygons ? createClippingPolygonCollection(sceneObject.clippingPolygons) : new Cesium.ClippingPolygonCollection();
            };
            update();
            this.dispose(sceneObject.clippingPolygonsChanged.disposableOn(update));
        }
    }
}