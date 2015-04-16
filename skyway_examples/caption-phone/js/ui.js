/**
 * @fileoverview UIを操作するためのサンプルコードです。
 */

/**
 * UIを操作するメソッドを入れる、名前空間です。
 */
var ui = {
    /**
     * ページを切り替えるメソッドです。
     * @param pageName ページ名を 'list' か 'chat' で指定します。
     */
    showPage: function(pageName) {
        switch (pageName) {
            case 'chat':
                $('html').removeClass('showing-dial-page').addClass('showing-chat-page');
                break;
            case 'dial':
                $('html').removeClass('showing-chat-page').addClass('showing-dial-page');
                break;
        }
    },

    /**
     * モーダルダイアログを表示、非表示にするメソッドです。
     * @param modalName モーダルの種類を 'login' か 'incoming' で指定します。
     * 引数なしで呼び出すとモーダルを非表示にします。
     * @param [title] モーダルのタイトルを指定します。省略可です。
     * @param [message] モーダルに表示するメッセージを指定します。省略可です。
     */
    showModal: function(modalName, title, message) {
        switch (modalName) {

            case 'incoming':
                $('#incomingModal').show();
                ui.playRing('ring');
                // 同一スレッドで実行するとトランジションのアニメーションが描画されないので、
                // 別スレッドで非同期に実行する。
                setTimeout(function(){
                    $('html').removeClass('showing-incoming-modal showing-error-modal').addClass('showing-incoming-modal');
                }, 0);
                break;
            case 'error':
                $('#errorTitle').text(title || 'エラー');
                $('#errorMessage').text(message || 'エラーが発生しました。');
                $('#errorModal').show();
                // 同一スレッドで実行するとトランジションのアニメーションが描画されないので、
                // 別スレッドで非同期に実行する。
                setTimeout(function(){
                    $('html').removeClass('showing-incoming-modal showing-error-modal').addClass('showing-error-modal');
                }, 0);
                break;
            default:
                $('html').removeClass('showing-login-modal showing-incoming-modal');
                // transform: translateZ() だけでモーダルを非表示にすると、<body> に overflow: hidden を
                // 適用しているのにも関わらずスクロールできてしまうという、WebKitのバグが存在することがわかった。
                // バグに対処するため、モーダルが非表示のときは .hide() を使って display: none を設定する。
                // 本来は transitionEnd イベントが発生した時に実行すべきだが、
                // 簡略化して、0.21 sec 後にタイマーで実行する。(0.01 sec はバッファ。)
                setTimeout(function(){
                    $('.modal').hide();
                }, 210);
                break;
        }
    },

    /**
     * チャットページの一番下までスクロールするメソッドです。
     */
    scrollToBottom: function() {
        var $chatContainer = $('#chatContainer');
        var totalHeight = $chatContainer.get(0).scrollHeight;
        var visibleHeight = $chatContainer.get(0).clientHeight;
        $chatContainer.scrollTop(totalHeight - visibleHeight);
    },

    /**
     * 接続状態を変更するメソッドです。
     * @param state 状態を 'online' か 'offline' で指定します。
     */
    changeServiceState: function(state, yourId) {
        switch (state) {
            case 'online':
                $('html').removeClass('offline').addClass('online');
                $('#yourId').val(ui._formatId(yourId));
                break;
            case 'offline':
                $('html').removeClass('online').addClass('offline');
                break;
        }
    },

    /**
     * 通話状態を変更するメソッドです。ボタンの種類などが切り替わります。
     * @param state 状態を 'connected' か 'disconnected' で指定します。
     */
    changePhoneState: function(state) {
        switch (state) {
            case 'connected':
                $('html').removeClass('disconnected').addClass('connected');
                break;
            case 'disconnected':
                $('html').removeClass('connected').addClass('disconnected');
                break;
        }
    },

    /**
     * IDの表示形式を、4桁ごとにスペースを入た、0000 0000 0000形式に整形します。
     * @returns {Number}
     */
    _formatId: function (id) {
        id = id
            .replace(/[^0-9]/g, '')
            .slice(0, 12)
            .replace(/([0-9]{4})/g, '$1 ')
            .trim();
        return id;
    },
    /**
     * チャットページの一番下までスクロールしているかチェックするメソッドです。
     * @returns {boolean}
     */
    checkIsAtBottom: function(){
        var $chat = $('#chatContainer');
        return $chat[0].scrollHeight - $chat.scrollTop() == $chat.outerHeight();
    },
    /**
     * 発信音・着信音を再生する
     * @param {String} toneName 'rbt'か'ring'
     */
    playRing: function(toneName){
        var $audio;
        switch (toneName) {
            case 'rbt':
                $audio = $('#rbt');
                break;
            case 'ring':
                $audio = $('#ring');
                break;
            default:
                return;
        }
        $audio[0].play();
    },
    /**
     * 発信音・着信音を停止する
     * @param {String} toneName 'rbt'か'ring'
     */
    stopRing: function(toneName){
        var $audio;
        switch (toneName) {
            case 'rbt':
                $audio = $('#rbt');
                break;
            case 'ring':
                $audio = $('#ring');
                break;
            default:
                return;
        }
        $audio[0].pause();
        $audio[0].currentTime = 0;
    }
};

