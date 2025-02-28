import { getXyzFromPostion, lerpRotation, xyzToLbh } from "@sdkSrc/utils";
import { TimePosRotType } from ".";
import { CurrentInfoType } from "./CurrentInfoType";
import { RotLerpModeType } from "./RotLerpModeType";
import { Vector } from "xbsj-base";
/**
 * 控制点的rotation有可能为undefined，这里是获取左边最近的一个控制点的rotation
 * @param timePosRots 
 * @param index 
 * @returns 
 */
export function getLeftRotation(timePosRots: TimePosRotType[], index: number): [[number, number, number] | undefined, number] {
    if (index < 0) {
        return [undefined, 0];
    } else if (index > timePosRots.length - 1) {
        return [undefined, timePosRots.length - 1];
    }

    let rotation = undefined;
    do {
        rotation = timePosRots[index][2];
        if (rotation) break;
        if (index - 1 < 0) break;
        --index;
    } while (true);
    return [rotation, index];
}

/**
 * 控制点的rotation有可能为undefined，这里是获取右边最近的一个控制点的rotation
 * @param timePosRots 
 * @param index 
 * @returns 
 */
export function getRightRotation(timePosRots: TimePosRotType[], index: number): [[number, number, number] | undefined, number] {
    if (index < 0) {
        return [undefined, 0];
    } else if (index > timePosRots.length - 1) {
        return [undefined, timePosRots.length - 1];
    }

    let rotation = undefined;
    do {
        rotation = timePosRots[index][2];
        if (rotation) break;
        if (index + 1 >= timePosRots.length) break;
        ++index;
    } while (true);
    return [rotation, index];
}

export function getCurrent(timePosRots: TimePosRotType[], timeStamp: number, rotLerpMode: RotLerpModeType = 'Lerp'): CurrentInfoType | undefined {
    let currentPosition!: [number, number, number];
    let currentRotation: [number, number, number] | undefined;
    let currentIndex!: number;
    let currentRatio!: number;

    const l = timePosRots.length;

    if (l === 0) {
        return undefined;
    }

    do {
        if (timeStamp <= timePosRots[0][0]) {
            currentPosition = timePosRots[0][1];
            currentRotation = timePosRots[0][2];
            currentIndex = 0;
            currentRatio = 0;
            break;
        } else if (timeStamp >= timePosRots[timePosRots.length - 1][0]) {
            const [_, position, rotation] = timePosRots[timePosRots.length - 1];
            currentPosition = position;
            currentRotation = rotation;
            currentIndex = timePosRots.length - 2;
            currentRatio = 1;
            break;
        }

        const nextIndex = timePosRots.findIndex(([time]) => timeStamp <= time);
        if (nextIndex === -1) {
            throw new Error(`nextIndex === -1`);
        }
        currentIndex = nextIndex - 1;

        {
            const [l_timeStamp, l_position] = timePosRots[currentIndex];
            const [r_timeStamp, r_position] = timePosRots[nextIndex];
            const ratio = (timeStamp - l_timeStamp) / (r_timeStamp - l_timeStamp);
            const l_xyz = getXyzFromPostion(l_position);
            const r_xyz = getXyzFromPostion(r_position);
            const m_xyz = Vector.lerp<[number, number, number]>(l_xyz, r_xyz, ratio);
            const m_lbh = xyzToLbh(m_xyz);
            currentPosition = m_lbh;
            currentRatio = ratio;
        }

        {
            let [l_rotation, l_i] = getLeftRotation(timePosRots, currentIndex);
            let [r_rotation, r_i] = getRightRotation(timePosRots, nextIndex);

            if (rotLerpMode === 'Lerp') {
                if (l_rotation && r_rotation) {
                    if (l_i < 0 || r_i >= timePosRots.length) {
                        throw new Error('Invalid rotation index');
                    }
                    const ratio = (timeStamp - timePosRots[l_i][0]) / (timePosRots[r_i][0] - timePosRots[l_i][0]);
                    currentRotation = lerpRotation(l_rotation, r_rotation, ratio);
                } else if (l_rotation) {
                    currentRotation = l_rotation;
                } else if (r_rotation) {
                    currentRotation = r_rotation;
                } else {
                    currentRotation = undefined;
                }
            } else if (rotLerpMode === 'Prev') {
                if (l_rotation) {
                    currentRotation = l_rotation;
                }
            } else if (rotLerpMode === 'Next') {
                if (r_rotation) {
                    currentRotation = r_rotation;
                }
            }
        }
    } while (false);

    return {
        position: currentPosition,
        rotation: currentRotation,
        index: currentIndex,
        ratio: currentRatio,
    };
}
