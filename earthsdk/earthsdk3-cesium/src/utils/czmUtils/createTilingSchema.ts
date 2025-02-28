import * as Cesium from 'cesium';
import { ToGCJ02WebMercatorTilingScheme, ToWGS84WebMercatorTilingScheme } from '../../CzmObjects';
import { CzmTilingSchemaJsonType } from '../../ESJTypesCzm';
import { toCartesian2, toEllipsoid, toRectangle } from './czmConverts';

export function createTilingSchema(tilingSchemaJson: CzmTilingSchemaJsonType) {
    if (tilingSchemaJson.type === 'GeographicTilingScheme') {
        return new Cesium.GeographicTilingScheme({
            ellipsoid: tilingSchemaJson.ellipsoid && toEllipsoid(tilingSchemaJson.ellipsoid),
            rectangle: tilingSchemaJson.rectangle && toRectangle(tilingSchemaJson.rectangle),
            numberOfLevelZeroTilesX: tilingSchemaJson.numberOfLevelZeroTilesX,
            numberOfLevelZeroTilesY: tilingSchemaJson.numberOfLevelZeroTilesY,
        });

    } else if (tilingSchemaJson.type === 'WebMercatorTilingScheme') {
        return new Cesium.WebMercatorTilingScheme({
            ellipsoid: tilingSchemaJson.ellipsoid && toEllipsoid(tilingSchemaJson.ellipsoid),
            numberOfLevelZeroTilesX: tilingSchemaJson.numberOfLevelZeroTilesX,
            numberOfLevelZeroTilesY: tilingSchemaJson.numberOfLevelZeroTilesY,
            rectangleSouthwestInMeters: tilingSchemaJson.rectangleSouthwestInMeters && toCartesian2(tilingSchemaJson.rectangleSouthwestInMeters),
            rectangleNortheastInMeters: tilingSchemaJson.rectangleNortheastInMeters && toCartesian2(tilingSchemaJson.rectangleNortheastInMeters),
        });
    } else if (tilingSchemaJson.type === 'ToGCJ02WebMercatorTilingScheme') {
        return new ToGCJ02WebMercatorTilingScheme({
            ellipsoid: tilingSchemaJson.ellipsoid && toEllipsoid(tilingSchemaJson.ellipsoid),
            numberOfLevelZeroTilesX: tilingSchemaJson.numberOfLevelZeroTilesX,
            numberOfLevelZeroTilesY: tilingSchemaJson.numberOfLevelZeroTilesY,
            rectangleSouthwestInMeters: tilingSchemaJson.rectangleSouthwestInMeters && toCartesian2(tilingSchemaJson.rectangleSouthwestInMeters),
            rectangleNortheastInMeters: tilingSchemaJson.rectangleNortheastInMeters && toCartesian2(tilingSchemaJson.rectangleNortheastInMeters),
        });
    } else if (tilingSchemaJson.type === 'ToWGS84WebMercatorTilingScheme') {
        return new ToWGS84WebMercatorTilingScheme({
            ellipsoid: tilingSchemaJson.ellipsoid && toEllipsoid(tilingSchemaJson.ellipsoid),
            numberOfLevelZeroTilesX: tilingSchemaJson.numberOfLevelZeroTilesX,
            numberOfLevelZeroTilesY: tilingSchemaJson.numberOfLevelZeroTilesY,
            rectangleSouthwestInMeters: tilingSchemaJson.rectangleSouthwestInMeters && toCartesian2(tilingSchemaJson.rectangleSouthwestInMeters),
            rectangleNortheastInMeters: tilingSchemaJson.rectangleNortheastInMeters && toCartesian2(tilingSchemaJson.rectangleNortheastInMeters),
        });
    } else {
        // @ts-ignore
        console.warn(`未能识别的类型tilingSchemaJson.type: ${tilingSchemaJson.type}`);
        return undefined;
    }
}
