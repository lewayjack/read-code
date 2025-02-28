import * as Cesium from 'cesium';
import { JsonValue } from 'xbsj-base';

export function getStyleFromJson(styleJson: JsonValue | undefined) {
    if (!styleJson) {
        return undefined;
    }
    try {
        const style = new Cesium.Cesium3DTileStyle(styleJson);
        return style;
    } catch (error) {
        console.error(`Cesium3DTiles style error: ${error}`, error);
        return undefined;
    }
}
