/**
 * @type {typeof import("../peerjs").Peer}
 */
const Peer = window.Peer;

document.getElementsByTagName("title")[0].innerText =
	window.location.hash.substring(1);

const callBtn = document.getElementById("call-btn");
console.log(callBtn);
const receiverIdInput = document.getElementById("receiver-id");
const closeBtn = document.getElementById("close-btn");
const messages = document.getElementById("messages");
const errorMessage = document.getElementById("error-message");

const stream = window["sender-stream"].captureStream(30);
// const stream =  await navigator.mediaDevices.getUserMedia({video: true, audio: true})
const peer = new Peer({ debug: 3 });
/**
 * @type {import("peerjs").MediaConnection}
 */
let mediaConnection;
peer
	.once("open", (id) => {
		messages.textContent = `Your Peer ID: ${id}`;
	})
	.once("error", (error) => {
		errorMessage.textContent = JSON.stringify(error);
	})
	.once("call", (call) => {
		mediaConnection = call;
		mediaConnection.on("stream", function (stream) {
			console.log("stream", stream);
			const video = document.getElementById("receiver-stream");
			console.log("video element", video);
			video.srcObject = stream;
			video.play();
		});
		mediaConnection.once("close", () => {
			messages.textContent = "Closed!";
		});
		call.answer(stream);
		messages.innerText = "Connected!";
	});

callBtn.addEventListener("click", async () => {
	console.log("calling");

	/** @type {string} */
	const receiverId = receiverIdInput.value;
	if (receiverId) {
		mediaConnection = peer.call(receiverId, stream);
		mediaConnection.on("stream", (stream) => {
			console.log("stream", stream);
			const video = document.getElementById("receiver-stream");
			console.log("video element", video);
			video.srcObject = stream;
			video.play();
			messages.innerText = "Connected!";
		});
		mediaConnection.on("close", () => {
			messages.textContent = "Closed!";
		});
	}
});

closeBtn.addEventListener("click", () => {
	mediaConnection.close();
});

callBtn.disabled = false;
