import { ESSceneObject, PickedInfo } from "earthsdk3";
import { ESCesiumViewer, getViewerExtensions } from "../../../../ESCesiumViewer";
import { CzmImageryProviderJsonType, CzmTilingSchemaJsonType } from "../../../../ESJTypesCzm";
import { Destroyable, extendClassProps, Listener, reactArrayWithUndefined, ReactivePropsToNativePropsAndChanged, reactJsonWithUndefined, Event, react, createProcessingFromAsyncFunc, createNextAnimateFrameEvent, SceneObjectKey } from "xbsj-base";
import * as Cesium from 'cesium';
import { createImageryProviderFromJson, needRecreate, updateImageryProviderFromJson } from "./imageryProviderUtils";
import { rectangleIsGlobal, toRectangle } from "../../../../utils";

export * from './extends/tilingScheme';

export function getTilingSchemeStr(tilingScheme: CzmTilingSchemaJsonType) {
    if (tilingScheme.type === 'GeographicTilingScheme') {
        return `new Cesium.GeographicTilingScheme()`;

    } else if (tilingScheme.type === 'WebMercatorTilingScheme') {
        return `new Cesium.WebMercatorTilingScheme()`;
    }
}

export function getCzmCode(imageryProviderJson: CzmImageryProviderJsonType) {
    if (imageryProviderJson.type === 'UrlTemplateImageryProvider') {
        const { customTags } = imageryProviderJson;

        let customTagsStr = '';
        if (customTags) {
            customTagsStr += 'customTags: {\n';
            for (let [k, v] of Object.entries(customTags)) {
                customTagsStr += `        "${k}": ${v},\n`;
            }
            customTagsStr += '    }';
        }

        let tilingSchemeStr = imageryProviderJson.tilingScheme ? `tilingScheme: ${getTilingSchemeStr(imageryProviderJson.tilingScheme)}` : '';

        const { getStrFromEnv } = ESSceneObject.context;

        return `
const imageryProvider = new Cesium.UrlTemplateImageryProvider({
    url: "${getStrFromEnv(typeof imageryProviderJson.url == "string" ? imageryProviderJson.url : imageryProviderJson.url.url)}",\
${tilingSchemeStr && '\n    ' + tilingSchemeStr + ','}\
${customTagsStr && '\n    ' + customTagsStr + ','}
});
viewer.imageryLayers.addImageryProvider(imageryProvider);
        `;
    } else {
        // 只支持UrlTemplateImageryProvider类型的配置转换成Cesium代码
        return undefined;
    }
}

