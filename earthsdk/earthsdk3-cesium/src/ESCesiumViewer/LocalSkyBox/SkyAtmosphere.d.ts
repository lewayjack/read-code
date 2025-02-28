import * as Cesium from 'cesium';

declare class SkyAtmosphere {
    constructor(ellipsoid: Cesium.Ellipsoid | undefined, sources: {
        positiveX: string;
        negativeX: string;
        positiveY: string;
        negativeY: string;
        positiveZ: string;
        negativeZ: string;
    });
}

export = SkyAtmosphere;