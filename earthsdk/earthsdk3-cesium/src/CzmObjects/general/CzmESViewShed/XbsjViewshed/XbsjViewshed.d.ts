import * as Cesium from 'cesium';

export declare class XbsjViewshed {
    constructor(scene: Cesium.Scene, id?: string);
    enabled: boolean;
    showHelper: boolean;
    fovH: number;
    fovV: number;
    near: number;
    far: number;
    position: Cesium.Cartesian3;
    heading: number;
    pitch: number;
    roll: number;
    destroy(): void;
}