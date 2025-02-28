import { GeoCustomDivPoi } from '../../CzmObjects';
import { createInnerHtmlWithWhiteTextBlackBackground } from './createInnerHtmlWithWhiteTextBlackBackground';
import { ESCesiumViewer } from '../../ESCesiumViewer';
import { SceneObjectKey } from 'xbsj-base';

export function createInfoPoi(text: string, position: [number, number, number], czmViewer: ESCesiumViewer, id?: SceneObjectKey) {
    const geoDivPoi = new GeoCustomDivPoi(czmViewer, id);
    // 黑底白字
    geoDivPoi.innerHTML = createInnerHtmlWithWhiteTextBlackBackground(text);
    geoDivPoi.position = position;
    geoDivPoi.show = true;
    return geoDivPoi;
}