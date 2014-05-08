/**
 * @fileoverview The main file for the caption-phone app.
 * Displays a list of peers and sets up a media connection
 * with one of them. Web Speech API text is shared between
 * clients using the data channel.
 */

/**
 * To make browser agnostic
 */
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

/**
 * The peerjs apikey for this app
 * @const
 * @type {string}
 * @private
 */
var APIKEY_ = '6165842a-5c0d-11e3-b514-75d3313b9d05';

/**
 * The peerjs object
 * @type {Object}
 * @private
 */
var peer_;

/**
 * The peerjs data connection object
 * @type {Object}
 * @private
 */
var peerConn_;

/**
 * The peerjs media call object
 * @type {Object}
 * @private
 */
var peerCall_;

/**
 * The Speech object
 * @type {Object}
 * @private
 */
var speech_;

/**
 * The Storage object
 * @type {Object}
 * @private
 */
var storage_;

/**
 * Boolean containing if the client is the caller
 * @type {boolean}
 * @private
 */
var isCaller_ = false;

/**
 * The peerjs id of the user client
 * @type {String}
 * @private
 */
var myid_ = null;

/**
 * The peerjs id of the peer client
 * @type {String}
 * @private
 */
var peerid_ = null;

/**
 * Flag indicating that the local stream is set
 * @type {boolean}
 * @private
 */
var localset_ = false;

/**
 * Flag indicating that the remote stream is set
 * @type {boolean}
 * @private
 */
var remoteset_ = false;

/**
 * Flag indicating that this client initiated the disconnect
 * @type {boolean}
 * @private
 */
var isDisconnector_ = false;

/**
 * Holds the uuid of the current active session
 * @type {string}
 * @private
 */
var currSessionId_ = null;

/**
 * Flag indicating that the message is the first one in a session
 * @type {boolean}
 */
var isFirstMessage = true;

/**
 * Default speech recognition options
 * @type {{continuous: boolean, interimResults: boolean, lang: string}}
 * @private
 */
var speechOptions_ = {
    continuous: true,
    interimResults: true,
    lang: 'ja-jp'
}

$(document).ready(function(){
    //Check if browser is compatible
    var isAndroid = /android/.test(navigator.userAgent.toLowerCase());
    if(isAndroid || !('getUserMedia' in navigator) || !('webkitSpeechRecognition' in window)){
        ui.showModal('error', 'Support Error', 'Your browser is not supported. Please try again using an up-to-date version of Google Chrome for desktop.');
        return;
    }

    //Set recognition language
    if(!location.hash.length){
        var lang = navigator.language;
        location.hash = '#'+lang;
        speechOptions_.lang = lang;
    } else {
        speechOptions_.lang = location.hash.substr(1);
    }

    init();
    loadHistory();
});

$(window).on('beforeunload',function(){
    destroyPCs();
});

/**
 * Initialize the application
 */
function init(){
    $('#myid').val(myid_);

    speech_ = new Speech();
    $(window).on('hashchange', function(){
        speechOptions_.lang = location.hash.substr(1);
        if(speech_.isRecognizing){
            speech_.recognition.stop();
        }
    })

    if(storage_ == null) storage_ = new Wrapper.storage();
    if(myid_ == null){
        myid_ = generateId();
    }
    if(peer_ == null){
        peer_ = new Peer(myid_,
            {key: APIKEY_, debug: true});
        ui.changeServiceState('online', peer_.id);

        var $remoteAudio_ = $('#remote');

        peer_.on('connection', connectedAnother);
        peer_.on('call', function(call){
            peerCall_ = call;
            call.on('stream', function(stream){
                remoteset_ = true;
                $remoteAudio_.attr('src',URL.createObjectURL(stream));
                $remoteAudio_[0].play();
                enableForm_('disconnect');
            })
            peerid_ = call.peer;
            $('#incomingID').text(peerid_);
            ui.showModal('incoming');
        })

        peer_.on('error', function(err) {
            ui.showModal('error','Error',err.message);
            speech_.abortRecognition();
            reset();
        });

    }
}

