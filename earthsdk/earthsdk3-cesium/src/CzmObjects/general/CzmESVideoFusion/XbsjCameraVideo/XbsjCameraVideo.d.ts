import * as Cesium from 'cesium';

export declare class XbsjCameraVideo {
    constructor(options: {
        inverseViewMatrix: Cesium.Matrix4,
        frustum: Cesium.PerspectiveFrustum,
        // videoElement: HTMLVideoElement | string | undefined,
        videoTextureFunc?: (() => Cesium.Texture | undefined) | undefined,
        alphaTextureFunc?: (() => Cesium.Texture | undefined) | undefined,
        showHelperPrimitive: true,
    });
    // videoElement: HTMLVideoElement | string | undefined;
    // alphaImage: string;
    videoTextureFunc: (() => Cesium.Texture | undefined) | undefined;
    alphaTextureFunc: (() => Cesium.Texture | undefined) | undefined;
    showHelperPrimitive: boolean;
    destroy(): void;
}
