import { ESPipeserTileset } from "earthsdk3";
import {
    ESUeViewer, HighlightFeatureAndFlyToCallFunc,
    HighlightFeatureCallFunc, SetLayerColorCallFunc, SetLayerVisibleCallFunc
} from "../../../ESUeViewer";
import { UeES3DTileset } from "../UeES3DTileset";

export class UeESPipeserTileset extends UeES3DTileset<ESPipeserTileset> {
    static override readonly type = this.register('ESUeViewer', ESPipeserTileset.type, this);
    constructor(sceneObject: ESPipeserTileset, ueViewer: ESUeViewer) {
        super(sceneObject, ueViewer);

        const viewer = ueViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }

        this.d(sceneObject.highlightFeatureEvent.don((HlId) => {
            const id = (typeof HlId === 'number') ? (HlId.toString()) : HlId;
            HighlightFeatureCallFunc(viewer, sceneObject.id, id)
        }));
        this.d(sceneObject.highlightFeatureAndFlyToEvent.don((HlId, sphere, color, Duration) => {
            const id = (typeof HlId === 'number') ? (HlId.toString()) : HlId;
            HighlightFeatureAndFlyToCallFunc(viewer, sceneObject.id, id, Duration ?? 1)
        }));
        this.d(sceneObject.setLayerVisibleEvent.don((name, LayerJson) => {
            //判断类型为string
            let jsonStr = ''
            if (typeof LayerJson !== 'string') {
                jsonStr = JSON.stringify(LayerJson)
            } else {
                jsonStr = LayerJson
            }
            SetLayerVisibleCallFunc(viewer, sceneObject.id, jsonStr)
        }));
        this.d(sceneObject.setLayerColorEvent.don((name, LayerJson) => {
            //判断类型为string
            let jsonStr = ''
            if (typeof LayerJson !== 'string') {
                jsonStr = JSON.stringify(LayerJson)
            } else {
                jsonStr = LayerJson
            }
            SetLayerColorCallFunc(viewer, sceneObject.id, jsonStr)
        }));
    }
}
