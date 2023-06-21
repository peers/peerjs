/**
 * @type {typeof import("../peerjs").Peer}
 */
const Peer = window.Peer;

document.getElementsByTagName("title")[0].innerText =
	window.location.hash.substring(1);

const checkBtn = document.getElementById("check-btn");
const sendBtn = document.getElementById("send-btn");
const receiverIdInput = document.getElementById("receiver-id");
const connectBtn = document.getElementById("connect-btn");
const messages = document.getElementById("messages");
const result = document.getElementById("result");
const errorMessage = document.getElementById("error-message");

const peer = new Peer();
const received = [];
/**
 * @type {import("../peerjs").DataConnection}
 */
let dataConnection;
peer
	.once("open", (id) => {
		messages.textContent = `Your Peer ID: ${id}`;
	})
	.once("error", (error) => {
		errorMessage.textContent = JSON.stringify(error);
	})
	.once("connection", (connection) => {
		dataConnection = connection;
		dataConnection.on("data", (data) => {
			console.log(data);
			received.push(data);
		});
		dataConnection.once("close", () => {
			messages.textContent = "Closed!";
		});
	});

connectBtn.addEventListener("click", () => {
	const receiverId = receiverIdInput.value;
	if (receiverId) {
		dataConnection = peer.connect(receiverId);
		dataConnection.once("open", () => {
			messages.textContent = "Connected!";
		});
	}
});

checkBtn.addEventListener("click", async () => {
	try {
		window.check(received);
		result.textContent = "Success!";
	} catch (e) {
		result.textContent = "Failed!";
		errorMessage.textContent = JSON.stringify(e.message);
	} finally {
		messages.textContent = "Checked!";
	}
});

sendBtn.addEventListener("click", () => {
	dataConnection.once("error", (err) => {
		errorMessage.innerText = err.toString();
	});
	window.send(dataConnection);
	dataConnection.close({ flush: true });
	messages.textContent = "Sent!";
});
