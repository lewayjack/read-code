import { ComplexImageType } from "xbsj-base";

export type CzmTextureCopyParams = {
    source: {
        width: number;
        height: number;
        arrayBufferView: ArrayBufferView;
    } | ImageData | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement;
    xOffset?: number;
    yOffset?: number;
    skipColorSpaceConversion?: boolean; // false
}

export type CzmTextureUriTypeType = ComplexImageType;