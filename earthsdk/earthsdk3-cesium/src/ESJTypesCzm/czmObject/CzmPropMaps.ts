import * as Cesium from 'cesium';
import { ESJNativeNumber16, ESJVector3D } from "earthsdk3";
import { Event } from 'xbsj-base';

export type CzmClassificationType = 'TERRAIN' | 'CESIUM_3D_TILE' | 'BOTH' | 'NONE';
export type CzmSplitDirection = "LEFT" | "NONE" | "RIGHT";
export type CzmAxis = "X" | "Y" | "Z";
export type CzmShadowMode = 'DISABLED' | 'ENABLED' | 'CAST_ONLY' | 'RECEIVE_ONLY';
export const czmEllipsoidWGS84: [number, number, number] = [6378137.0, 6378137.0, 6356752.3142451793];

export type CzmImageBasedLightingJsonType = {
    imageBasedLightingFactor?: [number, number];
    luminanceAtZenith?: number;
    atmosphereScatteringIntensity?:number
    sphericalHarmonicCoefficients?: [ESJVector3D, ESJVector3D, ESJVector3D, ESJVector3D, ESJVector3D, ESJVector3D, ESJVector3D, ESJVector3D, ESJVector3D];
    specularEnvironmentMaps?: string;
};

export interface CzmClippingPlanesType {
    computedClippingPlanes: CzmClippingPlaneCollectionJsonType | undefined;
    computedClippingPlanesChanged: Event<[CzmClippingPlaneCollectionJsonType | undefined, CzmClippingPlaneCollectionJsonType | undefined]>;
}

export type CzmClippingPlaneJsonType = {
    normal: [number, number, number];
    distance: number;
};

export type CzmClippingPlaneCollectionJsonType = {
    planes?: CzmClippingPlaneJsonType[];
    enabled?: boolean; // true
    modelMatrix?: ESJNativeNumber16; // Matrix4.IDENTITY
    unionClippingRegions?: boolean; // false 
    edgeColor?: [number, number, number, number]; // Color.White
    edgeWidth?: number; // 0
};

export type CzmClippingPolygonType = {
    positions: [number, number, number][];
    ellipsoid?: any;//Cesium.Ellipsoid.default
}

export type CzmClippingPolygonCollectionJsonType = {
    polygons: CzmClippingPolygonType[];
    enabled?: boolean;//true
    inverse?: boolean;//false
}

export type CzmPointCloudShadingJsonType = {
    attenuation: boolean; //	false	optionalPerform point attenuation based on geometric error.
    geometricErrorScale: number; //	1.0	optionalScale to be applied to each tile's geometric error.
    maximumAttenuation: number; //		optionalMaximum attenuation in pixels. Defaults to the Cesium3DTileset's maximumScreenSpaceError.
    baseResolution?: number; //		optionalAverage base resolution for the dataset in meters. Substitute for Geometric Error when not available.
    eyeDomeLighting: boolean; //	true	optionalWhen true, use eye dome lighting when drawing with point attenuation.
    eyeDomeLightingStrength: number; //	1.0	optionalIncreasing this value increases contrast on slopes and edges.
    eyeDomeLightingRadius: number; //	1.0	optionalIncrease the thickness of contours from eye dome lighting.
    backFaceCulling: boolean; //	false	optionalDetermines whether back-facing points are hidden. This option works only if data has normals included.
    normalShading: boolean; //	true	optionalDetermines whether a point cloud that contains normals is shaded by the scene's light source.
}

/**
 * Cesium中枚举类型映射
 */
export namespace czmPropMaps {
    export const heightReferencePropsMap = {
        'NONE': Cesium.HeightReference.NONE,
        'CLAMP_TO_GROUND': Cesium.HeightReference.CLAMP_TO_GROUND,
        'RELATIVE_TO_GROUND': Cesium.HeightReference.RELATIVE_TO_GROUND,
    };

    export const shadowPropsMap = {
        'DISABLED': Cesium.ShadowMode.DISABLED,
        'CAST_ONLY': Cesium.ShadowMode.CAST_ONLY,
        'ENABLED': Cesium.ShadowMode.ENABLED,
        'RECEIVE_ONLY': Cesium.ShadowMode.RECEIVE_ONLY,
    }
    //编译报错，未使用便注释//TODO
    // export const splitDirectionTypeMap = {
    //     'LEFT': Cesium.SplitDirection.LEFT,
    //     'RIGHT': Cesium.SplitDirection.RIGHT,
    //     'NONE': Cesium.SplitDirection.NONE,
    // }
    export const classificationTypeMap = {
        'TERRAIN': Cesium.ClassificationType.TERRAIN,
        'CESIUM_3D_TILE': Cesium.ClassificationType.CESIUM_3D_TILE,
        'BOTH': Cesium.ClassificationType.BOTH,
        'NONE': undefined,
    }
    export const textureMinificationFilterType = {
        'NEAREST': Cesium.TextureMinificationFilter.NEAREST,
        'LINEAR': Cesium.TextureMinificationFilter.LINEAR,
        'NEAREST_MIPMAP_NEAREST': Cesium.TextureMinificationFilter.NEAREST_MIPMAP_NEAREST,
        'LINEAR_MIPMAP_NEAREST': Cesium.TextureMinificationFilter.LINEAR_MIPMAP_NEAREST,
        'NEAREST_MIPMAP_LINEAR': Cesium.TextureMinificationFilter.NEAREST_MIPMAP_LINEAR,
        'LINEAR_MIPMAP_LINEAR': Cesium.TextureMinificationFilter.LINEAR_MIPMAP_LINEAR,
    }
    export const textureMagnificationFilterType = {
        'NEAREST': Cesium.TextureMagnificationFilter.NEAREST,
        'LINEAR': Cesium.TextureMagnificationFilter.LINEAR,
    }
    export const colorBlendModeType = {
        "HIGHLIGHT": Cesium.ColorBlendMode.HIGHLIGHT,
        "REPLACE": Cesium.ColorBlendMode.REPLACE,
        "MIX": Cesium.ColorBlendMode.MIX,
    }
    export const horizontalOriginType = {
        "CENTER": Cesium.HorizontalOrigin.CENTER,
        "LEFT": Cesium.HorizontalOrigin.LEFT,
        "RIGHT": Cesium.HorizontalOrigin.RIGHT
    }
    export const verticalOriginOriginType = {
        "CENTER": Cesium.VerticalOrigin.CENTER,
        "BOTTOM": Cesium.VerticalOrigin.BOTTOM,
        "BASELINE": Cesium.VerticalOrigin.BASELINE,
        "TOP": Cesium.VerticalOrigin.TOP,
    }
    export const labelStyleType = {
        "FILL": Cesium.LabelStyle.FILL,
        "OUTLINE": Cesium.LabelStyle.OUTLINE,
        "FILL_AND_OUTLINE": Cesium.LabelStyle.FILL_AND_OUTLINE
    }

    export const blendOptionType = {
        "OPAQUE": Cesium.BlendOption.OPAQUE,
        "TRANSLUCENT": Cesium.BlendOption.TRANSLUCENT,
        "OPAQUE_AND_TRANSLUCENT": Cesium.BlendOption.OPAQUE_AND_TRANSLUCENT
    }
}
