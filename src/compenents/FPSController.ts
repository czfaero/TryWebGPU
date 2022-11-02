import { mat4, quat, vec3 } from 'gl-matrix';
const originFront = vec3.fromValues(0, 0, -1);
const originRight = vec3.fromValues(1, 0, 0);
const maxRotationXDeg = 50;
export class FPSController {
    startPosition: vec3;
    startRotation: quat;
    position: vec3;
    rotation: quat;
    private _front: vec3;
    private _right: vec3;
    private _up: vec3;
    rotationXDeg: number;
    rotationYDeg: number;
    public get front() {
        vec3.transformQuat(this._front, originFront, this.rotation);
        return this._front;
    }
    public get right() {
        vec3.transformQuat(this._right, originRight, this.rotation);
        return this._right;
    }
    public get up() {
        vec3.cross(this._up, this.right, this.front);
        return this._up;
    }
    keyStatus: KeyStatus;
    constructor(startPos: vec3, startRotation: quat) {
        this.startPosition = startPos;
        this.position = vec3.clone(this.startPosition);
        this.startRotation = startRotation;
        this.rotation = quat.clone(startRotation);
        this.keyStatus = new KeyStatus();
        this._front = vec3.create();
        this._right = vec3.create();
        this._up = vec3.create();
        this.rotationXDeg = 0;
        this.rotationYDeg = 0;
    }
    Update(deltaTime: number) {
        let tempQuat = quat.create();
        const speed = 20;//deg per second
        const rotationSpeed = 30;
        if (this.keyStatus.A) {
            vec3.scaleAndAdd(this.position, this.position, this.right, -deltaTime * speed);
        }
        if (this.keyStatus.D) {
            vec3.scaleAndAdd(this.position, this.position, this.right, deltaTime * speed);
        }
        if (this.keyStatus.W) {
            vec3.scaleAndAdd(this.position, this.position, this.front, deltaTime * speed);
        }
        if (this.keyStatus.S) {
            vec3.scaleAndAdd(this.position, this.position, this.front, -deltaTime * speed);
        }
        if (this.keyStatus.Up) {
            this.rotationXDeg = clamp(
                this.rotationXDeg + rotationSpeed * deltaTime,
                -maxRotationXDeg, maxRotationXDeg
            );
        }
        if (this.keyStatus.Down) {
            this.rotationXDeg = clamp(
                this.rotationXDeg - rotationSpeed * deltaTime,
                -maxRotationXDeg, maxRotationXDeg
            );

        }
        if (this.keyStatus.Left) {
            // quat.setAxisAngle(tempQuat, this.up, rotationSpeed * deltaTime);
            // quat.mul(this.rotation, this.rotation, tempQuat);
            //quat.rotateY(this.rotation, this.rotation, rotationSpeed * deltaTime);
            this.rotationYDeg += rotationSpeed * deltaTime;
        }
        if (this.keyStatus.Right) {
            // quat.setAxisAngle(tempQuat, this.up, -rotationSpeed * deltaTime);
            // quat.mul(this.rotation, this.rotation, tempQuat);
            //quat.rotateY(this.rotation, this.rotation, -rotationSpeed * deltaTime);
            this.rotationYDeg -= rotationSpeed * deltaTime;
        }
        quat.fromEuler(this.rotation, this.rotationXDeg, this.rotationYDeg, 0);
    }
    Reset() {
        this.position = vec3.clone(this.startPosition);
        this.rotation = quat.clone(this.startRotation);
    }
}

class KeyStatus {
    Up: boolean;
    Down: boolean;
    Right: boolean;
    Left: boolean;
    W: boolean; S: boolean; A: boolean; D: boolean;
    Space: boolean;
    constructor() {
        type NameKey = keyof KeyStatus;
        const name2Key: Record<string, NameKey> = {
            "ArrowUp": "Up",
            "ArrowDown": "Down",
            "ArrowLeft": "Left",
            "ArrowRight": "Right",
            "KeyA": "A",
            "KeyS": "S",
            "KeyD": "D",
            "KeyW": "W",
        };
        document.addEventListener('keydown', (e) => {
            // e.repeat
            const key = name2Key[e.code];
            if (key) {
                this[key] = true;
            }
        });
        document.addEventListener('keyup', (e) => {
            const key = name2Key[e.code];
            if (key) {
                this[key] = false;
            }
        });
    }
}

const clamp = (e: number, low: number, high: number) => Math.min(Math.max(e, low), high);