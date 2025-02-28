import * as Cesium from 'cesium';
import { ESViewer } from "earthsdk3";
import { CzmModelPrimitive } from '../../CzmObjects';
export type CzmPassType =
    'ENVIRONMENT' |
    'COMPUTE' |
    'GLOBE' |
    'TERRAIN_CLASSIFICATION' |
    'CESIUM_3D_TILE' |
    'CESIUM_3D_TILE_CLASSIFICATION' |
    'CESIUM_3D_TILE_CLASSIFICATION_IGNORE_SHOW' |
    'OPAQUE' |
    'TRANSLUCENT' |
    'OVERLAY' |
    'NUMBER_OF_PASSES';

export type CzmModelNodeTransformation = {
    translationX: number;
    translationY: number;
    translationZ: number;
    rotationHeading: number;
    rotationPitch: number;
    rotationRoll: number;
    scaleX: number;
    scaleY: number;
    scaleZ: number;
};

export type CzmModelNodeTransformations = {
    [nodeName: string]: CzmModelNodeTransformation
};
export type CzmModelAnimationLoopType = 'NONE' | 'REPEAT' | 'MIRRORED_REPEAT';

export type CzmModelAnimationType = {
    name?: string;
    index?: number;
    startTime?: Cesium.JulianDate;
    delay?: number; // 0.0 seconds
    stopTime?: Cesium.JulianDate;
    removeOnStop?: boolean; // false
    multiplier?: number; // 1.0
    reverse?: boolean; // false
    loop?: Cesium.ModelAnimationLoop; // 
    animationTime?: (duration: number, seconds: number) => number;
};

export type CzmModelAnimationJsonType = {
    name?: string;
    index?: number;
    startTime?: number; // timeStamp -> Cesium.JulianDate
    delay?: number; // 0.0 seconds
    stopTime?: number; // timeStamp -> Cesium.JulianDate
    removeOnStop?: boolean; // false
    multiplier?: number; // 1.0
    reverse?: boolean; // false
    loop?: CzmModelAnimationLoopType; // 
    animationTime?: string;
};
export type CzmModelPrimitiveCustomShaderClassType = { destroy(): undefined; get customShader(): any };
export type CzmModelPrimitiveCustomShaderInstanceClassType = new (czmModelPrimitive: CzmModelPrimitive, viewer: ESViewer) => CzmModelPrimitiveCustomShaderClassType;
