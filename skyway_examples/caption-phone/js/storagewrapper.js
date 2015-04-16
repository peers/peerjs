/**
 * @fileoverview LocalStorageを利用するためのラッパーライブラリです。
 */

/**
 * define namespace
 */
if(!window.Wrapper) Wrapper = {};

/**
 * define Wrapper.storage
 */
(function(){
    var appIdentifier_ = "sw-cphone_";

    /**
     * Constructor for the Storage class
     * @param {function=} onresult Callback function for speech results
     * @constructor
     */
    function storage(){
    }

    Wrapper.storage = storage;

    /**
     * Public Method
     */
    storage.prototype = {

        /**
         * 発信着信ユーザid、テキストとメタデータを書き込んでユニークIDを返す。
         * @public
         * @param myid {string} My ID
         * @param anotherid {string} Another ID
         * @param senderid {string} Sender ID
         * @param messageid {string} Message ID
         * @param sessionid {string} Session ID
         * @param msg {string} Message body
         * @param timestamp {int} Message timestamp
         * @returns {null}
         */
        insert : function(myid,anotherid,senderid,messageid,sessionid,msg,timestamp){

            if(arguments.length != 7){
                throw "error: arguments incorrect";
            }

            var value_ = {
                myid:myid,
                anotherid:anotherid,
                senderid:senderid,
                messageid:messageid,
                sessionid:sessionid,
                msg:msg,
                timestamp:timestamp
            };
            
            localStorage.setItem(generatekey_(),JSON.stringify(value_));

        },

        /**
         * 該当のメッセージオブジェクトを配列で取得する
         * @public
         * @param keywordobject {object} (myid and anotherid) or messageid
         * @returns msgobject {array} Message Object Array
         */
        select : function(keywordobject){

            if(arguments.length == 0){
                throw "error: arguments empty";
            }

            if(keywordobject.myid == null && keywordobject.anotherid == null && keywordobject.messageid == null){
                throw "error: arguments empty";
            }

            var rows_ = getallvalues_();
            var result_ = [];


            for(var i = 0; i<rows_.length; i++){
                var row_ = rows_[i];
                var key_ = row_.key;
                var value_ = JSON.parse(row_.value);

                if(search_(keywordobject,value_) == 1) result_.push(value_);
            }

            return result_;

        },

        /**
         * 該当のデータを更新する
         * @public
         * @param keywordobject {object} messageid and msg
         * @returns {null}
         */
        update : function(keywordobject){

            if(arguments.length == 0){
                throw "error: arguments empty";
            }

            if(keywordobject.messageid == null){
                throw "error: arguments empty";
            }

            var rows_ = getallvalues_();

            for(var i = 0; i<rows_.length; i++){
                var row_ = rows_[i];
                var key_ = row_.key;
                var value_ = JSON.parse(row_.value);

                if(search_(keywordobject,value_) == 1) {
                    value_.msg = keywordobject.msg;
                    value_.isEdited = true;
                    localStorage.setItem(key_,JSON.stringify(value_));
                    return;
                }

            }

        },

        /**
         * データを削除する（デバッグ用）
         * 現在全てのデータを削除する機能のみ実装
         * @public
         * @returns {null}
         */
        delete : function(){

            for (var key_ in localStorage){
                localstorage.removeItem(key_);
            }

        },

        /**
         * localstorageのデータをタイムスタンプ順で取得
         */
        getOrderedValues : function(){
            var rows = getallvalues_();
            rows.sort(function(a,b){
                return JSON.parse(a.value).timestamp - JSON.parse(b.value).timestamp;
            });
            return rows;
        }

    }

    /**
     * Private Method-----------------
     */

    /**
     * localstorageのkeyを生成する
     * @private
     * @returns key {String}
     */
    function generatekey_(){
        var maxKey = -1;
        var reg = new RegExp('^'+appIdentifier_,'g');

        for (var key_ in localStorage){
            if(key_.match(reg)){
                var index = parseInt(key_.slice(appIdentifier_.length));
                if(index > maxKey){
                    maxKey = index;
                }
            }
        }

        return appIdentifier_+(maxKey+1);

    }

    /**
     * localstorageのデータを全件取得する
     * @private
     * @return allmsg {array}
     */
    function getallvalues_(){

        var allmsg_ = [];
        var cnt_ = 0;
        var reg = new RegExp('^'+appIdentifier_,'g');
        for(var key_ in localStorage){
            if(key_.match(reg)){
                allmsg_[cnt_] = new msg(key_,localStorage.getItem(key_));
                cnt_++;
            }
        }

        return allmsg_;

        function msg(key_,value_){
            this.key = key_;
            this.value = value_;
        }

    }

    /**
     * localstorageのデータを指定の条件で検索する
     * @private
     * @return matchflag {bool} find is true , not find is false
     */
    function search_(keywordobject,valueobject){

        var matchflag = false;

        //myid、anotherid検索
        if(keywordobject.myid != null && keywordobject.anotherid != null){
            if(keywordobject.myid == valueobject.myid && keywordobject.anotherid == valueobject.anotherid){
                matchflag = true;
            }
        }

        //messageid検索
        if(keywordobject.messageid != null){
            if(keywordobject.messageid == valueobject.messageid){
                matchflag = true;
            }else{
                matchflag = false;

            }
        }

        return matchflag;

    }


})()