/**
 * 初期化処理の関数です。<body> の最後で実行するのですべての DOM にアクセスできるはず。
 * DOM が見つからないというエラーが発生する時は、$(document).on('ready', function() {...}) に書き換えること。
 */
(function() {
    $(window).on('load', function() {
        ui.scrollToBottom();
    });

    // click イベントは、タッチデバイスで使用すると hold 等の判定のため 0.3 sec の遅延が入り、体感速度が低下する。
    // touchstart や touchend で代用すると体感速度が向上したが、スクロール時にタップを認識するなどの誤判定が発生した。
    // hammer.js ライブラリを導入し、tap イベントを使うことにした。

    $('button')
        .hammer({drag: false, hold: false, prevent_default: false, swipe: false, touch: false, transform: false})
        .on('tap', function(event) {
            var id = $(this).attr('id');
            var $anotherId = $('#anotherId');

            switch (id) {
                case 'backSpaceButton':
                    var id = $anotherId.val();
                    id = ui._formatId(id.slice(0, -1));
                    $anotherId.val(id);
                    break;
                case 'clearButton':
                    $anotherId.val('');
                    break;
                case 'callButton':
                    var id = $anotherId.val().replace(/\s/g, '');
                    ui.playRing('rbt');
                    connect(id);
                    ui.showPage('chat');
                    ui.scrollToBottom();
                    ui.changePhoneState('connected');
                    break;
                case 'disconnectButton':
                    disconnect();
                    break;
                case 'closeButton':
                    ui.showModal('');
                    break;
                case 'acceptButton':
                    ui.stopRing('ring');
                    acceptCall();
                    ui.showModal('');
                    break;
                case 'rejectButton':
                    ui.stopRing('ring');
                    rejectCall();
                    ui.showModal('');
                    break;
                default:
                    if ($(this).hasClass('dial-button')) {
                        ui.showPage('dial');
                        return;
                    }
                    if ($(this).hasClass('back-button')) {
                        ui.showPage('chat');
                        ui.scrollToBottom();
                        return;
                    }
                    if ($(this).hasClass('number-button')) {
                        var number = $(this).text();
                        $anotherId.val(ui._formatId($anotherId.val() + number));
                        return;
                    }
                    break;
            }
        });
    $('#yourId').on('click',function(){
        this.select();
    });
    $('#anotherId').on('change', function() {
        var $anotherId = $('#anotherId');
        $anotherId.val(ui._formatId($anotherId.val()));
    });

    // body { overflow: hidden } を設定しているにもかかわらず、Chromeでスクロールできてしまう不具合に対処
    $(window)
        .on('scroll', function() {
            $(this).scrollTop(0).scrollLeft(0);
        });
})();