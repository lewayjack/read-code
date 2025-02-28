
import { ESGeoLineString } from "earthsdk3";
import { ESUeViewer } from '../../../ESUeViewer';
import { UeESGeoVector } from '../../base';
export class UeESGeoLineString<T extends ESGeoLineString = ESGeoLineString> extends UeESGeoVector<T> {
    static readonly type = this.register<ESGeoLineString, ESUeViewer>('ESUeViewer', ESGeoLineString.type, this);
    constructor(sceneObject: T, ueViewer: ESUeViewer) {
        super(sceneObject, ueViewer);
        const viewer = ueViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }

    }
}