/**
 * Removes the "disabled" attribute from a dom element
 * @param {string} id The id of the element to enable
 * @private
 */
var enableForm_ = function(id) {
    $('form').each(function(e){
        $(this).find('button').attr('disabled',
            $(this).attr('id') === id ? false : 'disabled');
    })
};



/**
 * connectedAnother
 * callback function of peerjs datachannel
 * output to the console log the data received
 * @param {object} c The peerjs data connection object
 */
function connectedAnother(c){
    peerConn_ = c;
    peerConn_.on('data', function(data){
        switch (data.type) {
            case 'text':
                binary2str(data,peerTextCallback);
                break;
            case 'edit':
                binary2str(data,editText);
                break;
            case 'start':
                currSessionId_ = data.sessionID;
                var isAtBottom = ui.checkIsAtBottom();
                var $articles = $('#articles');
                var $sessionArticle =
                    $('<article class="session" ' +
                        'data-session="'+currSessionId_+'">' +
                        '</article>');
                $articles.append($sessionArticle);
                if(isAtBottom){
                    ui.scrollToBottom();
                }
                speech_.startRecognition(speechOptions_);
                break;
            case 'reject':
                ui.stopRing('rbt');
                reset();
                init();
                break;
        }
    });
    peerConn_.on('close', function(err){
        console.log(err);
        if(!isDisconnector_){
            reset();
            init();
        }
    });
    peerConn_.on('error', function(err){
        console.log('failed to connect')
    })

    speech_.recognition.onresult = speechRecognitionCallback;

    speech_.recognition.onend = speechEndCallback;
}

/**
 * reset the application to the uninitialized state
 */
function reset(){
    if(speech_ != null){
        speech_.abortRecognition();
    }

    $('#anotherid').val('');
    localset_ = false;
    remoteset_ = false;
    isDisconnector_ = false;
    currSessionId_ = null;
    peerid_ = null;
    isFirstMessage = true;
    $('[contenteditable="true"]').removeAttr('contenteditable').unbind();
    $(window).off('hashchange');

    ui.changePhoneState('disconnected');
    isCaller_ = false;

    ui.stopRing('rbt');
    ui.stopRing('rbt');
}

/**
 * encode string to binary
 * @param {string} str the str is send message
 * @param {function} callback the callback is callback function
 * @private
 */
function str2binary(str, callback){
    var reader = new FileReader();
    reader.onload = function(e){
        callback(reader.result);
    };
    reader.readAsArrayBuffer(new Blob([str]));
}

/**
 * decode string to binary
 * @param {binary} bin the bin is receive message
 * @param {function} callback the callback is callback function
 * @private
 */
function binary2str(message, callback){
    var reader = new FileReader();
    reader.onload = function(e){
        message.transcript = JSON.parse(reader.result);
        callback(message);
    };
    reader.readAsText(new Blob([message.transcript]));
}

/**
 * Set an element to be editable and add callbacks to handle editing
 * @param {JQuery} $element The Jquery object to make editable
 */
function setEditable($element){
    $element.attr('contenteditable','true');
    $element.focus(function(e){
        var origText = $(this).text();
        $(this).data('origtext',origText);
    });
    $element.keypress(function(e){
        if (e.which == 13){
            e.preventDefault();
            $(this).blur();
            return false;
        }
    });
    $element.blur(function(e){
        var $target = $(this);
        var origText = $target.data('origtext');
        var currText = $target.text();
        if(origText != currText){
            $(this).addClass('edited');
            var messageID = $target.data('mytranscript');
            var sessionID = $target.data('session');
            str2binary(JSON.stringify(currText),function(data){
                var message = {
                    type: 'edit',
                    user: myid_,
                    messageID: messageID,
                    transcript: data,
                    sessionID:sessionID
                };
                peerConn_.send(message);
            });
            storage_.update({messageid:messageID,msg:currText});
            console.log('send!')
        }
    });
}

