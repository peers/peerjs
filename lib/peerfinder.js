var PeerFinder = function(){
};

PeerFinder.prototype.GetBestPeer = function(channel,callback){
	this.socket.emit("join channel",channel);
	this.onFindPeer = callback;
	this.socket.emit("get peer list");
};
function onPeerList(peers,self){
	console.log(peers);
	self.PeerList = peers;
	var length = Object.keys(peers).length;
	if (length > 0) {
		var i = 0;
		var num = self.getRandomNumber(length, 13322344);
		console.log(num);
		var hpeer = null;
		var hRating = 0;
		for (var p in peers) {
			var Clients = peers[p].Clients ? peers[p].Clients : 0;
			var Max = peers[p].Max;
			if (peers[p].Rating >= hRating && Clients <= Max) { //Grab the hpeer rating connection with less than four connections.
				hRating = peers[p].Rating;
				hpeer = p;
				self.tier = peers[p].Tier + 1;				
			}
			i = i + 1;
			if (num == i && p != null ) {
				if (!hpeer) {
					hpeer = p;
					hRating = peers[p].Rating;
					self.tier = peers[p].Tier + 1;
				}
			}
		}
		if (hpeer) {
			self.currentPeerId = hpeer;
			self.BestPeer = peers[hpeer];
			if(self.onFindPeer)
				self.onFindPeer(hpeer);
		}
	}
}
PeerFinder.prototype.determineDepth = function(amt,depth) {
		var a = amt/3;
		if(a > 1) {
			depth = depth + 1;
			return this.determineDepth(a,depth);
		}else{
			return depth;
		}
	};
PeerFinder.prototype.bindSocket = function(socket){
	var self = this;
	this.socket = socket;
	this.socket.on("peer list",function(peers) {onPeerList(peers,self); });
	this.socket.on("joined channel",function(){
		
	});
	this.socket.on("channel clients", function(m){
        self.availabletiers = self.determineDepth(parseFloat(m),0);
    });
};
PeerFinder.prototype.getRandomNumber = function(upto){
	var raw = Math.random();
	var number = Math.floor(raw * upto);
	return number;
};
module.exports = PeerFinder;