import { ESPoi3D, ESSceneObject } from "earthsdk3";
import html2canvas from "html2canvas";
import { CzmESObjectWithLocation, CzmModelPrimitive } from "../../../CzmObjects";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { bindNorthRotation, flyWithPrimitive } from "../../../utils";
import { bind, createNextAnimateFrameEvent, Destroyable, ObjResettingWithEvent, react, track } from "xbsj-base";

export class CzmESPoi3D extends CzmESObjectWithLocation<ESPoi3D> {
    static readonly type = this.register('ESCesiumViewer', ESPoi3D.type, this);

    private _czmModelPoi3D?: CzmModelPoi3D;

    constructor(sceneObject: ESPoi3D, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn('viewer is undefined!');
            return;
        }
        const event = this.dv(createNextAnimateFrameEvent(
            sceneObject.modeChanged,
        ));
        this.dv(new ObjResettingWithEvent(event, () => {
            let { mode } = sceneObject;
            // const modelUrl = `http://localhost:8081/dist-web/xe2-assets/esobjs-xe2-plugin/glbs/poi3d/${mode}/SM_POI_${mode.charAt(0).toUpperCase() + mode.slice(1)}.gltf`;
            const modelUrl = ESSceneObject.context.getStrFromEnv(
                `\${earthsdk3-assets-script-dir}/assets/glb/poi3d/${mode}/SM_POI_${mode.charAt(0).toUpperCase() + mode.slice(1)}.gltf`);
            return this._czmModelPoi3D = new CzmModelPoi3D(sceneObject, czmViewer, modelUrl);
        }));
    }
    override flyTo(duration: number | undefined, id: number) {
        const { sceneObject, czmViewer } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyToParam || sceneObject.flyInParam) {
            return super.flyTo(duration, id);
        } else {
            if (this._czmModelPoi3D) {
                this._czmModelPoi3D.flyTo(duration, id);
                // sceneObject.flyOverEvent.emit(id, 'over', czmViewer);
                return true;
            }
            return false;
        }
    }
}

class CzmModelPoi3D extends Destroyable {
    private _czmModel;
    // private _show = this.disposeVar(react<boolean>(this._sceneObject.show));
    // get show() { return this._show.value; }
    // set show(value: boolean) { this._show.value = value; }
    // get showChanged() { return this._show.changed; }

    constructor(private _sceneObject: ESPoi3D, private _czmViewer: ESCesiumViewer, private _modelUrl: string) {
        super();
        this._czmModel = this.ad(new CzmModelPrimitive(this._czmViewer, this._sceneObject.id));
        // const czmViewer = this._czmViewer;
        const sceneObject = this._sceneObject;
        const model = this._czmModel;
        model.show = false;
        model.url = this._modelUrl;
        model.basePath = this._modelUrl.split("/").slice(0, -1).join("/") + "/";
        model.activeAnimationsAnimateWhilePaused = true;

        this.d(bind([model, 'position'], [sceneObject, 'position']));
        this.d(bindNorthRotation([model, 'rotation'], [sceneObject, 'rotation']));
        this.d(track([model, 'scale'], [sceneObject, 'scale']));
        this.d(track([model, 'show'], [sceneObject, 'show']));
        // this.d(track([model, 'show'], [this, 'show']));
        {
            const event = this.dv(createNextAnimateFrameEvent(sceneObject.allowPickingChanged, sceneObject.editingChanged))
            const update = () => {
                if (sceneObject.allowPicking && !sceneObject.editing) {
                    model.allowPicking = true;
                } else {
                    model.allowPicking = false;
                }
            }
            update();
            this.d(event.don(update));
        }
        // 文字更改，更新模型
        {
            const update = () => {
                // 替换图片
                const div = document.createElement('div');
                div.style.position = 'absolute';
                div.style.zIndex = '-1';
                div.style.bottom = '108px';
                div.style.right = '0px'
                div.innerHTML = `<div style="width: 512px; height: 128px;color: #fff;text-align: center;line-height: 128px;font-size: 50px;margin: 0 auto;">
                                    <span style="display: inline-block;white-space: nowrap;text-overflow: ellipsis;overflow: hidden;width: 512px;">${sceneObject.style[Object.keys(sceneObject.style).filter(item => item.toUpperCase() == "TEXT")[0]] ?? sceneObject.name}</span>
                                </div>`;
                if (!document.body.contains(div))
                    document.body.appendChild(div);
                html2canvas(div, {
                    backgroundColor: null,
                    allowTaint: false,
                    useCORS: true,
                }).then((canvas) => {
                    if (document.body.contains(div))
                        document.body.removeChild(div);
                    for (let i = 0; i < model.gltf.images.length; i++) {
                        const element = model.gltf.images[i];
                        if (element.name.toUpperCase().includes("TEXT"))
                            element.uri = canvas.toDataURL('image/png', 1);
                    }
                    for (let i = 0; i < model.gltf.materials.length; i++) {
                        const materials = model.gltf.materials[i];
                        if (materials.name.toUpperCase().includes("UI") || materials.name.toUpperCase().includes("LAMBERT5")) {
                            materials.pbrMetallicRoughness.baseColorFactor = sceneObject.style?.UI_Color ?? [1, 1, 1, 1];
                            materials.alphaMode && delete materials.alphaMode;
                        } else if (!materials.name.toUpperCase().includes("TEXT")) {
                            materials.pbrMetallicRoughness.baseColorFactor = sceneObject.style?.FX_Color ?? [1, 1, 1, 1];
                        }
                    }
                    model.gltfJson = model.gltf;
                    model.activeAnimationsJson = model.gltf.animations.map((value: any, index: number) => {
                        return {
                            "index": index,
                            "loop": "REPEAT",
                            "animationTime": "(duration) => Date.now() / 1000 / duration * 2"
                        }
                    });
                }).catch(() => {
                    if (document.body.contains(div))
                        document.body.removeChild(div);
                });
            }
            update()
            const event = this.dv(createNextAnimateFrameEvent(sceneObject.nameChanged, sceneObject.styleChanged))
            this.d(event.don(update));
        }
    }
    flyTo(duration: number | undefined, id: number) {
        const { _czmViewer: czmViewer, _sceneObject: sceneObject, _czmModel: model } = this;
        flyWithPrimitive(czmViewer, sceneObject, id, duration, model, true)
    }
}