export function getCzmCodeFromCzmImagery(czmImagery: CzmImagery) {
    if (!czmImagery.imageryProvider) {
        console.warn(`还未配置provider！无法导出Cesium代码！`);
        return undefined;
    }

    if (czmImagery.imageryProvider.type !== 'UrlTemplateImageryProvider') {
        console.warn(`暂时只支持UrlTemplateImageryProvider的影像导出成纯Cesium代码。`);
        return undefined;
    }

    const imageryProviderJson = czmImagery.imageryProvider;
    const { getStrFromEnv } = ESSceneObject.context;

    if (!imageryProviderJson.url) return undefined;
    const configs: string[] = [];
    const tempImageryProviderJson = JSON.parse(JSON.stringify(imageryProviderJson));
    if (typeof tempImageryProviderJson.url != "string") {
        tempImageryProviderJson.url.url = getStrFromEnv(tempImageryProviderJson.url.url);
    } else {
        tempImageryProviderJson.url = getStrFromEnv(tempImageryProviderJson.url);
    }
    imageryProviderJson.url && configs.push(`url: '${tempImageryProviderJson.url}'`);
    imageryProviderJson.minimumLevel && configs.push(`minimumLevel: ${imageryProviderJson.minimumLevel}`);
    imageryProviderJson.maximumLevel && configs.push(`maximumLevel: ${imageryProviderJson.maximumLevel}`);
    imageryProviderJson.credit && configs.push(`credit: '${imageryProviderJson.credit}'`);
    imageryProviderJson.rectangle && configs.push(`rectangle: Cesium.Rectangle.fromDegrees(${imageryProviderJson.rectangle.join(', ')})`);
    // imageryProviderJson.tilingScheme && configs.push(`tilingScheme: ${imageryProviderJson.tilingScheme}`);

    if (imageryProviderJson.tilingScheme) {
        if (imageryProviderJson.tilingScheme.type === 'GeographicTilingScheme') {
            configs.push(`tilingScheme: new Cesium.GeographicTilingScheme()`);
        } else if (imageryProviderJson.tilingScheme.type === 'WebMercatorTilingScheme') {
            configs.push(`tilingScheme: new Cesium.WebMercatorTilingScheme()`);
        } else if (imageryProviderJson.tilingScheme.type === 'ToGCJ02WebMercatorTilingScheme') {
            configs.push(`tilingScheme: new Cesium.WebMercatorTilingScheme()`);
        } else if (imageryProviderJson.tilingScheme.type === 'ToWGS84WebMercatorTilingScheme') {
            configs.push(`tilingScheme: new Cesium.WebMercatorTilingScheme()`);
        }
    }

    imageryProviderJson.tileWidth && configs.push(`tileWidth: ${imageryProviderJson.tileWidth}`);
    imageryProviderJson.tileHeight && configs.push(`tileHeight: ${imageryProviderJson.tileHeight}`);
    if (imageryProviderJson.subdomains) {
        if (Array.isArray(imageryProviderJson.subdomains)) {
            configs.push(`subdomains: [${imageryProviderJson.subdomains.map(e => `'${e}'`).join(', ')}]`);
        } else {
            configs.push(`subdomains: '${imageryProviderJson.subdomains}'`);
        }
    }
    imageryProviderJson.hasAlphaChannel && configs.push(`hasAlphaChannel: ${imageryProviderJson.hasAlphaChannel}`);
    if (imageryProviderJson.pickFeaturesUrl) {
        if (typeof imageryProviderJson.pickFeaturesUrl === 'string') {
            configs.push(`pickFeaturesUrl: '${imageryProviderJson.pickFeaturesUrl}'`);
        }
    }

    const czmCode = `\
var imageryProvider = new Cesium.UrlTemplateImageryProvider({
${configs.map(e => `    ${e}`).join(', \n')}
});
viewer.imageryLayers.addImageryProvider(imageryProvider);\
`;

    return czmCode;
}

export class CzmImagery extends Destroyable {
    private _flyToEvent = this.disposeVar(new Event<[number | undefined]>());
    get flyToEvent(): Listener<[number | undefined]> { return this._flyToEvent; }
    flyTo(duration?: number) { this._flyToEvent.emit(duration); }

    getCzmCode() {
        if (!this.imageryProvider) return;
        // return getCzmCode(this.imageryProvider);
        return getCzmCodeFromCzmImagery(this);
    }

    private _layer = this.disposeVar(react<Cesium.ImageryLayer | undefined>(undefined));
    get layer() { return this._layer.value; }
    // set layer(value: typeof this._layer.value) { this._layer.value = value; }
    set layer(value: Cesium.ImageryLayer | undefined) { this._layer.value = value; }
    get layerChanged() { return this._layer.changed; }

