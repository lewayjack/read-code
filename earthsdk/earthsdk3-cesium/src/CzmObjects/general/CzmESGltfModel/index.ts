import { ESGltfModel, ESSceneObject } from "earthsdk3";
import { CzmESObjectWithLocation, CzmModelPrimitive } from "../../../CzmObjects";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { bind, createNextAnimateFrameEvent, track } from "xbsj-base";
import { bindNorthRotation, flyWithPrimitive, rpToap } from "../../../utils";

export class CzmESGltfModel<T extends ESGltfModel = ESGltfModel> extends CzmESObjectWithLocation<T> {
    static readonly type = this.register<ESGltfModel, ESCesiumViewer>("ESCesiumViewer", ESGltfModel.type, this);
    private _czmModel;
    get model() { return this._czmModel };

    constructor(sceneObject: T, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
        this._czmModel = this.dv(new CzmModelPrimitive(czmViewer, sceneObject.id));
        const model = this._czmModel;
        this.d(model.readyEvent.don((m) => { sceneObject.czmModelReadyEvent.emit(m) }))
        this.d(track([model, 'show'], [sceneObject, 'show']));
        this.d(track([model, 'color'], [sceneObject, 'czmColor']));
        this.d(track([model, 'nativeMaximumScale'], [sceneObject, 'czmMaximumScale']));
        this.d(track([model, 'nativeMinimumPixelSize'], [sceneObject, 'czmMinimumPixelSize']));
        this.d(bind([model, 'position'], [sceneObject, 'position']));
        this.d(track([model, 'nativeScale'], [sceneObject, 'czmNativeScale']));
        this.d(track([model, 'scale'], [sceneObject, 'scale']));
        this.d(bindNorthRotation([model, 'rotation'], [sceneObject, 'rotation']));
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

        const updateUrl = () => { model.url = ESSceneObject.context.getStrFromEnv(rpToap(typeof sceneObject.url == 'string' ? sceneObject.url : sceneObject.url.url)); }
        updateUrl()
        this.d(sceneObject.urlChanged.don(updateUrl));

        this.d(sceneObject.setNodePositionEvent.don((NodeName, NodePosition) => {
            model.setNodeTranslation(NodeName, NodePosition)
        }));

        this.d(sceneObject.setNodeRotationEvent.don((NodeName, NodeRotation) => {
            model.setNodeRotation(NodeName, NodeRotation)
        }));
        this.d(sceneObject.setNodeScaleEvent.don((NodeName, NodeScale) => {
            model.setNodeScale(NodeName, NodeScale)
        }));
        this.d(sceneObject.printDebugInfoEvent.don(() => {
            model.printDebugInfo();
        }));
    }
    override flyTo(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer, model } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyToParam || sceneObject.flyInParam) {
            super.flyTo(duration, id);
            return true;
        } else {
            model && flyWithPrimitive(czmViewer, sceneObject, id, duration, model, true);
            return !!model;
        }
    }
}
