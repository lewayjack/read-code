import { Destroyable, Listener } from "xbsj-base";

export function registerEventUpdate(owner: Destroyable, event: Listener<any[]>, update: () => void) {
    update();
    owner.dispose(event.disposableOn(update));
}