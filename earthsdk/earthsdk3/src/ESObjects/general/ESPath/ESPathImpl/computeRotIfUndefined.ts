import { geoHeading, lbhToXyz, lerpRotation } from "@sdkSrc/utils";
import { ESPathImpl, TimePosRotType } from ".";
import { Vector } from "xbsj-base";

export function computeRotIfUndefinedUsingPrevLine(timePosRots: TimePosRotType[], force: boolean = false) {
    const newTimePosRots = timePosRots.map(e => [e[0], [...e[1]], e[2] ? [...e[2]] : undefined]) as TimePosRotType[];
    const l = newTimePosRots.length;
    if (l === 0) return newTimePosRots;

    if (l === 1) {
        if (!newTimePosRots[0][2] === undefined || force) {
            newTimePosRots[0][2] = undefined;
        }
        return newTimePosRots;
    }

    for (let i = 1; i < l; ++i) {
        if (newTimePosRots[i][2] !== undefined && !force) {
            continue;
        }

        const lp = newTimePosRots[i - 1][1];
        const rp = newTimePosRots[i][1];
        const lc = lbhToXyz(lp);
        const rc = lbhToXyz(rp);
        const distance = Vector.distance(lc, rc);
        if (distance === 0) {
            newTimePosRots[i][2] = newTimePosRots[i - 1][2];
            continue;
        }

        const heading = geoHeading(lp, rp);
        const height = rp[2] - lp[2];
        const pitch = Math.asin(height / distance) * 180 / Math.PI;

        const h = Number.isFinite(heading) ? heading : 0;
        const p = Number.isFinite(pitch) ? pitch : 0;
        newTimePosRots[i][2] = [h, p, 0];
    }

    if (newTimePosRots[0][2] === undefined || force) {
        newTimePosRots[0][2] = l > 1 ? newTimePosRots[1][2] : undefined;
    }
    return newTimePosRots;
}

export function computeRotIfUndefinedUsingNextLine(timePosRots: TimePosRotType[], force: boolean = false) {
    const newTimePosRots = timePosRots.map(e => [e[0], [...e[1]], e[2] ? [...e[2]] : undefined]) as TimePosRotType[];
    const l = newTimePosRots.length;

    if (l === 0) return newTimePosRots;

    if (l === 1) {
        if (!newTimePosRots[0][2] === undefined || force) {
            newTimePosRots[0][2] = undefined;
        }
        return newTimePosRots;
    }

    for (let i = l - 2; i >= 0; --i) {
        if (newTimePosRots[i][2] !== undefined && !force) {
            continue;
        }

        const lp = newTimePosRots[i][1];
        const rp = newTimePosRots[i + 1][1];
        const lc = lbhToXyz(lp);
        const rc = lbhToXyz(rp);
        const distance = Vector.distance(lc, rc);
        if (distance === 0) {
            newTimePosRots[i][2] = newTimePosRots[i + 1][2];
            continue;
        }

        const heading = geoHeading(lp, rp);
        const height = rp[2] - lp[2];
        const pitch = Math.asin(height / distance) * 180 / Math.PI;

        const h = Number.isFinite(heading) ? heading : 0;
        const p = Number.isFinite(pitch) ? pitch : 0;
        newTimePosRots[i][2] = [h, p, 0];
    }

    if (newTimePosRots[l - 1][2] === undefined || force) {
        newTimePosRots[l - 1][2] = l > 1 ? newTimePosRots[l - 2][2] : [0, 0, 0];
    }
    return newTimePosRots;
}

export function setRotIfUndefined(timePosRots: TimePosRotType[], value: [number, number, number]) {
    const l = timePosRots.length;
    for (let i = 0; i < l; ++i) {
        if (timePosRots[i][2] === undefined) {
            timePosRots[i][2] = [...value];
        }
    }
}

