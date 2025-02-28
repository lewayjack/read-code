import { CzmCustomPrimitive, CzmESObjectWithLocation } from "../../../CzmObjects";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { ESCustomPrimitive } from "../../../ESObjects";
import { bindNorthRotation, flyWithPrimitive } from "../../../utils";
import { track } from "xbsj-base";

export class CzmESCustomPrimitive extends CzmESObjectWithLocation<ESCustomPrimitive> {
    static readonly type = this.register("ESCesiumViewer", ESCustomPrimitive.type, this);

    private _czmCustomPrimitive;
    get czmCustomPrimitive() { return this._czmCustomPrimitive; }

    constructor(sceneObject: ESCustomPrimitive, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);
        this._czmCustomPrimitive = this.disposeVar(new CzmCustomPrimitive(czmViewer, sceneObject.id));
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }

        const czmCustomPrimitive = this._czmCustomPrimitive;

        this.dispose(track([czmCustomPrimitive, 'show'], [sceneObject, 'show']));
        this.dispose(track([czmCustomPrimitive, 'allowPicking'], [sceneObject, 'allowPicking']));
        this.dispose(bindNorthRotation([czmCustomPrimitive, 'rotation'], [sceneObject, 'rotation']));
        this.dispose(track([czmCustomPrimitive, 'position'], [sceneObject, 'position']));
        this.dispose(track([czmCustomPrimitive, 'scale'], [sceneObject, 'scale']));

        this.dispose(track([czmCustomPrimitive, 'viewDistanceRange'], [sceneObject, 'viewDistanceRange']));
        this.dispose(track([czmCustomPrimitive, 'viewDistanceDebug'], [sceneObject, 'viewDistanceDebug']));
        this.dispose(track([czmCustomPrimitive, 'maximumScale'], [sceneObject, 'maximumScale']));
        this.dispose(track([czmCustomPrimitive, 'minimumScale'], [sceneObject, 'minimumScale']));
        this.dispose(track([czmCustomPrimitive, 'pixelSize'], [sceneObject, 'pixelSize']));
        this.dispose(track([czmCustomPrimitive, 'showSceneScale'], [sceneObject, 'showSceneScale']));

        this.dispose(track([czmCustomPrimitive, 'modelMatrix'], [sceneObject, 'modelMatrix']));
        this.dispose(track([czmCustomPrimitive, 'cull'], [sceneObject, 'cull']));
        this.dispose(track([czmCustomPrimitive, 'boundingVolume'], [sceneObject, 'boundingVolume']));
        this.dispose(track([czmCustomPrimitive, 'pass'], [sceneObject, 'pass']));
        this.dispose(track([czmCustomPrimitive, 'primitiveType'], [sceneObject, 'primitiveType']));
        this.dispose(track([czmCustomPrimitive, 'renderState'], [sceneObject, 'renderState']));
        this.dispose(track([czmCustomPrimitive, 'vertexShaderSource'], [sceneObject, 'vertexShaderSource']));
        this.dispose(track([czmCustomPrimitive, 'fragmentShaderSource'], [sceneObject, 'fragmentShaderSource']));
        this.dispose(track([czmCustomPrimitive, 'uniformMap'], [sceneObject, 'uniformMap']));
        this.dispose(track([czmCustomPrimitive, 'attributes'], [sceneObject, 'attributes']));
        this.dispose(track([czmCustomPrimitive, 'indexTypedArray'], [sceneObject, 'indexTypedArray']));
        this.dispose(track([czmCustomPrimitive, 'attributesJson'], [sceneObject, 'attributesJson']));
        this.dispose(track([czmCustomPrimitive, 'indexTypedArrayJson'], [sceneObject, 'indexTypedArrayJson']));
        this.dispose(track([czmCustomPrimitive, 'count'], [sceneObject, 'count']));
        this.dispose(track([czmCustomPrimitive, 'offset'], [sceneObject, 'offset']));
        this.dispose(track([czmCustomPrimitive, 'instanceCount'], [sceneObject, 'instanceCount']));

        this.dispose(track([czmCustomPrimitive, 'localPosition'], [sceneObject, 'localPosition']));
        this.dispose(track([czmCustomPrimitive, 'localScale'], [sceneObject, 'localScale']));
        this.dispose(track([czmCustomPrimitive, 'localModelMatrix'], [sceneObject, 'localModelMatrix']));
        this.dispose(track([czmCustomPrimitive, 'debugShowBoundingVolume'], [sceneObject, 'debugShowBoundingVolume']));
        this.dispose(track([czmCustomPrimitive, 'debugOverlappingFrustums'], [sceneObject, 'debugOverlappingFrustums']));
        this.dispose(track([czmCustomPrimitive, 'occlude'], [sceneObject, 'occlude']));
        this.dispose(track([czmCustomPrimitive, 'castShadows'], [sceneObject, 'castShadows']));
        this.dispose(track([czmCustomPrimitive, 'receiveShadows'], [sceneObject, 'receiveShadows']));
        this.dispose(track([czmCustomPrimitive, 'executeInClosestFrustum'], [sceneObject, 'executeInClosestFrustum']));
        this.dispose(track([czmCustomPrimitive, 'pickOnly'], [sceneObject, 'pickOnly']));
        this.dispose(track([czmCustomPrimitive, 'depthForTranslucentClassification'], [sceneObject, 'depthForTranslucentClassification']));

        {
            // 单向监听,旋转90度
            const updated = () => {
                if (sceneObject.localRotation) {
                    // 复制本地偏移
                    const localRotation: [number, number, number] = [...sceneObject.localRotation];
                    localRotation[0] -= 90;
                    czmCustomPrimitive.localRotation = localRotation;
                } else {
                    czmCustomPrimitive.localRotation = [-90, 0, 0];
                }
            }
            updated();
            this.dispose(sceneObject.localRotationChanged.disposableOn(updated));
        }
    }
    override flyTo(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer, czmCustomPrimitive } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyToParam || sceneObject.flyInParam) {
            return super.flyTo(duration, id);
        } else {
            flyWithPrimitive(czmViewer, sceneObject, id, duration, czmCustomPrimitive, true);
            return true;
        }
    }
}