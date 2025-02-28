import { ESSceneObject } from "earthsdk3";
import { ESCesiumViewer } from "../../../../ESCesiumViewer";
import { CzmTextureUriTypeType } from "../../../../ESJTypesCzm";
import { bind, Event, ComplexImage, createProcessingFromAsyncFunc, czmPixelFormats, CzmPixelFormatType, CzmTextureCopyParams, Destroyable, extendClassProps, reactArrayWithUndefined, ReactivePropsToNativePropsAndChanged, track, HasOwner, ObjResettingWithEvent, createGuid, react } from "xbsj-base";
import { previewCustomPrimitiveJson } from "./previewCustomPrimitiveJson";
import { CzmTextureImpl } from "./CzmTextureImpl";
import * as Cesium from 'cesium';

export * from './SharedTexturePool'
export class CzmTexture extends Destroyable {
    static readonly types = ComplexImage.types;
    static readonly suffixTypes = ComplexImage.suffixTypes;

    private _complexImage = this.disposeVar(new ComplexImage());
    get complexImage() { return this._complexImage; }

    copyTexture(params: CzmTextureCopyParams) {
        this._complexImage.copyTexture(params);
    }

    copyFromImage(image: HTMLImageElement) {
        if (image.naturalWidth <= 0 || image.naturalHeight <= 0) {
            console.warn(`copyFromImage error: image.naturalWidth <= 0 || image.naturalHeight <= 0`);
            return;
        }
        this.size = [image.naturalWidth, image.naturalHeight];
        this.copyTexture({ source: image });
    }

    copyFromCanvas(canvas: HTMLCanvasElement) {
        this._complexImage.copyFromCanvas(canvas);
    }

    private _copyFromClipboardProcessing = this.disposeVar(createProcessingFromAsyncFunc(async cancelsManager => {
        const clipboardItems = await cancelsManager.promise(navigator.clipboard.read());
        if (clipboardItems.length === 0) {
            console.warn(`剪切板中没有内容，无法粘贴！`);
            return;
        }
        const item = clipboardItems[0];
        const index = item.types.findIndex(s => s.startsWith('image'))
        if (index === -1) {
            console.warn(`剪切板中没有图像！`);
            return;
        }
        const blob = await cancelsManager.promise(item.getType(item.types[index]))
        const imageUrl = window.URL.createObjectURL(new Blob([blob]));
        cancelsManager.disposer.dispose(() => window.URL.revokeObjectURL(imageUrl));

        const image = await cancelsManager.promise(new Promise<HTMLImageElement>((resolve, reject) => {
            const image = new Image();
            image.src = imageUrl;
            image.onload = () => resolve(image);
            image.onerror = () => reject(`无法加载图片！`);
            image.onabort = () => reject(`加载图片被中断！`);
        }));

        this.copyFromImage(image);
    }));

    copyFromClipboard() {
        this._copyFromClipboardProcessing.restart();
    }

    reset() {
        this.uri = '';
        this.size = undefined;
        this.uriType = undefined;
        this.flipY = true;
        this.pixelFormat = "RGBA";
    }

    private _readyEvent = this.disposeVar(new Event<[ESCesiumViewer]>());
    get readyEvent() { return this._readyEvent; }

    private _czmNativeTexture;
    get czmNativeTexture() { return this._czmNativeTexture; }

    getDefaultTexture() {
        if (!this._czmViewer.viewer) {
            throw new Error(`!this.czmViewer.viewer`);
        }
        //@ts-ignore
        return this._czmViewer.viewer.scene.context.defaultTexture;
    }

    get texture() {
        return this.czmNativeTexture.nativeTexture ?? this.getDefaultTexture()
    }

    get czmViewer() { return this._czmViewer; }

    private _id = this.disposeVar(react<string>(createGuid()));
    get id() { return this._id.value; }
    set id(value: string) { this._id.value = value; }
    get idChanged() { return this._id.changed; }

    constructor(private _czmViewer: ESCesiumViewer, id?: string) {
        super();
        id && (this.id = id);
        this._czmNativeTexture = this.disposeVar(new CzmTextureImpl(this.czmViewer.viewer as Cesium.Viewer, this.complexImage));
        this.disposeVar(new ObjResettingWithEvent(this.showPreviewChanged, () => {
            if (!this.showPreview) return undefined;
            return new Preview(this);
        }));
        const viewer = this._czmViewer.viewer;
        if (!viewer) return;
        this.readyEvent.emit(_czmViewer);
        this.dispose(track([this._complexImage, 'enabled'], [this, 'enabled']));
        this.dispose(bind([this._complexImage, 'size'], [this, 'size']));
        this.dispose(bind([this._complexImage, 'pixelFormat'], [this, 'pixelFormat']));
        this.dispose(bind([this._complexImage, 'flipY'], [this, 'flipY']));
        const uriReact = this.disposeVar(ESSceneObject.context.createEnvStrReact([this, 'uri'], ''));
        this.dispose(bind([this._complexImage, 'uri'], uriReact));
        this.dispose(bind([this._complexImage, 'type'], [this, 'uriType']));
        this.dispose(bind([this._complexImage, 'crossOrigin'], [this, 'crossOrigin'], (a: string) => a === 'null' ? null : a));
        this.dispose(bind([this._complexImage, 'autoplay'], [this, 'autoplay']));
        this.dispose(bind([this._complexImage, 'loop'], [this, 'loop']));
        {
            // 储存为共享材质
            //@ts-ignore
            if (!window.czmTexture) {
                //@ts-ignore
                window.czmTexture = {};
            }
            //@ts-ignore
            window.czmTexture[this.id] = this;
            this.ad(() => {
                //@ts-ignore
                if (Reflect.has(window.czmTexture, this.id))
                    //@ts-ignore
                    Reflect.deleteProperty(window.czmTexture, this.id);
            })
        }
    }

    static defaults = {
        size: [256, 256] as [number, number],
        uriType: 'img',
        czmPixelFormats,
        uriTypes: CzmTexture.types,
    };
}

export namespace CzmTexture {
    export const createDefaultProps = () => ({
        enabled: true,
        showPreview: false,
        size: reactArrayWithUndefined<[width: number, height: number]>(undefined),
        pixelFormat: "RGBA" as CzmPixelFormatType,
        flipY: true,
        uri: undefined as string | undefined,
        uriType: undefined as CzmTextureUriTypeType | undefined, // 如果未指定，会自动根据url判断！
        crossOrigin: '' as string,
        autoplay: true,
        loop: true,
        ...ESSceneObject.createDefaultProps(),
    });
}
extendClassProps(CzmTexture.prototype, CzmTexture.createDefaultProps);
export interface CzmTexture extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof CzmTexture.createDefaultProps>> { }

class Preview extends HasOwner<CzmTexture> {
    private _builtin = (() => {
        //@ts-ignore
        const customPrimitive = this.disposeVar(ESSceneObject.createFromJson(previewCustomPrimitiveJson) as unknown as CzmCustomPrimitive);
        customPrimitive.uniformMap = {
            "u_image": {
                "type": "texture",
                "id": this.owner.id,
            }
        };
        this.dispose(this.owner.czmViewer.disposableAdd(customPrimitive));
    })();

    constructor(owner: CzmTexture) {
        super(owner);
    }
}