/**
 * Update received text and set to edited
 * @param {Object} message Object containing edit data
 */
function editText(message){
    var $element = $('article[data-peertranscript="'+message.messageID+'"]');
    $element.text(message.transcript);
    $element.addClass('edited');
    storage_.update({messageid:message.messageID,msg:message.transcript});
}

/**
 * Destroy Peer Connections
 */
function destroyPCs(){
    if(peerConn_){
        peerConn_.close();
        peerConn_ = null;
    }
    if(peerCall_){
        peerCall_.close();
        peerCall_ = null;
    }
}

/**
 * Generate a UUID
 * @returns {string} a randomly generated UUID
 */
function generateUUID(){
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
}

/**
 * The callback function for web speech recognition.
 * Adds the result to the page
 * @param {Object} event Object containing result
 */
function speechRecognitionCallback(event){
    var time = (new Date()).getTime();
    var isAtBottom;
    if(isFirstMessage){
        isAtBottom = ui.checkIsAtBottom();
        if($('.message').length > 0){
            $('.session:last').before('<hr>');
        }
        $('.session:last').append('<div class="datetime"><time><span class="glyphicon glyphicon-time"></span>' +new Date(time).toLocaleString()+'</time>' +
        '<address><span class="glyphicon glyphicon-earphone"></span>'+peerid_+'</address></div>');
        isFirstMessage = false;
        if(isAtBottom){
            ui.scrollToBottom();
        }
    }

    for(var i=event.resultIndex; i<event.results.length; i++){
        var result = event.results[i];
        var messageID;
        console.log('result[' + i + '] = ' + result[0].transcript);
        console.log('confidence = ' + result[0].confidence);
        console.log('is Final ? ' + result.isFinal);
        isAtBottom = ui.checkIsAtBottom();

        var $message = $('.currentSpeechSession[data-resultIndex="'+i+'"]');
        var isUpdate = false;
        if($message.length){
            isUpdate = true;
        }
        if(result.isFinal) {
            if(isUpdate){
                messageID = $message.data('mytranscript');
                $message.removeClass('current').text(result[0].transcript);
                time = $message.data('timestamp');
            } else {
                messageID = generateUUID();
                var $finalText =
                    $('<div class="message-wrapper">'+
                        '<article class="my message currentSpeechSession" ' +
                        'data-mytranscript="'+messageID+
                        '" data-session="'+currSessionId_+
                        '" data-timestamp="'+time+'">'+
                        result[0].transcript+
                        '</article>'+
                        '</div>');
                $('.session:last').append($finalText);
            }
            setEditable($message);
            storage_.insert(myid_,peerid_,myid_,
                messageID,currSessionId_,result[0].transcript,time);

        } else {
            if(isUpdate){
                messageID = $message.data('mytranscript');
                $message.text(result[0].transcript);
                time = $message.data('timestamp');
            } else if( $('.my.current').length === 0 ) {
                messageID = generateUUID();
                var $currText =
                    $('<div class="message-wrapper">'+
                        '<article class="my message currentSpeechSession current" ' +
                        'data-mytranscript="'+messageID+
                        '" data-session="'+currSessionId_+
                        '" data-timestamp="'+time+
                        '" data-resultIndex="'+i+'">'+
                        result[0].transcript+
                        '</article>'+
                        '</div>');
                $('.session:last').append($currText);
            }
        }

        if(isAtBottom){
            ui.scrollToBottom();
        }
        // eventを送信するとpeerjsでエラーが発生するため、sendEventへ格納

        str2binary(JSON.stringify(result[0].transcript),function(data){
            var message = {
                type: 'text',
                user: myid_,
                messageID: messageID,
                transcript: data,
                confidence: result[0].confidence,
                isFinal: result.isFinal
            };
            peerConn_.send(message);
        });

    }
}

/**
 * parse binary data to object and show console
 * @param {string} data the data is recieving data
 * @private
 */
