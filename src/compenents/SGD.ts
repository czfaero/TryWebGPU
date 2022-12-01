
class Edge {
    constructor(
        public i: number,
        public j: number,
        public w: number
    ) { }
}
export class SGDRunner {
    _lambda: number;
    eta_max: number;
    edgeBuffer: Uint32Array;
    edgeWeightBuffer: Float32Array;
    edgeCount: number;
    vertexBuffer: Float32Array;
    vertexDimension: number;
    vertexCount: number;

    shortestPathCache: { [name: number]: { [name: number]: number } };
    constructor(nodeBuffer: Float32Array, linkBuffer: Uint32Array, linkWeightBuffer: Float32Array, _lambda = 0.3, eta_max = 10) {
        this._lambda = _lambda;
        this.eta_max = eta_max;
        this.edgeBuffer = linkBuffer;
        this.edgeWeightBuffer = linkWeightBuffer;
        this.edgeCount = linkBuffer.length / 2;
        this.vertexBuffer = nodeBuffer;
        this.vertexDimension = 3;
        this, this.vertexCount = this.vertexBuffer.length / this.vertexDimension;
        this.shortestPathCache = {};
    }

    private *annealing(_lambda: number, eta_max: number) {
        let eta = eta_max;
        let e_lambda = Math.pow(Math.E, -_lambda)
        while (eta > 1e-10) {
            eta = eta * e_lambda;
            yield eta;
        }
    }

    Run() {
        for (let i = 0; i < this.vertexBuffer.length; i++) {
            this.vertexBuffer[i] = Math.random();
        }
        //
        const etaIter = this.annealing(this._lambda, this.eta_max);
        let etaCurr = etaIter.next();

        while (!etaCurr.done) {
            const eta = etaCurr.value as number;
            for (let index = 0; index < this.edgeCount; index++) {
                const edge = this.getEdge(index);
                const v1 = this.getVertex(edge.i), v2 = this.getVertex(edge.j)
                const d = this.ShortestPath(edge);
                const w = d * d;
                const mu = Math.min(1, w * eta);
                const p = this.VectorAddScale(v1, v2, -1);
                const l = this.VectorNorm(p);// np.linalg.norm(p)
                const r = this.VectorScale(p, (l - d) / 2 / l);

                this.VectorScale(r, mu, r); // r = mur
                this.VectorAddScale(r, v1, 1, this.vertexBuffer, edge.i * this.vertexDimension);
                this.VectorAddScale(r, v2, -1, this.vertexBuffer, edge.j * this.vertexDimension);
            }
            etaCurr = etaIter.next();
        }
    }


    ShortestPath(e: Edge): number {
        // Bellman–Ford
        if (e.i in this.shortestPathCache) {
            const r = this.shortestPathCache[e.i];
            if (e.j in r) {
                return r[e.j];
            } else {
                throw "";
            }
        } else {
            this.shortestPathCache[e.i] = {}
        }

    }


    private getEdge(i: number): Edge {
        return new Edge(this.edgeBuffer[i * 2], this.edgeBuffer[i * 2 + 1], this.edgeWeightBuffer[i]);
    }
    private getVertex(i: number): Float32Array {
        return this.vertexBuffer.slice(
            i * this.vertexDimension, (i + 1) * this.vertexDimension)
    }
    private setVertex(i: number, value: Float32Array) {
        if (value.length != this.vertexDimension) throw "setVertex length error";
        this.vertexBuffer.set(value, i * this.vertexDimension);
    }
    private VectorNorm(a: Float32Array) {
        let r = 0;
        a.forEach(e => r += e * e);
        return Math.sqrt(r);

    }

    /** a + s * b */
    private VectorAddScale(a: Float32Array, b: Float32Array, s: number = 1, dst: Float32Array = null, dstOffset: number = 0): Float32Array {
        if (!dst) dst = new Float32Array(this.vertexDimension);
        for (let i = 0; i < this.vertexDimension; i++) {
            dst[i + dstOffset] = a[i] + s * b[i];
        }
        return dst;
    }
    private VectorScale(a: Float32Array, s: number, dst: Float32Array = null, dstOffset: number = 0): Float32Array {
        if (!dst) dst = new Float32Array(this.vertexDimension);
        for (let i = 0; i < this.vertexDimension; i++) {
            dst[i + dstOffset] = a[i] * s;
        }
        return dst;
    }
}