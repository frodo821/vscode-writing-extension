export type Ref<T> = { self?: T };
export type DisposableRef<T> = Ref<T> & { dispose(): void };
