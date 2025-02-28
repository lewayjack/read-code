import * as Cesium from "cesium";
import { CzmClippingPolygonCollectionJsonType } from "../../ESJTypesCzm";
import { positionToCartesian } from "./czmConverts";


export function createClippingPolygonCollection(clippingPolygonsJson: CzmClippingPolygonCollectionJsonType) {
    const { polygons, enabled, inverse } = clippingPolygonsJson;
    return new Cesium.ClippingPolygonCollection({
        polygons: (polygons && polygons.map(e => new Cesium.ClippingPolygon({
            positions: e.positions.map(e => positionToCartesian(e))
        }))),
        enabled: enabled,
        inverse: inverse
    })
}