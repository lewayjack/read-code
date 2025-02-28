import * as Cesium from 'cesium';
// @ts-ignore
import * as coordTransform from './coordTransform';

class ToGCJ02WebMercatorTilingScheme extends Cesium.WebMercatorTilingScheme {
    constructor(options: {
        ellipsoid?: Cesium.Ellipsoid;
        numberOfLevelZeroTilesX?: number;
        numberOfLevelZeroTilesY?: number;
        rectangleSouthwestInMeters?: Cesium.Cartesian2;
        rectangleNortheastInMeters?: Cesium.Cartesian2;
    }) {
        super(options);

        // @ts-ignore
        var proj = this._projection
        proj.s_project = proj.project;
        // @ts-ignore
        proj.project = function (carto) {
            var p = {};
            p = coordTransform.gcj02towgs84(Cesium.Math.toDegrees(carto.longitude), Cesium.Math.toDegrees(carto.latitude));
            // @ts-ignore
            return proj.s_project(new Cesium.Cartographic(Cesium.Math.toRadians(p[0]), Cesium.Math.toRadians(p[1])));
        };

        proj.s_unproject = proj.unproject;
        // @ts-ignore
        proj.unproject = function (coord) {
            var carto = proj.s_unproject(coord);
            var p = {};
            p = coordTransform.wgs84togcj02(Cesium.Math.toDegrees(carto.longitude), Cesium.Math.toDegrees(carto.latitude));
            // @ts-ignore
            return new Cesium.Cartographic(Cesium.Math.toRadians(p[0]), Cesium.Math.toRadians(p[1]));
        };

        // 重写rectangle
        // @ts-ignore
        var southwest = this._projection.unproject(this._rectangleSouthwestInMeters);
        // @ts-ignore
        var northeast = this._projection.unproject(this._rectangleNortheastInMeters);
        // @ts-ignore
        this._rectangle = new Cesium.Rectangle(southwest.longitude, southwest.latitude,
            northeast.longitude, northeast.latitude);
    }
}

class ToWGS84WebMercatorTilingScheme extends Cesium.WebMercatorTilingScheme {
    constructor(options: {
        ellipsoid?: Cesium.Ellipsoid;
        numberOfLevelZeroTilesX?: number;
        numberOfLevelZeroTilesY?: number;
        rectangleSouthwestInMeters?: Cesium.Cartesian2;
        rectangleNortheastInMeters?: Cesium.Cartesian2;
    }) {
        super(options);

        // @ts-ignore
        var proj = this._projection
        proj.s_project = proj.project;
        // @ts-ignore
        proj.project = function (carto) {
            var p = {};
            p = coordTransform.wgs84togcj02(Cesium.Math.toDegrees(carto.longitude), Cesium.Math.toDegrees(carto.latitude));
            // @ts-ignore
            return proj.s_project(new Cesium.Cartographic(Cesium.Math.toRadians(p[0]), Cesium.Math.toRadians(p[1])));
        };

        proj.s_unproject = proj.unproject;
        // @ts-ignore
        proj.unproject = function (coord) {
            var carto = proj.s_unproject(coord);
            var p = {};
            p = coordTransform.gcj02towgs84(Cesium.Math.toDegrees(carto.longitude), Cesium.Math.toDegrees(carto.latitude));
            // @ts-ignore
            return new Cesium.Cartographic(Cesium.Math.toRadians(p[0]), Cesium.Math.toRadians(p[1]));
        };
    }
}

export { ToGCJ02WebMercatorTilingScheme, ToWGS84WebMercatorTilingScheme };