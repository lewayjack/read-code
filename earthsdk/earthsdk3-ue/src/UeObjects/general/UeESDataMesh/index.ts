import { ESDataMesh, ESSceneObject } from "earthsdk3";
import { ESUeViewer } from "../../../ESUeViewer";
import { UeESObjectWithLocation } from "../../base";
import { createNextAnimateFrameEvent } from "xbsj-base";

export class UeESDataMesh extends UeESObjectWithLocation<ESDataMesh> {
    static readonly type = this.register('ESUeViewer', ESDataMesh.type, this);
    constructor(sceneObject: ESDataMesh, ueViewer: ESUeViewer) {
        super(sceneObject, ueViewer);

        const viewer = ueViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
        const urlReact = this.dv(ESSceneObject.context.createEnvStrReact([sceneObject, 'url'], ESDataMesh.defaults.url));
        const update = () => {
            const colorStops = sceneObject.colorStops ?? ESDataMesh.defaults.colorStops;
            viewer.callUeFunc({
                f: 'update',
                p: {
                    id: sceneObject.id,
                    url: urlReact.value ?? ESDataMesh.defaults.url,
                    currentTime: sceneObject.currentTime ?? ESDataMesh.defaults.currentTime,
                    minPropValue: sceneObject.minPropValue ?? ESDataMesh.defaults.minPropValue,
                    maxPropValue: sceneObject.maxPropValue ?? ESDataMesh.defaults.maxPropValue,
                    colorStops: JSON.stringify(colorStops),
                }
            })
        };
        const updateEvent = this.dv(createNextAnimateFrameEvent(
            urlReact.changed,
            sceneObject.currentTimeChanged,
            sceneObject.minPropValueChanged,
            sceneObject.maxPropValueChanged,
            sceneObject.colorStopsChanged,
        ));
        this.d(updateEvent.don(update));
        this.d(sceneObject.createdEvent.don(update));
    }
}
