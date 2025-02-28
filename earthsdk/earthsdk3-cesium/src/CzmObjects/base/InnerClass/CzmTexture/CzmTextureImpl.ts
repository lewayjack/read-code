import * as Cesium from 'cesium';
import { ComplexImage, CzmTextureCopyParams, Destroyable, ObjResettingWithEvent } from 'xbsj-base';

export class CzmTextureImpl extends Destroyable {
    get czmViewer() { return this._czmViewer; }
    get comlexImage() { return this._comlexImage; }

    private _nativeTextureResetting;
    get nativeTextureResetting() { return this._nativeTextureResetting; }
    get nativeTextureChanged() { return this._nativeTextureResetting.objChanged; }
    get nativeTexture() { return this._nativeTextureResetting.obj; }

    copyTexture(params: CzmTextureCopyParams) {
        if (!this.nativeTexture) {
            throw new Error(`copyTexture error: !this.nativeTexture`);
        }
        this.nativeTexture.copyFrom(params);
    }

    constructor(private _czmViewer: Cesium.Viewer, private _comlexImage: ComplexImage) {
        super();
        this._nativeTextureResetting = this.disposeVar(new ObjResettingWithEvent(this.comlexImage.createNativeTextureEvent, () => {
            if (!(this.comlexImage.enabled)) return undefined;
            if (!this.comlexImage.size) return undefined;
            const { flipY, size } = this.comlexImage;
            const [width, height] = size;
            //@ts-ignore
            return new Cesium.Texture({
                //@ts-ignore
                context: this.czmViewer.scene.context,
                // @ts-ignore Cesium.Texture的声明文件有问题
                pixelFormat: Cesium.PixelFormat[this.pixelFormat],
                width,
                height,
                flipY,
            });
        }));
        this.ad(this.nativeTextureChanged.don(() => {
            this.dispose(this.comlexImage.copyTextureEvent.disposableOn(params => {
                this.copyTexture(params);
            }));
        }))
    }
}
