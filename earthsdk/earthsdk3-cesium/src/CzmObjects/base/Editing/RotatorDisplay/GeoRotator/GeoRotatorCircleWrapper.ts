import { HasOwner, track } from "xbsj-base";
import { GeoRotator } from ".";
import { GeoRotatorCircle } from "../GeoRotatorCircle";
import { RotatorPlaneType } from "./RotatorPlaneType";

export class GeoRotatorCircleWrapper extends HasOwner<GeoRotator> {
    get sceneObject() { return this.owner; }
    get czmViewer() { return this.owner.czmViewer; }
    get type() { return this._type; }

    private _circle;
    get circle() { return this._circle; }

    constructor(owner: GeoRotator, private _type: Exclude<RotatorPlaneType, 'none'>) {
        super(owner);
        this._circle = this.disposeVar(new GeoRotatorCircle(this.czmViewer));
        this.dispose(track([this.circle, 'position'], [this.sceneObject, 'position']));
        this.dispose(track([this.circle, 'pixelSize'], [this.sceneObject, 'pixelSize']));
        this.dispose(track([this.circle, 'debug'], [this.sceneObject, 'debug']));
        this.dispose(track([this.circle, 'rotation'], [this.sceneObject, 'rotation']));
        {
            const update = () => {
                this.circle.selfRotation = GeoRotator.rotationFuncs[this.type](this.sceneObject.selfRotation);
                this.circle.circleRotation = this.sceneObject.selfRotation[GeoRotator.rotationNum[this.type]];
            };
            update();
            this.dispose(this.sceneObject.selfRotationChanged.disposableOn(update));
        }

        {
            const update = () => {
                const moving = this.owner.movingPlaneType === this.type;
                const hovered = this.owner.hoveredPlaneType === this.type;
                const alpha = (moving || hovered) ? 1.0 : 0.8;
                const color = [0, 0, 0, alpha] as [number, number, number, number];
                color[GeoRotator.rotationNum[this.type]] = 1;
                this.circle.color = color;
            };
            update();
            this.dispose(this.owner.movingPlaneTypeChanged.disposableOn(update));
            this.dispose(this.owner.hoveredPlaneTypeChanged.disposableOn(update));
        }
    }
}