    constructor(czmViewer: ESCesiumViewer, id?: SceneObjectKey) {
        super();
        const viewer = czmViewer.viewer;
        if (!viewer) {
            return
        }

        const viewerExtensions = getViewerExtensions(viewer);
        if (!viewerExtensions) {
            return;
        }

        const { imageriesManager } = viewerExtensions;

        imageriesManager.add(this);
        this.dispose(() => imageriesManager.delete(this));

        const resetImageryLayer = () => {
            if (this.layer) {
                this.layer = undefined;
            }
        }
        this.dispose(resetImageryLayer);

        const updateImagery = () => {
            if (!this.layer) {
                return;
            }
            this.layer.alpha = this.alpha ?? 1.0;
            this.layer.nightAlpha = this.nightAlpha ?? 1.0;
            this.layer.dayAlpha = this.dayAlpha ?? 1.0;
            this.layer.brightness = this.brightness ?? 1.0;
            this.layer.contrast = this.contrast ?? 1.0;
            this.layer.hue = this.hue ?? 0.0;
            this.layer.saturation = this.saturation ?? 1.0;
            this.layer.gamma = this.gamma ?? 1.0;
            // Cesium 1.83版同时存在 ImagerySplitDirection 和 SplitDirection，但实际数值是一样的！所以加个ignore vtxf 2022-6-7
            this.layer.splitDirection = this.splitDirection && Cesium.SplitDirection[this.splitDirection] || Cesium.SplitDirection.NONE;
            this.layer.minificationFilter = this.minificationFilter && Cesium.TextureMinificationFilter[this.minificationFilter] || Cesium.TextureMinificationFilter.LINEAR;
            this.layer.magnificationFilter = this.magnificationFilter && Cesium.TextureMagnificationFilter[this.magnificationFilter] || Cesium.TextureMagnificationFilter.LINEAR;
            this.layer.show = this.show ?? true;
            // @ts-ignore
            this.layer.maximumAnisotropy = this.maximumAnisotropy;
            // @ts-ignore
            this.layer.minimumTerrainLevel = this.minimumTerrainLevel;
            // @ts-ignore
            this.layer.maximumTerrainLevel = this.maximumTerrainLevel;
            // @ts-ignore
            this.layer.colorToAlpha = this.colorToAlpha && toColor(this.colorToAlpha);
            this.layer.colorToAlphaThreshold = this.colorToAlphaThreshold ?? 0.004;

            if (!this.imageryProvider) return;
            updateImageryProviderFromJson(this.layer.imageryProvider, this.imageryProvider);
        };

        let recreating = false;
        const recreateAndUpdateImageryProcessing = this.disposeVar(createProcessingFromAsyncFunc<void, [recreate: boolean]>(async (cancelsManager, recreate) => {
            if (recreate) {
                recreating = true;
                resetImageryLayer();

                if (!this.imageryProvider) return undefined;
                const imageryProvider = await cancelsManager.promise(createImageryProviderFromJson(this.imageryProvider, czmViewer));
                if (!imageryProvider) {
                    console.error(`createImageryProviderFromJson error!`);
                    return undefined;
                }
                this.layer = new Cesium.ImageryLayer(imageryProvider);
                //@ts-ignore
                Cesium.ImageryLayer.prototype && (this.layer.ESSceneObjectID = id);
                recreating = false;
            }
            updateImagery();
        }));

        // recreateImagery();
        // updateImagery();
        recreateAndUpdateImageryProcessing.restart(undefined, true);

        const createProviderEvent = this.disposeVar(new Event());
        const updateProviderEvent = this.disposeVar(new Event());

        this.dispose(this.imageryProviderChanged.disposableOn((imageryProvider, oldImageryProvider) => {
            if (needRecreate(oldImageryProvider, imageryProvider)) {
                createProviderEvent.emit();
            } else {
                updateProviderEvent.emit();
            }
        }));

        this.dispose(ESSceneObject.context.environmentVariablesChanged.disposableOn(() => {
            createProviderEvent.emit();
        }));

        const recreateEvent = this.disposeVar(createNextAnimateFrameEvent(
            this.rectangleChanged,
            createProviderEvent,
        ));

        this.dispose(recreateEvent.disposableOn(() => {
            // recreateImagery();
            // updateImagery();
            recreateAndUpdateImageryProcessing.restart(undefined, true);
        }));

        const updateEvent = this.disposeVar(createNextAnimateFrameEvent(
            this.alphaChanged,
            this.nightAlphaChanged,
            this.dayAlphaChanged,
            this.brightnessChanged,
            this.contrastChanged,
            this.hueChanged,
            this.saturationChanged,
            this.gammaChanged,
            this.splitDirectionChanged,
            this.minificationFilterChanged,
            this.magnificationFilterChanged,
            this.showChanged,
            this.maximumAnisotropyChanged,
            this.minimumTerrainLevelChanged,
            this.maximumTerrainLevelChanged,
            this.cutoutRectangleChanged,
            this.colorToAlphaChanged,
            this.colorToAlphaThresholdChanged,
            updateProviderEvent,
        ));
        this.dispose(updateEvent.disposableOn(() => {
            if (recreating) return;
            recreateAndUpdateImageryProcessing.restart(undefined, false);
            // updateImagery();
        }));

        this.dispose(this.flyToEvent.disposableOn(duration => {
            if (!czmViewer.actived) {
                return;
            }
            // flyTo layer 不能飞到指定区域 TODO
            // this.layer && viewer.flyTo(this.layer, { duration, });

            const { viewer } = czmViewer;
            if (!viewer) {
                return;
            }
            viewer.camera.flyTo({
                destination: this.rectangle && !rectangleIsGlobal(this.rectangle) ? toRectangle(this.rectangle) : Cesium.Camera.DEFAULT_VIEW_RECTANGLE,
                duration,
            });
        }));
    }
    static defaults = {
        show: true,
        rectangle: [-180, -90, 180, 90] as [number, number, number, number],
        alpha: 1,
        nightAlpha: 1,
        dayAlpha: 1,
        brightness: 1,
        contrast: 1,
        hue: 0,
        saturation: 1,
        gamma: 1,
        splitDirection: 'NONE' as CzmSplitDirectionType,
        minificationFilter: "LINEAR" as CzmTextureMinificationFilterType,
        magnificationFilter: "LINEAR" as CzmTextureMagnificationFilterType,
        maximumAnisotropy: 0,
        minimumTerrainLevel: 0,
        maximumTerrainLevel: 0,
        cutoutRectangle: [1, 1, 1, 1] as [number, number, number, number],
        colorToAlpha: [1, 1, 1, .5] as [number, number, number, number],
        colorToAlphaThreshold: 0.004,
        imageryProvider: { type: 'TileMapServiceImageryProvider' } as CzmImageryProviderJsonType,
        zIndex: 0,
        hasAlphaChannel: true,
        pickFeaturesUrl: '',
        // enablePickFeatures: true,
    }
}

