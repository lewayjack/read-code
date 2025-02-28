import { bind, Destroyable, Listener } from 'xbsj-base';
import { GeoCanvasPointPoi } from '../index';
import { CanvasPointPoi } from './CanvasPointPoi';

function getCssColor(color: [number, number, number, number]) {
    return `rgba(${color[0] * 255 | 0}, ${color[1] * 255 | 0}, ${color[2] * 255 | 0}, ${color[3]})`;
}

export class GeoCanvasPointPoiImpl extends Destroyable {
    constructor(sceneObject: GeoCanvasPointPoi, canvasPointPoi: CanvasPointPoi, visibleAlphaChanged?: Listener<[number, number]>) {
        super();

        const updateRadius = () => canvasPointPoi.radius = sceneObject.radius ?? 6;
        updateRadius();
        this.dispose(sceneObject.radiusChanged.disposableOn(updateRadius));

        const updateText = () => canvasPointPoi.text = sceneObject.text;
        updateText();
        this.dispose(sceneObject.textChanged.disposableOn(updateText));

        const updateFont = () => canvasPointPoi.font = sceneObject.font;
        updateFont();
        this.dispose(sceneObject.fontChanged.disposableOn(updateFont));

        const updateFontColor = () => canvasPointPoi.fontStyle = sceneObject.fontColor && getCssColor(sceneObject.fontColor);
        updateFontColor();
        this.dispose(sceneObject.fontColorChanged.disposableOn(updateFontColor));

        const updateColor = () => canvasPointPoi.fillStyle = sceneObject.color && getCssColor(sceneObject.color);
        updateColor();
        this.dispose(sceneObject.colorChanged.disposableOn(updateColor));

        const updateOutlineColor = () => canvasPointPoi.outlineStyle = sceneObject.outlineColor && getCssColor(sceneObject.outlineColor);
        updateOutlineColor();
        this.dispose(sceneObject.outlineColorChanged.disposableOn(updateOutlineColor));

        const updateSelectedColor = () => canvasPointPoi.selectedStyle = sceneObject.selectedColor && getCssColor(sceneObject.selectedColor);
        updateSelectedColor();
        this.dispose(sceneObject.selectedColorChanged.disposableOn(updateSelectedColor));

        this.dispose(canvasPointPoi.clickEvent.disposableOn((left, top, tag, self, pointerEvent) => {
            sceneObject.clickEvent.emit(pointerEvent);
        }));

        this.dispose(canvasPointPoi.dbclickEvent.disposableOn((left, top, tag, self, pointerEvent) => {
            sceneObject.dbclickEvent.emit(pointerEvent);
        }));

        this.dispose(bind([canvasPointPoi, 'selected'], [sceneObject, 'selected']));
        this.dispose(bind([canvasPointPoi, 'hovered'], [sceneObject, 'hovered']));
    }
}
