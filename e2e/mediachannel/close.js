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
		mediaConnection
			.once("stream", function (stream) {
				const video = document.getElementById("receiver-stream");
				video.srcObject = stream;
				video.play();
			})
			.once("close", () => {
				messages.textContent = "Closed!";
			})
			.once("willCloseOnRemote", () => {
				messages.textContent = "Connected!";
			});
		call.answer(stream);
	});

callBtn.addEventListener("click", async () => {
	console.log("calling");

	/** @type {string} */
	const receiverId = receiverIdInput.value;
	if (receiverId) {
		mediaConnection = peer.call(receiverId, stream);
		mediaConnection
			.once("stream", (stream) => {
				const video = document.getElementById("receiver-stream");
				video.srcObject = stream;
				video.play();
				messages.innerText = "Connected!";
			})
			.once("close", () => {
				messages.textContent = "Closed!";
			});
	}
});

closeBtn.addEventListener("click", () => {
	mediaConnection.close();
});

callBtn.disabled = false;
