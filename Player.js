
'use strict';

/**
 * Creates new player for video and ad playback.
 * @param {cast.receiver.MediaManager} mediaElement The video element.
 */
var Player = function(mediaElement) {
  var namespace = 'urn:x-cast:com.google.ads.ima.cast';
  this.mediaElement_ = mediaElement;
  this.mediaManager_ = new cast.receiver.MediaManager(this.mediaElement_);
  this.castReceiverManager_ = cast.receiver.CastReceiverManager.getInstance();
  this.imaMessageBus_ = this.castReceiverManager_.getCastMessageBus(namespace);
  this.castReceiverManager_.start();

  this.originalOnLoad_ = this.mediaManager_.onLoad.bind(this.mediaManager_);
  this.originalOnEnded_ = this.mediaManager_.onEnded.bind(this.mediaManager_);
  this.originalOnSeek_ = this.mediaManager_.onSeek.bind(this.mediaManager_);

  this.setupCallbacks_();
};
/**
 * Attaches necessary callbacks.
 * @private
 */
Player.prototype.setupCallbacks_ = function() {
  var self = this;

  // Google Cast device is disconnected from sender app.
  this.castReceiverManager_.onSenderDisconnected = function() {
    window.close();
  };

  // Receives messages from sender app. The message is a comma separated string
  // where the first substring indicates the function to be called and the
  // following substrings are the parameters to be passed to the function.
  this.imaMessageBus_.onMessage = function(event) {
    console.log(event.data);
    var message = event.data.split(',');
    var method = message[0];
    switch (method) {
      case 'requestAd':
        var adTag = message[1];
        var currentTime = parseFloat(message[2]);
        self.requestAd_(adTag, currentTime);
        break;
      case 'seek':
        var time = parseFloat(message[1]);
        self.seek_(time);
        break;
      default:
        self.broadcast_('Message not recognized');
        break;
    }
  };

  // Initializes IMA SDK when Media Manager is loaded.
  this.mediaManager_.onLoad = function(event) {
    self.originalOnLoadEvent_ = event;
    self.initIMA_();
    self.originalOnLoad_(self.originalOnLoadEvent_);
  };
};

/**
 * Sends messages to all connected sender apps.
 * @param {!string} message Message to be sent to senders.
 * @private
 */
Player.prototype.broadcast_ = function(message) {
  this.imaMessageBus_.broadcast(message);
};
