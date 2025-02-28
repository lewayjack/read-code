import * as Cesium from 'cesium';
import { createTextureFromImage } from "./createTextureFromImage";
import { ResourceHandler } from "./ResourceHandler";

// interface CzmTexture extends Destroyable {}
//@ts-ignore
type CzmTexture = Cesium.Texture;

export * from './ResourceHandler';
export * from './createTextureFromImage';

export class SharedTexturePool {
    _map: Map<string, ResourceHandler<CzmTexture>>;
    _loadingMap: Map<string, Promise<ResourceHandler<CzmTexture>>>;
    //@ts-ignore
    constructor(private _context: Cesium.Context) {
        this._map = new Map();
        this._loadingMap = new Map();
    }

    getTextureHandler(imageUrl: string) {
        if (this._map.has(imageUrl)) {
            const handler = this._map.get(imageUrl);
            if (handler && handler.valid) {
                return handler;
            } else {
                this._map.delete(imageUrl);
            }
        }

        let imagePromise: Promise<ResourceHandler<CzmTexture>>;
        if (this._loadingMap.has(imageUrl)) {
            imagePromise = this._loadingMap.get(imageUrl) as Promise<ResourceHandler<CzmTexture>>;
        } else {
            imagePromise = new Promise<ResourceHandler<CzmTexture>>((resolve, reject) => {
                // @ts-ignore
                Cesium.Resource.createIfNeeded(imageUrl).fetchImage().then(image => {
                    const texture = createTextureFromImage(this._context, image as HTMLImageElement);
                    const textureHandler = new ResourceHandler(texture);
                    this._map.set(imageUrl, textureHandler);
                    this._loadingMap.delete(imageUrl);

                    resolve(textureHandler as ResourceHandler<CzmTexture>);
                    // Cesium 1.83 需要使用otherwise！
                    // }).otherwise(() => {
                }).catch(() => {
                    console.error('loading image error!');
                    this._loadingMap.delete(imageUrl);
                    reject();
                });
            });
            this._loadingMap.set(imageUrl, imagePromise);
        }

        return imagePromise;
    }

    // TODO clearUnused没有主动调用，可能会导致纹理逐级增加
    clearUnused() {
        const unusedKeys = [];
        for (let [imageUrl, textureHandler] of this._map) {
            if (textureHandler.ref === 1) {
                unusedKeys.push(imageUrl)
            }
        }

        for (let imageUrl of unusedKeys) {
            const textureHandler = this._map.get(imageUrl) as ResourceHandler<CzmTexture>;
            textureHandler.reset();
            this._map.delete(imageUrl);
        }
    }
}
//@ts-ignore
const sharedTexturePoolMap = new Map<Cesium.Context, SharedTexturePool>();
//@ts-ignore
export function getSharedTexturePool(context: Cesium.Context) {
    if (!sharedTexturePoolMap.has(context)) {
        sharedTexturePoolMap.set(context, new SharedTexturePool(context));
    }

    return sharedTexturePoolMap.get(context) as SharedTexturePool;
}

export * from './ResourceHandler';