import { ESGltfModel, ESSceneObject, rpToap } from "earthsdk3";
import {
    ESUeViewer, setNodePositionCallFunc,
    setNodeRotationCallFunc, setNodeScaleCallFunc
} from "../../../ESUeViewer";
import { UeESObjectWithLocation } from "../../../UeObjects";

export class UeESGltfModel<T extends ESGltfModel = ESGltfModel> extends UeESObjectWithLocation<T> {
    static override forceUeUpdateProps = [
        ...UeESObjectWithLocation.forceUeUpdateProps,
        'url',
    ];
    static override  propValFuncs = {
        ...UeESObjectWithLocation.propValFuncs,
        url: (val: string) => ESSceneObject.context.getStrFromEnv(rpToap(val)),
        czmMaximumScale: null,
        czmMinimumPixelSize: null,
        czmNativeScale: null,
        czmColor: null,
    };

    static readonly type = this.register<ESGltfModel, ESUeViewer>('ESUeViewer', ESGltfModel.type, this);

    constructor(sceneObject: T, ueViewer: ESUeViewer) {
        super(sceneObject, ueViewer);

        const viewer = ueViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }

        this.d(sceneObject.setNodePositionEvent.don((NodeName, NodePosition) => {
            setNodePositionCallFunc(viewer, sceneObject.id, NodeName, NodePosition)
        }));

        this.d(sceneObject.setNodeRotationEvent.don((NodeName, NodeRotation) => {
            setNodeRotationCallFunc(viewer, sceneObject.id, NodeName, NodeRotation)
        }));

        this.d(sceneObject.setNodeScaleEvent.don((NodeName, NodeScale) => {
            setNodeScaleCallFunc(viewer, sceneObject.id, NodeName, NodeScale)
        }));
    }
}