export function computeRotIfUndefinedUsingLerp(timePosRots: TimePosRotType[], force: boolean = false) {
    const p = computeRotIfUndefinedUsingPrevLine(timePosRots, force);
    const n = computeRotIfUndefinedUsingNextLine(timePosRots, force);
    if (p.length !== n.length) {
        throw new Error("p.length !== n.length");
    }

    const l = p.length;

    for (let i = 0; i < l; i++) {
        const pi2 = p[i][2];
        const ni2 = n[i][2];
        if (pi2 === undefined && ni2 === undefined) {
            p[i][2] = undefined;
        } else if (pi2 === undefined) {
            p[i][2] = ni2;
        } else if (ni2 === undefined) {
            p[i][2] = pi2;
        } else {
            p[i][2] = lerpRotation(pi2, ni2, 0.5);
        }
    }

    return p;
}

/**
 * @param geoPath 
 * @param intervalDistance 
 * @param reserveOrigin 
 * @returns 
 */
export function addAroundPoints(geoPath: ESPathImpl, intervalDistance: number[], reserveOrigin: boolean) {
    // 前后转弯比后期可以开出去
    const turningRatio = 0.5;
    let overlappingDistributionDistance: undefined | number = undefined;
    if (!geoPath.timePosRots) return undefined;
    console.log('before', [...geoPath.timePosRots]);
    const newTimePosRots: TimePosRotType[] = [];
    const l = geoPath.timePosRots.length;
    if (l <= 2) return;

    newTimePosRots.push(geoPath.timePosRots[0]);
    for (let i = 1; i < l - 1; ++i) {
        const prev = geoPath.timePosRots[i - 1][0];
        const current = geoPath.timePosRots[i][0];
        const next = geoPath.timePosRots[i + 1][0];
        const prevDistance = geoPath.accumDistances[i - 1];
        const currentDistance = geoPath.accumDistances[i];
        const nextDistance = geoPath.accumDistances[i + 1];
        do {
            const d = currentDistance - prevDistance;
            if (d === 0) continue;
            // if (d <= 2 * (intervalDistance.length == 1 ? intervalDistance[0] : intervalDistance[i - 1]) * turningRatio) break;
            // 如果当前拐弯距离跟上一拐弯距离重合，按比例均分这条线
            const id = d - (overlappingDistributionDistance ?? (intervalDistance.length == 1 ? intervalDistance[0] : (intervalDistance[i - 1] || intervalDistance[intervalDistance.length - 1])) * turningRatio);
            let r = (id < 0 ? 0 : id) / d;
            if (Number.isNaN(r)) r = 0;
            const time = (1 - r) * prev + r * current;
            const c = geoPath.getCurrent(time);
            if (!c) break;
            newTimePosRots.push([time, c.position, c.rotation]);
        } while (false);

        if (reserveOrigin) {
            newTimePosRots.push(geoPath.timePosRots[i]);
        }

        do {
            const d = nextDistance - currentDistance;
            if (d === 0) continue;
            // if (d <= 2 * (intervalDistance.length == 1 ? intervalDistance[0] : intervalDistance[i - 1]) * turningRatio) break;
            let id = (intervalDistance.length == 1 ? intervalDistance[0] : (intervalDistance[i - 1] || intervalDistance[intervalDistance.length - 1])) * turningRatio;
            const nextPrev = (intervalDistance.length == 1 ? intervalDistance[0] : (intervalDistance[i] || intervalDistance[intervalDistance.length - 1])) * turningRatio || 0;
            // 如果前后转弯距离超过这条线了，按比例均分，否则自己用自己的距离
            if (id + nextPrev > d) {
                id = d * (id / (id + nextPrev))
                overlappingDistributionDistance = d - id;
            } else {
                overlappingDistributionDistance = undefined;
            }
            let r = (id < 0 ? 0 : id) / d;
            const time = (1 - r) * current + r * next;
            const c = geoPath.getCurrent(time);
            if (!c) break;
            newTimePosRots.push([time, c.position, c.rotation]);
        } while (false);
    }
    newTimePosRots.push(geoPath.timePosRots[l - 1]);
    console.log('after', [...newTimePosRots]);

    geoPath.timePosRots = newTimePosRots;
}