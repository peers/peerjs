export interface PromiseEvents<OpenType, ErrorType extends string> {
	open: (open?: OpenType) => void;
	error: (error: PeerError<`${ErrorType}`>) => void;
}

/**
 * A PeerError is emitted whenever an error occurs.
 * It always has a `.type`, which can be used to identify the error.
 */
export class PeerError<T extends string> extends Error {
	/**
	 * @internal
	 */
	constructor(type: T, err: Error | string) {
		if (typeof err === "string") {
			super(err);
		} else {
			super();
			Object.assign(this, err);
		}

		this.type = type;
	}

	public type: T;
}
