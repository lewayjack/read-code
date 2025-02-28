import * as Cesium from 'cesium';

declare module "cesium" {
    interface Camera {
        readonly currentFlightEvent: Cesium.Event;
    }
}

export function fixCameraFlight() {
    if (!!Reflect.getOwnPropertyDescriptor(Cesium.Camera.prototype, '_currentFlight')) {
        return;
    }

    Object.defineProperties(Cesium.Camera.prototype, {
        _currentFlight: {
            get: function () {
                return this._vtxf_currentFlight;
            },
            set: function (value) {
                if (this._vtxf_currentFlight === value) {
                    return;
                }
    
                this._vtxf_currentFlight = value;
    
                var oldValue = this._vtxf_currentFlight;
                var newValue = value;
                this.currentFlightEvent.raiseEvent(newValue, oldValue);
            }
        },
        currentFlightEvent: {
            get: function () {
                if (typeof this._vtxf_currentFlightEvent === 'undefined') {
                    this._vtxf_currentFlightEvent = new Cesium.Event();
                }            
                return this._vtxf_currentFlightEvent;
            }
        }
    });
}
