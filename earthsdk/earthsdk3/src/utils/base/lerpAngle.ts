
export function clamp0_360(angle: number) {
    let clampAngle = angle % 360;
    clampAngle = clampAngle < 0 ? 360 + clampAngle : clampAngle;
    return clampAngle;
}

export function clampN180_180(angle: number) {
    return clamp0_360(angle + 180) - 180;
}

export function lerpAngle(leftAngle: number, rightAngle: number, ratio: number) {
    let lca = clamp0_360(leftAngle);
    let rca = clamp0_360(rightAngle);
    if (Math.abs(lca - rca) > 180) {
        if (lca < rca) {
            lca += 360;
        } else {
            rca += 360;
        }
    }

    const lerpResult = lca * (1 - ratio) + rca * ratio;

    return clampN180_180(lerpResult);
}

export function lerpRotation(leftRotation: [number, number, number], rightRotation: [number, number, number], ratio: number, targetRotation?: [number, number, number]): [number, number, number] {
    targetRotation = targetRotation || [0, 0, 0];
    targetRotation[0] = lerpAngle(leftRotation[0], rightRotation[0], ratio);
    targetRotation[1] = lerpAngle(leftRotation[1], rightRotation[1], ratio);
    targetRotation[2] = lerpAngle(leftRotation[2], rightRotation[2], ratio);
    return targetRotation; // 返回目标旋转值
}