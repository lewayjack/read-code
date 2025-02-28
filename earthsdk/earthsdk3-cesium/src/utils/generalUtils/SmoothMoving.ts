import { geoDestination, geoDistance, geoHeading } from "earthsdk3";
import { animateFrame, createProcessingFromAsyncFunc, Destroyable, react, reactArrayWithUndefined } from "xbsj-base";

export class SmoothMoving extends Destroyable {
    private _currentPosition = this.disposeVar(reactArrayWithUndefined<[number, number, number]>(undefined));
    get currentPosition() { return this._currentPosition.value; }
    get currentPositionChanged() { return this._currentPosition.changed; }

    private _currentHeading = this.disposeVar(react<number | undefined>(undefined));
    get currentHeading() { return this._currentHeading.value; }
    get currentHeadingChanged() { return this._currentHeading.changed; }

    private _startPosition: [number, number, number] = [0, 0, 0];
    private _processing = this.disposeVar(createProcessingFromAsyncFunc<void, [destination: [number, number, number], duration: number]>(async (cancelsManager, destination, duration) => {
        const { currentPosition } = this;
        if (!currentPosition || duration <= 0) {
            this._currentPosition.value = destination;
            return;
        }

        const startPosition = this._startPosition;
        let startTime = Date.now();
        startPosition.splice(0, 3, ...currentPosition);
        const heading = geoHeading(startPosition, destination);
        this._currentHeading.value = heading;
        const distance = geoDistance(startPosition, destination);
        const speed = distance / duration;

        await cancelsManager.promise(new Promise<void>(resolve => {
            cancelsManager.disposer.dispose(animateFrame(() => {
                let time = Date.now() - startTime;
                time = time < 0 ? 0 : time;
                time = time > duration ? duration : time;
                const forwardDis = time * speed;
                const currentPosition = geoDestination(startPosition, forwardDis, heading);
                this._currentPosition.value = currentPosition;
                if (time === duration) {
                    this._currentPosition.value = destination;
                    resolve();
                }
            }));
        }));
    }));
    get processing() { return this._processing; }

    restart(destination: [number, number, number], duration: number) { this._processing.restart(undefined, destination, duration); }
    cancel() { this._processing.cancel(); }
}
