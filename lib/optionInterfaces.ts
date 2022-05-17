export interface AnswerOption {
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
	label?: string;
	metadata?: any;
	serialization?: string;
	reliable?: boolean;
}

export interface CallOption {
	metadata?: any;
	sdpTransform?: Function;
}
