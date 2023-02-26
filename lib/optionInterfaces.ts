export interface AnswerOption {
	/**
	 * Function which runs before create answer to modify sdp answer message.
	 */
	sdpTransform?: Function;
}

export interface PeerJSOption {
	key?: string;
	host?: string;
	port?: number;
	path?: string;
	secure?: boolean;
	token?: string;
	config?: RTCConfiguration;
	debug?: number;
	referrerPolicy?: ReferrerPolicy;
}

export interface PeerConnectOption {
	/**
	 * A unique label by which you want to identify this data connection.
	 * If left unspecified, a label will be generated at random.
	 *
	 * Can be accessed with {@apilink DataConnection.label}
	 */
	label?: string;
	/**
	 * Metadata associated with the connection, passed in by whoever initiated the connection.
	 *
	 * Can be accessed with {@apilink DataConnection.metadata}.
	 * Can be any serializable type.
	 */
	metadata?: any;
	serialization?: string;
	reliable?: boolean;
}

export interface CallOption {
	/**
	 * Metadata associated with the connection, passed in by whoever initiated the connection.
	 *
	 * Can be accessed with {@apilink MediaConnection.metadata}.
	 * Can be any serializable type.
	 */
	metadata?: any;
	/**
	 * Function which runs before create offer to modify sdp offer message.
	 */
	sdpTransform?: Function;
}