function peerTextCallback(message){
    var isAtBottom = ui.checkIsAtBottom();
    var $message = $('[data-peertranscript="'+message.messageID+'"]');
    console.log(message.messageID);
    var isUpdate = false;
    var time = (new Date()).getTime();
    if(isFirstMessage){
        if($('.message').length > 0){
            $('.session:last').before('<hr>');
        }
        $('.session:last').append('<div class="datetime"><time><span class="glyphicon glyphicon-time"></span>' +new Date(time).toLocaleString()+'</time>' +
        '<address><span class="glyphicon glyphicon-earphone"></span>'+peerid_+'</address></div>');
        isFirstMessage = false;
    }
    if($message.length){
        isUpdate = true;
    }
    if(message.isFinal) {
        if(isUpdate){
            $message.removeClass('current').text(message.transcript);
            time = $message.data('timestamp');
        } else {
            $('.session[data-session="'+currSessionId_+'"]').append(
                '<div class="message-wrapper">'+
                    '<article class="your message" ' +
                    'data-peertranscript="'+message.messageID+
                    '" data-timestamp="'+time+
                    '" data-session="'+currSessionId_+'">'+
                    message.transcript+
                    '</article>'+
                    '</div>'
            );
        }
        console.log(message.user + "(final speech) : " + message.transcript);
        storage_.insert(myid_,peerid_,peerid_,message.messageID,
            currSessionId_,message.transcript,time);
    }
    else {
        if(isUpdate){
            $message.text(message.transcript);
            time = $message.data('timestamp');
        } else if ($('.your.current').length === 0 ){
            $('.session[data-session="'+currSessionId_+'"]').append(
                '<div class="message-wrapper">'+
                    '<article class="your message current" ' +
                    'data-peertranscript="'+message.messageID+
                    '" data-timestamp="'+time+
                    '" data-session="'+currSessionId_+'">'+
                    message.transcript+
                    '</article>'+
                    '</div>'
            );
        }
    }
    if(isAtBottom){
        ui.scrollToBottom();
    }

}

/**
 * The callback function for web speech api.
 * If the speech ended due to time out, restart the recognition.
 */
function speechEndCallback(){
    $('.currentSpeechSession').removeClass('currentSpeechSession');
    var now = new Date().getTime();
    if(now-speech_.timer<200){
        alert("Aborting recognition\n" +
            " Only one speech recognition per browser allowed");
        speech_.abortRecognition();
        return;
    }
    speech_.timer = now;
    if(speech_.isRecognizing){
        speech_.startRecognition(speechOptions_);
        speech_.recognition.onresult = speechRecognitionCallback;
        speech_.recognition.onend = speechEndCallback;
    }
}


/**
 * Connect to peer
 */
function connect(peerid){
    isCaller_ = true;
    if(!peerid){
        peerid = $('#peerName').text();
    }
    peerid_ = peerid;
    console.log('myid_ : ' + myid_ +
        '| anotherid : ' + peerid);

    // connect data channel
    var c = peer_.connect(peerid,
        {label:'chat',serialize:'binary',reliable:'true'});
    c.on('open', function(){
        connectedAnother(c);
        navigator.getUserMedia({"video":false,"audio":true},function(stream){
            localset_ = true;
            peerCall_ = peer_.call(peerid,stream);
            peerCall_.on('stream', function(remoteStream){
                ui.stopRing('rbt');
                var $remoteAudio_ = $('#remote');
                remoteset_ = true;
                $remoteAudio_.attr('src', URL.createObjectURL(remoteStream));
                $remoteAudio_[0].play();
                enableForm_('disconnect');
            })
            peerCall_.on('close',function(){
                var $remoteAudio_ = $('#remote');
                $remoteAudio_[0].pause();
                enableForm_('connect');
                if($('.session:last .message').length > 0){
                    var isAtBottom = ui.checkIsAtBottom();
                    $('.session:last').append(
                        '<div class="datetime">' +
                            '<time>'+new Date().toLocaleString()+'</time>' +
                            '</div>');
                    if(isAtBottom){
                        ui.scrollToBottom();
                    }
                }
            })
            ui.changePhoneState('connected');
        }, function(){
            ui.showModal('error', 'userMediaError', "Failed to get user microphone.");
        })
    });
}

