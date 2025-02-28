import { ESImageryLayer, ESJResource, ESSceneObject } from "earthsdk3";
import { CzmESVisualObject, CzmImagery } from "../../base";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { CzmImageryProviderJsonType } from "../../../ESJTypesCzm";
import { createNextAnimateFrameEvent, reactJson, track } from "xbsj-base";

function getoptionsType(str: "tms" | "xyz" | "wms" | "wmts" | 'ion') {
    switch (str) {
        case 'wms':
            return 'WebMapServiceImageryProvider' as const;
        case 'tms':
            return 'TileMapServiceImageryProvider' as const;
        case 'wmts':
            return 'WebMapTileServiceImageryProvider' as const;
        case 'xyz':
            return 'UrlTemplateImageryProvider' as const;
        case 'ion':
            return 'IonImageryProvider' as const;
    }
}
export class CzmESImageryLayer extends CzmESVisualObject<ESImageryLayer> {

    static readonly type = this.register("ESCesiumViewer", ESImageryLayer.type, this);
    private _czmImagery;
    get czmImagery() { return this._czmImagery; }

    constructor(sceneObject: ESImageryLayer, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);
        this._czmImagery = this.dv(new CzmImagery(czmViewer, sceneObject.id));
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }

        const czmImagery = this._czmImagery;
        {
            const urlReact = this.ad(reactJson<string | ESJResource>(""))
            {
                const update = () => {
                    if (typeof sceneObject.url === 'string') {
                        urlReact.value = ESSceneObject.context.getStrFromEnv(sceneObject.url);
                    } else {
                        const temp = sceneObject.url;
                        temp.url = ESSceneObject.context.getStrFromEnv(temp.url);
                        urlReact.value = temp;
                    }
                }
                update();
                this.ad(sceneObject.urlChanged.don(update))
            }
            const update = () => {
                if (!urlReact.value) return;
                const optionsType = ((sceneObject.options?.type) ?? 'auto').toLowerCase() as "tms" | "xyz" | "wms" | "wmts" | "auto" | 'ion';
                const options = sceneObject.options ?? {}
                let provider: any = {
                    type: 'UrlTemplateImageryProvider',
                    url: urlReact.value,
                    rectangle: sceneObject.rectangle,
                    maximumLevel: sceneObject.maximumLevel,
                    minimumLevel: sceneObject.minimumLevel,
                    ...options,
                }
                let temp = urlReact.value;
                let tempUrl = typeof temp === 'string' ? temp : temp.url;
                if (optionsType === 'auto') {
                    // - ion://: 检查url是否ion://开头
                    // - xyz：{x} {y} {z}
                    // - wmts的url中含有wmts
                    // - wms的url中含有wms
                    // - 其余使用tms就可以了
                    const lowUrl = tempUrl.toLowerCase()//字符串小写
                    if (lowUrl.startsWith('ion://')) {
                        const idStr = lowUrl.substring('ion://'.length);
                        const id = +idStr;
                        provider = {
                            ...options,
                            assetId: id,
                            type: 'IonImageryProvider',
                        }
                    } else if (lowUrl.includes("{x}") || lowUrl.includes("{y}") || lowUrl.includes("{z}")) {
                        provider.type = 'UrlTemplateImageryProvider';
                    } else if (lowUrl.includes('wmts')) {
                        provider.type = 'WebMapTileServiceImageryProvider';
                    } else if (lowUrl.includes('wms')) {
                        provider.type = 'WebMapServiceImageryProvider';
                    } else {
                        //tms
                        if (tempUrl.includes('/tilemapresource.xml')) {
                            const tmsUrl = tempUrl.split("/tilemapresource.xml").join("");
                            typeof temp === 'string' ? (temp = tmsUrl) : (temp.url = tmsUrl)
                            provider.url = temp;
                        }
                        provider.type = 'TileMapServiceImageryProvider';
                    }
                } else {
                    if (optionsType === 'tms' && tempUrl.includes('/tilemapresource.xml')) {
                        const tmsUrl = tempUrl.split("/tilemapresource.xml").join("");
                        typeof temp === 'string' ? (temp = tmsUrl) : (temp.url = tmsUrl)
                        provider.url = temp;
                    } else if (optionsType === "ion" && tempUrl.startsWith('ion://')) {
                        const idStr = tempUrl.substring('ion://'.length);
                        const id = +idStr;
                        provider = {
                            ...options,
                            assetId: id,
                            type: 'IonImageryProvider',
                        };
                    }
                    provider.type = getoptionsType(optionsType);
                }

                console.log('imageryProvider', provider);
                czmImagery.imageryProvider = provider as CzmImageryProviderJsonType;
            };
            update();
            const recreateEvent = this.dv(createNextAnimateFrameEvent(
                urlReact.changed,
                sceneObject.maximumLevelChanged,
                sceneObject.minimumLevelChanged,
                sceneObject.optionsChanged,
                sceneObject.rectangleChanged
            ));
            this.d(recreateEvent.don(update));
        }

        this.d(track([czmImagery, 'show'], [sceneObject, 'show']));
        this.d(track([czmImagery, 'alpha'], [sceneObject, 'czmAlpha']));
        this.d(track([czmImagery, 'splitDirection'], [sceneObject, 'czmSplitDirection']));
        this.d(track([czmImagery, 'brightness'], [sceneObject, 'czmBrightness']));
        this.d(track([czmImagery, 'contrast'], [sceneObject, 'czmContrast']));
        this.d(track([czmImagery, 'hue'], [sceneObject, 'czmHue']));
        this.d(track([czmImagery, 'saturation'], [sceneObject, 'czmSaturation']));
        this.d(track([czmImagery, 'gamma'], [sceneObject, 'czmGamma']));
        this.d(track([czmImagery, 'rectangle'], [sceneObject, 'rectangle']));
        this.d(track([czmImagery, 'zIndex'], [sceneObject, 'zIndex']));
    }
    override flyTo(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer, czmImagery } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyToParam || sceneObject.flyInParam) {
            return super.flyTo(duration, id);
        } else {
            czmImagery.flyTo(duration && duration);
            sceneObject.flyOverEvent.emit(id, 'over', czmViewer);
            return true;
        }
    }
    override flyIn(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer, czmImagery } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyInParam) {
            return super.flyIn(duration, id);
        } else {
            czmImagery.flyTo(duration && duration);
            sceneObject.flyOverEvent.emit(id, 'over', czmViewer);
            return true;
        }
    }
}