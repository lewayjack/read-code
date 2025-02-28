import * as Cesium from 'cesium';

export function fixParticleSystem() {
    // @ts-ignore
    if (Cesium.ParticleSystem.prototype.timeStamp !== undefined) {
        console.warn(`fixParticleSystem已经执行过！`);
        return;
    }

    Object.defineProperties(Cesium.ParticleSystem.prototype, {
        timeStamp: {
            get() {
                // @ts-ignore
                if (this._innerCurrentTimeStamp === undefined) {
                    // @ts-ignore
                    this._innerCurrentTimeStamp = 0;
                }
                // @ts-ignore
                return this._innerCurrentTimeStamp;
            },
            set(value: number) {
                if (this.timeStamp !== value) {
                    // @ts-ignore
                    this._innerCurrentTimeStamp = value;
                    Cesium.JulianDate.fromDate(new Date(value), this._falseTime);
                }
            }
        },
        _falseTime: {
            get() {
                if (!this.__falseTime) {
                    this.__falseTime = Cesium.JulianDate.fromDate(new Date(0));
                }
                return this.__falseTime;
            },
        }
    });

    // @ts-ignore
    const ou = Cesium.ParticleSystem.prototype.update;
    // @ts-ignore
    Cesium.ParticleSystem.prototype.update = function (frameState: Cesium.FrameState) {
        const originFrameStateTime = frameState.time;
        // @ts-ignore
        frameState.time = this._falseTime;
        try {
            ou.call(this, frameState);
            //@ts-ignore
            this._particles.forEach((particle) => {
                //@ts-ignore
                Cesium.Billboard.prototype && (particle._billboard.ESSceneObjectID = this.ESSceneObjectID);
            })
        } catch (error) {
            // do nothing...
        }
        frameState.time = originFrameStateTime;
    }
}