import { mat4, quat, vec3 } from 'gl-matrix';

export class FPSController {
    startPosition: vec3;
    startDirection: vec3;
    position: vec3;
    direction: vec3;
    keyStatus: KeyStatus;
    rotation: quat;
    up: vec3;
    right: vec3;
    constructor(startPos: vec3, startDirection: vec3) {
        this.startPosition = startPos;
        this.position = vec3.clone(this.startPosition);
        this.startDirection = startDirection;
        this.direction = vec3.clone(this.startDirection);
        this.keyStatus = new KeyStatus();
        this.up = vec3.fromValues(0, 1, 0);
        this.right = vec3.create();
        vec3.cross(this.right, this.direction, this.up);
    }
    Update(deltaTime: number) {
        const speed = 10;//1 per second
        const rotationSpeed = 10;
        if (this.keyStatus.A) {
            vec3.scaleAndAdd(this.position, this.position, this.right, -deltaTime * speed);
        }
        if (this.keyStatus.D) {
            vec3.scaleAndAdd(this.position, this.position, this.right, deltaTime * speed);
        }
        if (this.keyStatus.W) {
            vec3.scaleAndAdd(this.position, this.position, this.direction, deltaTime * speed);
        }
        if (this.keyStatus.S) {
            vec3.scaleAndAdd(this.position, this.position, this.direction, -deltaTime * speed);
        }
        if (this.keyStatus.Up) {

        }
    }
    Reset() {
        this.position = this.startPosition;
        this.direction = this.startDirection;
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