/**
 * Disconnect from peer
 */
function disconnect(){
    ui.changePhoneState('disconnected');
    ui.stopRing('rbt');
    isDisconnector_ = true;
    destroyPCs();
    reset();
    init();
}

/**
 * Accept call from peer
 */
function acceptCall(){
    ui.showPage('chat')
    peerid_ = peerCall_.peer;
    navigator.getUserMedia({"video":false,"audio":true}, function(stream){
        peerCall_.answer(stream);
        peerCall_.on('close',function(){
            var $remoteAudio_ = $('#remote');
            $remoteAudio_[0].pause();
            enableForm_('connect');
            if($('.session:last .message').length > 0){
                var isAtBottom = ui.checkIsAtBottom();
                $('.session:last').append(
                    '<div class="datetime">' +
                        '<time>'+new Date().toLocaleString()+'</time>' +
                        '</div>');
                if(isAtBottom){
                    ui.scrollToBottom();
                }
            }
        })
        localset_ = true;


        currSessionId_ = generateUUID();
        var message = {
            type:'start',
            sessionID:currSessionId_
        };
        speech_.startRecognition(speechOptions_);


        var isAtBottom = ui.checkIsAtBottom();
        var $articles = $('#articles');
        peerConn_.send(message);
        var $sessionArticle =
            $('<article class="session" ' +
                'data-session="'+currSessionId_+'">' +
                '</article>');
        $articles.append($sessionArticle);
        if(isAtBottom){
            ui.scrollToBottom();
        }
        ui.changePhoneState('connected');
    }, function(){
        ui.showModal('error', 'Media Error', "Failed to get user microphone.");
    })
}

/**
 * Reject call from peer
 */
function rejectCall(){
    var message = {
        user: myid_,
        type: 'reject'
    };
    reset();
    init();
    peerConn_.send(message);
}

function generateId(){
    return 'xxxxxxxxxxxx'.replace(/[x]/g, function(c) {
        return Math.floor(Math.random()*10);
    });
}

/**
 * Load history into the UI
 * @param peerID the peer whose history to get
 */
function loadHistory(){
    var $articles = $('#articles');
    $articles.html('');
    var messages = storage_.getOrderedValues();
    var $article = $('<article class="session"> ' +
        //            'data-session="'+currSessionId_+'">' +
//        '<div class="datetime"></div>' +
        '</article>');
    $articles.append($article);
//    var isCurrent = false;
    var hasHistory = false;
    var session = null;
    for(var i=0; i<messages.length; i++){
        var msg = JSON.parse(messages[i].value);
        if(session != msg.sessionid){
            if(i>0){
                $articles.append("<hr>");
            }

            $article = $(
                '<article class="session">' +
                    '<div class="datetime">' +
                    '<time><span class="glyphicon glyphicon-time"></span>' +new Date(msg.timestamp).toLocaleString()+'</time>' +
                    '<address><span class="glyphicon glyphicon-earphone"></span>'+msg.anotherid+'</address>'+
                    '</div>' +
                '</article>');
            $articles.append($article);
            session = msg.sessionid;
        }
        var $text =
            $('<div class="message-wrapper">'+
                '<article class="message old" ' +
                'data-mytranscript="'+msg.messageid+
                '" data-session="'+msg.sessionid+'">'+
                msg.msg+
                '</article>'+
                '</div>');
        if(msg.senderid==msg.myid){
            $text.find('.message').addClass('my');
        } else {
            $text.find('.message').addClass('your');
        }
        if(msg.sessionid == currSessionId_){
            $text.find('.message').addClass('currentSpeechSession');
            if(msg.senderid==msg.myid){
                setEditable($text)
            }
        } else {
            hasHistory = true;
        }
        if(msg.isEdited){
            $text.addClass('edited');
        }
        $article.append($text);
    }
    ui.scrollToBottom();
}
