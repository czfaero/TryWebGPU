
class Edge {
    constructor(
        public u: number,
        public v: number,
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
            console.log(eta)
            for (let index = 0; index < this.edgeCount; index++) {
                const edge = this.getEdge(index);
                const v1 = this.getVertex(edge.u), v2 = this.getVertex(edge.v)
                const d = this.ShortestPath(edge);
                const w = d * d;
                const mu = Math.min(1, w * eta);
                const p = this.VectorAddScale(v1, v2, -1);
                const l = this.VectorNorm(p);// np.linalg.norm(p)
                const r = this.VectorScale(p, (l - d) / 2 / l);

                this.VectorScale(r, mu, r); // r = mur
                this.VectorAddScale(r, v1, 1, this.vertexBuffer, edge.u * this.vertexDimension);
                this.VectorAddScale(r, v2, -1, this.vertexBuffer, edge.v * this.vertexDimension);
            }
            etaCurr = etaIter.next();
        }
    }


    ShortestPath(e: Edge): number {
        if (e.u in this.shortestPathCache) {
            const r = this.shortestPathCache[e.u];
            if (e.v in r) {
                return r[e.v];
            } else {
                throw "";
            }
        }
        // Bellman–Ford
        let distance = new Float32Array(this.vertexCount);
        let predecessor = new Array(this.vertexCount);
        distance.fill(Infinity);
        distance[e.u] = 0;

        // step 2
        for (let ii = 0; ii < this.vertexCount - 1; ii++)
            for (let i = 0; i < this.edgeCount; i++) {
                const edge = this.getEdge(i);
                if (distance[edge.u] + edge.w < distance[edge.v]) {
                    distance[edge.v] = distance[edge.u] + edge.w;
                    predecessor[edge.v] = edge.u;
                }

            }

        // step 3 
        for (let i = 0; i < this.edgeCount; i++) {
            const edge = this.getEdge(i);
            if (distance[edge.u] + edge.w < distance[edge.v]) {
                if (distance[edge.u] + edge.w < distance[edge.v]) {
                    console.log("negative-weight cycle");break;
                   // throw "negative-weight cycle";
                }
            }
        }

        this.shortestPathCache[e.u] = distance;
        return this.shortestPathCache[e.u][e.v];
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