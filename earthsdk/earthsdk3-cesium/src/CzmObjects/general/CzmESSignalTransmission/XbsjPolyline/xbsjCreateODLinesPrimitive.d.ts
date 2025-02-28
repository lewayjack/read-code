import * as Cesium from 'cesium';
import { XbsjRoutePath } from './XbsjRoutePath';
import { SceneObjectKey } from 'xbsj-base';

export type XbsjPositionCallbackResultType = {
    timeRatio: number;
    repeat: number;
    color: [number, number, number, number];
    bgColor: [number, number, number, number];
    bidirectional: 0 | 1 | 2 | 3; // 0/1表示单向，2表示双向, 3表示无信号
};

export type XbsjODLinesPostionCallback = (
    instanceIndex: number,
    frameState: Cesium.FrameState,
    result: XbsjPositionCallbackResultType,
) => XbsjPositionCallbackResultType;

export default function xbsjCreateODLinesPrimitive(
    routePaths: XbsjRoutePath[],
    color: [number, number, number, number],
    arcType: Cesium.ArcType,
    postionCallback: (instanceIndex: number, frameState: Cesium.FrameState | undefined, result: XbsjPositionCallbackResultType) => XbsjPositionCallbackResultType,
    brightening?: boolean,
    depthTest?: boolean,
    getTextureFunc?: () => Cesium.Texture,
    id?: SceneObjectKey
): Cesium.Primitive;

