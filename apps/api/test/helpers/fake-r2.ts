/**
 * Fake R2Bucket para tests.
 *
 * Implementa la porción del contrato de Cloudflare R2 que usa
 * `receipt-storage.util`: `put`, `get`, `delete`, `head`, `list`.
 * El body devuelto por `get` incluye `writeHttpMetadata` y `httpEtag`
 * para poder simular la respuesta del stream endpoint.
 */

interface StoredObject {
  key: string;
  data: ArrayBuffer;
  httpMetadata?: R2HTTPMetadata;
  customMetadata?: Record<string, string>;
  etag: string;
  uploaded: Date;
}

export interface FakeR2 extends R2Bucket {
  clear: () => void;
  _size: () => number;
  _keys: () => string[];
}

const encoder = new TextEncoder();

function computeEtag(data: ArrayBuffer): string {
  // ETag simulado: hash naïve del length + primeros bytes. Suficiente para tests.
  const view = new Uint8Array(data);
  let acc = 0;
  for (let i = 0; i < Math.min(64, view.length); i++) {
    acc = (acc * 31 + view[i]) >>> 0;
  }
  return `"${data.byteLength.toString(16)}-${acc.toString(16)}"`;
}

export function createFakeR2(): FakeR2 {
  const store = new Map<string, StoredObject>();

  const toObjectBody = (obj: StoredObject): R2ObjectBody => {
    const bodyStream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(obj.data));
        controller.close();
      },
    });
    return {
      key: obj.key,
      version: "1",
      size: obj.data.byteLength,
      etag: obj.etag,
      httpEtag: obj.etag,
      uploaded: obj.uploaded,
      httpMetadata: obj.httpMetadata,
      customMetadata: obj.customMetadata ?? {},
      body: bodyStream,
      bodyUsed: false,
      writeHttpMetadata(headers: Headers) {
        if (obj.httpMetadata?.contentType) {
          headers.set("content-type", obj.httpMetadata.contentType);
        }
      },
      async arrayBuffer() {
        return obj.data;
      },
      async text() {
        return new TextDecoder().decode(obj.data);
      },
      async json<T = unknown>(): Promise<T> {
        return JSON.parse(new TextDecoder().decode(obj.data)) as T;
      },
      async blob() {
        return new Blob([obj.data]);
      },
      checksums: {} as R2Checksums,
      storageClass: "Standard",
      ssecKeyMd5: undefined,
    } as unknown as R2ObjectBody;
  };

  const bucket = {
    async put(
      key: string,
      value: ReadableStream | ArrayBuffer | ArrayBufferView | string | Blob | null,
      options?: R2PutOptions
    ): Promise<R2Object> {
      let data: ArrayBuffer;
      if (value == null) {
        data = new ArrayBuffer(0);
      } else if (value instanceof ArrayBuffer) {
        data = value;
      } else if (ArrayBuffer.isView(value)) {
        data = value.buffer.slice(
          value.byteOffset,
          value.byteOffset + value.byteLength
        ) as ArrayBuffer;
      } else if (typeof value === "string") {
        data = encoder.encode(value).buffer as ArrayBuffer;
      } else if (value instanceof Blob) {
        data = await value.arrayBuffer();
      } else {
        const reader = (value as ReadableStream<Uint8Array>).getReader();
        const chunks: Uint8Array[] = [];
        let total = 0;
        while (true) {
          const { done, value: chunk } = await reader.read();
          if (done) break;
          chunks.push(chunk);
          total += chunk.byteLength;
        }
        const merged = new Uint8Array(total);
        let offset = 0;
        for (const chunk of chunks) {
          merged.set(chunk, offset);
          offset += chunk.byteLength;
        }
        data = merged.buffer as ArrayBuffer;
      }

      const etag = computeEtag(data);
      const obj: StoredObject = {
        key,
        data,
        httpMetadata: options?.httpMetadata as R2HTTPMetadata | undefined,
        customMetadata: options?.customMetadata,
        etag,
        uploaded: new Date(),
      };
      store.set(key, obj);
      const { body: _body, ...rest } = toObjectBody(obj) as R2ObjectBody & {
        body: unknown;
      };
      return rest as unknown as R2Object;
    },

    async get(key: string): Promise<R2ObjectBody | null> {
      const obj = store.get(key);
      return obj ? toObjectBody(obj) : null;
    },

    async head(key: string): Promise<R2Object | null> {
      const obj = store.get(key);
      if (!obj) return null;
      const body = toObjectBody(obj) as R2ObjectBody & { body: unknown };
      const { body: _body, ...rest } = body;
      return rest as unknown as R2Object;
    },

    async delete(key: string | string[]): Promise<void> {
      const keys = Array.isArray(key) ? key : [key];
      for (const k of keys) store.delete(k);
    },

    async list(options?: R2ListOptions): Promise<R2Objects> {
      const prefix = options?.prefix ?? "";
      const objects = Array.from(store.values())
        .filter((o) => o.key.startsWith(prefix))
        .map((obj) => {
          const body = toObjectBody(obj) as R2ObjectBody & { body: unknown };
          const { body: _body, ...rest } = body;
          return rest as unknown as R2Object;
        });
      return {
        objects,
        truncated: false,
        delimitedPrefixes: [],
      } as unknown as R2Objects;
    },

    async createMultipartUpload() {
      throw new Error("Multipart no soportado por FakeR2");
    },

    async resumeMultipartUpload() {
      throw new Error("Multipart no soportado por FakeR2");
    },

    clear() {
      store.clear();
    },

    _size() {
      return store.size;
    },

    _keys() {
      return Array.from(store.keys());
    },
  };

  return bucket as unknown as FakeR2;
}
