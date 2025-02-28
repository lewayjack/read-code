import { geoDestination, geoDistance, geoHeading } from "earthsdk3";
import { ESCesiumViewer } from "../../ESCesiumViewer";
import { animateFrame, createProcessingFromAsyncFunc, Destroyable, react, reactArrayWithUndefined } from "xbsj-base";

export class SmoothMoveController extends Destroyable {
    // 当前位置
    private _currentPosition = this.disposeVar(reactArrayWithUndefined<[number, number, number]>(undefined));
    get currentPosition() { return this._currentPosition.value; }
    get currentPositionChanged() { return this._currentPosition.changed; }

    // 当前位置
    private _currentRotation = this.disposeVar(reactArrayWithUndefined<[number, number, number]>(undefined));
    get currentRotation() { return this._currentRotation.value; }
    get currentRotationChanged() { return this._currentRotation.changed; }

    // 当前Heading角度
    private _currentHeading = this.disposeVar(react<number | undefined>(undefined));
    get currentHeading() { return this._currentHeading.value; }
    get currentHeadingChanged() { return this._currentHeading.changed; }

    // 是否旋转
    private _isRotating = this.disposeVar(react<boolean>(false));
    get isRotating() { return this._isRotating.value; }
    set isRotating(value) { this._isRotating.value = value; }
    get isRotatingChanged() { return this._isRotating.changed; }
    // 是否贴地
    private _isGround = this.disposeVar(react<boolean>(false));
    get isGround() { return this._isGround.value; }
    set isGround(value) { this._isGround.value = value; }
    get isGroundChanged() { return this._isGround.changed; }

    private _startPosition: [number, number, number] = [0, 0, 0];
    private _startRotation: [number, number, number] = [0, 0, 0];
    private _processing = this.disposeVar(createProcessingFromAsyncFunc<void, [destination: [number, number, number], rotation: [number, number, number], duration: number]>(async (cancelsManager, destination, rotation, duration) => {
        const { currentPosition, currentRotation } = this;
        if (!currentPosition || duration <= 0 || !currentRotation) {
            this._currentPosition.value = destination;
            this._currentRotation.value = rotation;
            return;
        }

        const startPosition = this._startPosition;
        startPosition.splice(0, 3, ...currentPosition);

        const startRotation = this._startRotation;
        startRotation.splice(0, 3, ...currentRotation);

        let startTime = Date.now();
        const heading = geoHeading(startPosition, destination);
        this._currentHeading.value = heading;
        const distance = geoDistance(startPosition, destination);
        const speed = distance / duration;
        const rRotation = [rotation[0] - startRotation[0], rotation[1] - startRotation[1], rotation[2] - startRotation[2]] as [number, number, number];
        const rHeight = destination[2] - startPosition[2];
        await cancelsManager.promise(new Promise<void>(resolve => {
            cancelsManager.disposer.dispose(animateFrame(() => {
                let time = Date.now() - startTime;
                time = time < 0 ? 0 : time;
                time = time > duration ? duration : time;
                const forwardDis = time * speed;
                const currentPosition = geoDestination(startPosition, forwardDis, heading);
                if (this.isGround && currentPosition) {
                    const height = this._czmViewer.getTerrainHeight([currentPosition[0], currentPosition[1]]);
                    this._currentPosition.value = [currentPosition[0], currentPosition[1], height ?? 0];
                } else {
                    currentPosition && (currentPosition[2] += rHeight * (time / duration));
                    this._currentPosition.value = currentPosition;
                }

                if (this.isRotating) {
                    const [h, p, r] = rRotation;
                    const rd = time / duration;
                    this._currentRotation.value = [startRotation[0] + h * rd, startRotation[1] + p * rd, startRotation[2] + r * rd];
                }

                if (time === duration) {
                    this._currentPosition.value = destination;
                    this.isRotating && (this._currentRotation.value = rotation);
                    this.isRotating = false;
                    this.isGround = false;
                    resolve();
                }
            }));
        }));
    }));
    get processing() { return this._processing; }

    restart(destination: [number, number, number], rotation: [number, number, number], duration: number) { this._processing.restart(undefined, destination, rotation, duration); }
    cancel() {
        this._processing.cancel();
    }
    constructor(private _czmViewer: ESCesiumViewer) {
        super();
    }
}
