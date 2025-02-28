import * as Cesium from 'cesium';

export declare class BDImageryProvider extends Cesium.ImageryProvider{
    constructor(options: {
        url?: string;
        ellipsoid?: Cesium.Ellipsoid;
        wgs84?: boolean;
    });
}
