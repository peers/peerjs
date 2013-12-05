/**
 * @fileoverview Web Speech APIの動作確認を行うプログラムです。
 * Web Speech APIのパラメーターをGUIで指定できるほか、
 * 変換結果はコンソールログに出力されます。
 */

/**
 * Constructor for the Speech class
 * @param {function=} onresult Callback function for speech results
 * @constructor
 */
function Speech(){
    /**
     * webkitSpeechRecognitionのインスタンスを生成する
     * @type {webkitSpeechRecognition}
     * @private
     */
    this.recognition = new webkitSpeechRecognition();
    this.isRecognizing = false;
    this.timer = 0;
}



/**
 * テキスト変換を開始する関数
 *
 * @param {Object} [options] Speech API options
 */
Speech.prototype.startRecognition = function(options){
    if(options){
        var isContinuous = options.isContinuous?options.isContinuous:true;
        var isInterimResults = options.isInterimResults?options.isInterimResults:true;
        var lang = options.lang?options.lang:'ja-JP';
    } else {
        var isContinuous = true;
        var isInterimResults = true;
        var lang = 'ja-JP';
    }
    
    this.recognition.lang = lang;
    this.recognition.continuous = isContinuous;
    this.recognition.interimResults = isInterimResults;
    this.recognition.start();
    this.isRecognizing = true;
};

/**
 * テキスト変換を停止する関数
 */
Speech.prototype.stopRecognition = function(){
    this.isRecognizing = false;
    this.recognition.stop();
};

/**
 * テキスト変換を終了する関数
 */
Speech.prototype.abortRecognition = function(){
    this.isRecognizing = false;
    if(this.recognition){
        this.recognition.abort();
        this.recognition = null;
    }
};
