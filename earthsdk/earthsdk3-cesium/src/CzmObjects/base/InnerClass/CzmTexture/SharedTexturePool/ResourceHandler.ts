import { Destroyable } from "xbsj-base";

export class ResourceHandler<T extends { destroy(): void }> extends Destroyable {
    _resouceRef?: {
        resouce: T;
        ref: number;
    };
    constructor(resouce?: T) {
        super();
        if (resouce) {
            this._resouceRef = {
                resouce,
                ref: 1,
            };
        }
        this.dispose(() => this.reset());
    }

    get valid() {
        return !!this._resouceRef;
    }

    get raw() {
        return this._resouceRef?.resouce;
    }

    get ref() {
        return this._resouceRef?.ref;
    }

    getRef(target?: ResourceHandler<T>) {
        target = target ?? new ResourceHandler<T>();
        target.reset(this);
        return target;
    }

    equal(target: ResourceHandler<T>) {
        return (target._resouceRef === this._resouceRef);
    }

    reset(handler?: ResourceHandler<T>): this {
        if (this._resouceRef) {
            if (this._resouceRef.ref <= 0) {
                throw new Error('ref <= 0!');
            }
            --this._resouceRef.ref;
            if (this._resouceRef.ref === 0) {
                this._resouceRef.resouce.destroy();
            }
            this._resouceRef = undefined;
        }

        if (handler) {
            if (!handler._resouceRef) {
                throw new Error('handler._resouceRef is undefined!');
            }
            handler._resouceRef.ref += 1;
            this._resouceRef = handler._resouceRef;
        }

        return this;
    }
}