export type CzmSplitDirectionType = 'LEFT' | 'NONE' | 'RIGHT';
export type CzmTextureMinificationFilterType = 'NEAREST' | 'LINEAR' | 'NEAREST_MIPMAP_NEAREST' | 'LINEAR_MIPMAP_NEAREST' | 'NEAREST_MIPMAP_LINEAR' | 'LINEAR_MIPMAP_LINEAR';
export type CzmTextureMagnificationFilterType = 'NEAREST' | 'LINEAR';

export namespace CzmImagery {
    export const createDefaultProps = () => ({
        show: undefined as boolean | undefined, //	Boolean	true	optionalTrue if the layer is shown; otherwise, false.
        rectangle: reactArrayWithUndefined<[west: number, south: number, east: number, north: number]>(undefined), //	Rectangle	imageryProvider.rectangle	optionalThe rectangle of the layer. This rectangle can limit the visible portion of the this provider.
        alpha: undefined as number | undefined, //	Number | function	1.0	optionalThe alpha blending value of this layer, from 0.0 to 1.0. This can either be a simple number or a function with the signature function(frameState, layer, x, y, level). The function is passed the current frame state, this layer, and the x, y, and level coordinates of the this tile for which the alpha is required, and it is expected to return the alpha value to use for the tile.
        nightAlpha: undefined as number | undefined, //	Number | function	1.0	optionalThe alpha blending value of this layer on the night side of the globe, from 0.0 to 1.0. This can either be a simple number or a function with the signature function(frameState, layer, x, y, level). The function is passed the current frame state, this layer, and the x, y, and level coordinates of the this tile for which the alpha is required, and it is expected to return the alpha value to use for the tile. This only takes effect when enableLighting is true.
        dayAlpha: undefined as number | undefined, //	Number | function	1.0	optionalThe alpha blending value of this layer on the day side of the globe, from 0.0 to 1.0. This can either be a simple number or a function with the signature function(frameState, layer, x, y, level). The function is passed the current frame state, this layer, and the x, y, and level coordinates of the this tile for which the alpha is required, and it is expected to return the alpha value to use for the tile. This only takes effect when enableLighting is true.
        brightness: undefined as number | undefined, //	Number | function	1.0	optionalThe brightness of this layer. 1.0 uses the unmodified this color. Less than 1.0 makes the this darker while greater than 1.0 makes it brighter. This can either be a simple number or a function with the signature function(frameState, layer, x, y, level). The function is passed the current frame state, this layer, and the x, y, and level coordinates of the this tile for which the brightness is required, and it is expected to return the brightness value to use for the tile. The function is executed for every frame and for every tile, so it must be fast.
        contrast: undefined as number | undefined, //	Number | function	1.0	optionalThe contrast of this layer. 1.0 uses the unmodified this color. Less than 1.0 reduces the contrast while greater than 1.0 increases it. This can either be a simple number or a function with the signature function(frameState, layer, x, y, level). The function is passed the current frame state, this layer, and the x, y, and level coordinates of the this tile for which the contrast is required, and it is expected to return the contrast value to use for the tile. The function is executed for every frame and for every tile, so it must be fast.
        hue: undefined as number | undefined, //	Number | function	0.0	optionalThe hue of this layer. 0.0 uses the unmodified this color. This can either be a simple number or a function with the signature function(frameState, layer, x, y, level). The function is passed the current frame state, this layer, and the x, y, and level coordinates of the this tile for which the hue is required, and it is expected to return the contrast value to use for the tile. The function is executed for every frame and for every tile, so it must be fast.
        saturation: undefined as number | undefined, //	Number | function	1.0	optionalThe saturation of this layer. 1.0 uses the unmodified this color. Less than 1.0 reduces the saturation while greater than 1.0 increases it. This can either be a simple number or a function with the signature function(frameState, layer, x, y, level). The function is passed the current frame state, this layer, and the x, y, and level coordinates of the this tile for which the saturation is required, and it is expected to return the contrast value to use for the tile. The function is executed for every frame and for every tile, so it must be fast.
        gamma: undefined as number | undefined, //	Number | function	1.0	optionalThe gamma correction to apply to this layer. 1.0 uses the unmodified this color. This can either be a simple number or a function with the signature function(frameState, layer, x, y, level). The function is passed the current frame state, this layer, and the x, y, and level coordinates of the this tile for which the gamma is required, and it is expected to return the gamma value to use for the tile. The function is executed for every frame and for every tile, so it must be fast.
        splitDirection: undefined as CzmSplitDirectionType | undefined, //	ImagerySplitDirection | function	ImagerySplitDirection.NONE	optionalThe ImagerySplitDirection split to apply to this layer.
        minificationFilter: undefined as CzmTextureMinificationFilterType | undefined, //	TextureMinificationFilter	TextureMinificationFilter.LINEAR	optionalThe texture minification filter to apply to this layer. Possible values are TextureMinificationFilter.LINEAR and TextureMinificationFilter.NEAREST.
        magnificationFilter: undefined as CzmTextureMagnificationFilterType | undefined, //	TextureMagnificationFilter	TextureMagnificationFilter.LINEAR	optionalThe texture minification filter to apply to this layer. Possible values are TextureMagnificationFilter.LINEAR and TextureMagnificationFilter.NEAREST.
        maximumAnisotropy: undefined as number | undefined, //	Number	maximum supported	optionalThe maximum anisotropy level to use for texture filtering. If this parameter is not specified, the maximum anisotropy supported by the WebGL stack will be used. Larger values make the this look better in horizon views.
        minimumTerrainLevel: undefined as number | undefined, //	Number		optionalThe minimum terrain level-of-detail at which to show this this layer, or undefined to show it at all levels. Level zero is the least-detailed level.
        maximumTerrainLevel: undefined as number | undefined, //	Number		optionalThe maximum terrain level-of-detail at which to show this this layer, or undefined to show it at all levels. Level zero is the least-detailed level.
        cutoutRectangle: reactArrayWithUndefined<[west: number, south: number, east: number, north: number]>(undefined),//	Rectangle		optionalCartographic rectangle for cutting out a portion of this ImageryLayer.
        colorToAlpha: reactArrayWithUndefined<[number, number, number, number] | undefined>(undefined),
        colorToAlphaThreshold: undefined as number | undefined, //	Number	0.004	optionalThreshold for color-to-alpha.
        // imageryProvider: reactJsonWithUndefined({ type: 'TileMapServiceImageryProvider' } as CzmImageryProviderJsonType),
        imageryProvider: reactJsonWithUndefined<CzmImageryProviderJsonType>(undefined),
        zIndex: 0, // 非原始Czm属性，为了设置影像的层级关系而添加
        hasAlphaChannel: undefined as boolean | undefined,
        pickFeaturesUrl: undefined as string | undefined,
        // enablePickFeatures: undefined as boolean | undefined,
        // urlSchemeZeroPadding?: Object,
        // getFeatureInfoFormats?: Array<any>;//	Array.<GetFeatureInfoFormat>
        // customTags?: object;
    });
}
extendClassProps(CzmImagery.prototype, CzmImagery.createDefaultProps);
export interface CzmImagery extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof CzmImagery.createDefaultProps>> { }