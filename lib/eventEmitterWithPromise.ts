import EventEmitter from "eventemitter3";
import logger from "./logger";
import { PeerError, PromiseEvents } from "./peerError";

export class EventEmitterWithPromise<
		AwaitType extends EventEmitter<Events>,
		OpenType,
		ErrorType extends string,
		Events extends PromiseEvents<OpenType, ErrorType>,
	>
	extends EventEmitter<Events | PromiseEvents<OpenType, ErrorType>, never>
	implements Promise<AwaitType>
{
	protected _open = false;
	readonly [Symbol.toStringTag]: string;

	catch<TResult = never>(
		onrejected?:
			| ((reason: PeerError<`${ErrorType}`>) => PromiseLike<TResult> | TResult)
			| undefined
			| null,
	): Promise<AwaitType | TResult> {
		return this.then(undefined, onrejected);
	}

	finally(onfinally?: (() => void) | undefined | null): Promise<AwaitType> {
		return this.then().finally(onfinally);
	}

	then<TResult1 = AwaitType, TResult2 = never>(
		onfulfilled?:
			| ((value: AwaitType) => PromiseLike<TResult1> | TResult1)
			| undefined
			| null,
		onrejected?:
			| ((reason: any) => PromiseLike<TResult2> | TResult2)
			| undefined
			| null,
	): Promise<TResult1 | TResult2> {
		const p = new Promise((resolve, reject) => {
			const onOpen = () => {
				this.off("error", onError);
				// Remove 'then' to prevent potential recursion issues
				// `await` will wait for a Promise-like to resolve recursively
				resolve?.(proxyWithoutThen(this));
			};
			const onError = (err: PeerError<`${ErrorType}`>) => {
				this.removeListener("open", onOpen);
				reject(err);
			};
			if (this._open) {
				onOpen();
				return;
			}
			this.once("open", onOpen);
			this.once("error", onError);
		});
		return p.then(onfulfilled, onrejected);
	}

	/**
	 * Emits a typed error message.
	 *
	 * @internal
	 */
	emitError(type: ErrorType, err: string | Error): void {
		logger.error("Error:", err);

		this.emit("error", new PeerError<`${ErrorType}`>(`${type}`, err));
	}
}

function proxyWithoutThen<T extends object>(obj: T) {
	return new Proxy(obj, {
		get(target, p, receiver) {
			if (p === "then") {
				return undefined;
			}
			return Reflect.get(target, p, receiver);
		},
	});
}
