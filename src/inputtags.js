/**
 * Plugin for modify standard input form field
 *
 * @company Vitologi systems
 * @author Alexander Morozov
 * @email info@vitologi.com
 * @date 05.11.2015
 */

(function(window){

    "use strict";

    var InputtagsError = function(msg){
        this.msg = msg;
        console.log(this.msg);
    };
    InputtagsError.prototype = new Error();

    /**
     * Merge objects
     *
     * @returns {Object} extended object
     * @private
     */
    var _extend = function _extend() {
            if(typeof arguments[0] !== "object")throw new InputtagsError("Can`t merge this shit.");

            var base = arguments[0],
                i=1, len = arguments.length,
                extender, j;

            for(;i<len;i++){
                extender = (typeof arguments[i] == "object"?arguments[i]:{});

                for(j in extender){
                    if(!extender.hasOwnProperty(j))continue;
                    base[j]=extender[j];
                }

            }

            return base;

        },

        /**
         * Default configuration for extend Inputtags
         *
         * @type {{
         *      _inputtags: null,
         *      _cursor: null,
         *      _sourceList: null,
         *      duplicate: boolean,
         *      keyName: boolean,
         *      valueName: boolean,
         *      getInputtagsClass: Function,
         *      getCursorClass: Function,
         *      getTagClass: Function,
         *      getTagRemoverClass: Function,
         *      getSourceListClass: Function,
         *      getSourceItemClass: Function,
         *      source: Function,
         *      cursorHandler: Function,
         *      addTag: Function,
         *      removeTag: Function,
         *      sourceListHandler: Function
         *      }}
         */
        defaults = {
            "_inputtags":null,
            "_cursor":null,
            "_sourceList":null,
            // "_tags":[] here must be personal tags collection

            "duplicate":false,
            "keyName":false,
            "valueName":false,

            "getInputtagsClass": function(item){return "bInputtags";},
            "getCursorClass": function(item){return "bInputtags__tagCursor";},
            "getTagClass": function(item){return "bInputtags__tag";},
            "getTagRemoverClass": function(item){return "bInputtags__tagRemover";},
            "getSourceListClass": function(item){return "bInputtags__sourceList";},
            "getSourceItemClass": function(item){return "bInputtags__sourceItem";},

            "source":function(item){return [];},
            "onChange":function(){},
            "cursorHandler": function(e){
                var params = this.parameters,
                    cursor = params._cursor,
                    sourceList = params._sourceList,
                    sources, i, len;

                if(({"13":true, "188":true})[e.keyCode]){
                    e.preventDefault();
                    e.stopPropagation();

                    if(cursor.getVal() === "")return false;

                    return new Tag(cursor.getVal(), params);
                }

                if(sources = params.source(cursor.getVal())){
                    sourceList.removeAllItems();

                    for(i=0, len = sources.length; i<len; i++){
                        sourceList.addItem(sources[i]);
                    }

                }

                return false;

            },

            "sourceListHandler": function(item){
                var params = this.parameters,
                    inputtags = params._inputtags;

                if(inputtags.hasVal(item)){
                    return false;
                }

                new Tag(item, params);

                return true;

            },

            "addTag":function(tag){
                var params = this.parameters,
                    cursorView = params._cursor.getView();

                params._tags.push(tag);
                cursorView.parentNode.insertBefore(tag.getView(), cursorView);
            },

            "removeTag":function(tag){
                var params = this.parameters,
                    sourceList = params._sourceList,
                    tags = params._tags,
                    i=0, len= tags.length;

                for(; i<len; i++){
                    if(tags[i] === tag)tags.splice(i,1);
                }

                sourceList.removeAllItems();
                tag.getView().parentNode.removeChild(tag.getView());
            }

        },

        /**
         * Plugin inputtags constructor
         *
         * @param {HTMLElement} element  DOM element for extend
         * @param {Object} parameters some parameters
         * @constructor
         */
        Inputtags = function Inputtags(element, parameters){

            if(!(element instanceof HTMLElement))throw new InputtagsError("Wrong argument for create inputtag. Provide " + (typeof element) + "(HTMLElement need)");

            var _this       = this,
                params      = _this.parameters  = _extend({"_tags": []}, defaults, parameters),
                raw         = _this.raw         = element,
                view        = _this.view        = document.createElement('div'),
                cursor      = new Cursor(params),
                sourceList  = new SourceList(params);

            // storing in params
            params._inputtags = _this;

            // DOM operation
            view.appendChild(cursor.getView());
            view.appendChild(sourceList.getView());
            view.setAttribute("class", params.getInputtagsClass(_this));
            raw.setAttribute("style", "display:none");
            raw.parentNode.insertBefore(view, raw);


            view.addEventListener("click", function(){
                cursor.getView().focus();
            });
        },

        /**
         * Object-tag
         *
         * @constructor
         */
        Tag = function Tag(item, parameters){
            var _this = this,
                inputtags = parameters._inputtags,
                sourceList = parameters._sourceList,
                view = _this.view = document.createElement('span'),
                text = document.createElement('span'),
                remover = document.createElement('span'),
                name, temp;

            // create right item
            switch (typeof item){

                case "string":
                    name = item;
                    if(parameters.keyName && parameters.valueName){
                        temp = {};
                        temp[parameters.keyName] = temp[parameters.valueName] = item;
                        item = temp;
                    }else if(parameters.keyName || parameters.valueName){
                        throw new InputtagsError("Some of item properties is not defined in options (set keyName and valueName).");
                    }
                    break;

                case "object":
                    if(item.keyName?!item.valueName:item.valueName){
                        throw new InputtagsError("Some of item properties is not defined (set keyName or valueName).");
                    }
                    name = item[parameters.valueName];
                    break;

                default:
                    throw new InputtagsError("Tags type can be only string or object.");
                    break;
            }

            // check item
            if(inputtags.hasVal(item)){
                return;
            }

            // save it
            _this.item = item;

            // DOM operation
            text.innerHTML = name;
            remover.innerHTML = "x";
            view.appendChild(text);
            view.appendChild(remover);
            view.setAttribute("class", parameters.getTagClass(_this));
            remover.setAttribute("class", parameters.getTagRemoverClass(_this));

            // Remove tag from dom tree and from tag list
            remover.addEventListener("click", function(){
                parameters.removeTag.call(parameters._inputtags, _this);
                inputtags.synchronize();
            });

            // Add tag
            parameters.addTag.call(parameters._inputtags, _this);
            inputtags.synchronize();
            sourceList.removeAllItems();
        },

        /**
         * Object-cursor for tags
         *
         * @constructor
         */
        Cursor = function Cursor(parameters){
            var _this = this,
                callback = parameters.cursorHandler,
                view = _this.view = document.createElement('input');

            parameters._cursor = _this;
            view.setAttribute("class", parameters.getCursorClass(_this));

            view.addEventListener("keydown", function(e){
                if(callback.call(parameters._inputtags, e)){
                    _this.setVal("");
                }
            });

        },

        /**
         * Source list
         *
         * @constructor
         */
        SourceList = function SourceList(parameters){
            var _this   = this,
                params  = _this.parameters  = parameters,
                view    = _this.view        = document.createElement('div');

            params._sourceList = _this;

            view.setAttribute("class", params.getSourceListClass(_this));
            view.setAttribute("style", "display:none;");

        };


    Inputtags.prototype = {
        "constructor": Inputtags,
        "parameters": null,
        "raw": null,
        "view": null,

        /**
         * Get all tags data
         *
         * @returns {Array}
         */
        "getVal":function(){
            var _this   = this,
                tags    = _this.parameters._tags,
                data = [], i = 0, len = tags.length;

            for(;i<len; i++){
                data.push(tags[i].getVal());
            }

            return data;
        },

        /**
         * Check the existence of the tag/item
         *
         * @param item
         * @returns {boolean}
         */
        "hasVal":function(item){
            var _this   = this,
                params  = _this.parameters,
                tags    = params._tags,
                key     = params.keyName,
                i= 0, len = tags.length;


            if(params.duplicate)return false;

            for(; i<len; i++){
                if(key && (tags[i].getVal())[key] === item[key]){
                    return true;
                }else if(tags[i].getVal() === item){
                    return true;
                }

            }

            return false;
        },

        /**
         * Synchronize object with DOM Element
         */
        "synchronize":function(){
            var _this   = this,
                params  = _this.parameters,
                raw     = _this.raw;

            raw.setAttribute("value", JSON.stringify(_this.getVal()));
            params.onChange.call(_this);

        }

    };

    Tag.prototype = {
        "constructor": Tag,
        "view": null,
        "item": null,

        "getVal":function(){
            return this.item;
        },

        "getView":function(){
            return this.view;
        }

    };

    Cursor.prototype = {
        "constructor": Cursor,
        "view": null,

        // get cursor value
        "getVal":function(){
            return this.view.value;
        },

        // get cursor dom element
        "getView":function(){
            return this.view;
        },

        // set cursor value
        "setVal":function(val){
            return this.view.value = val;
        }

    };

    SourceList.prototype = {
        "constructor": SourceList,
        "parameters": null,
        "view": null,

        // remove items
        "removeAllItems":function(){
            var view = this.getView();

            while (view.firstChild) {
                view.removeChild(view.firstChild);
            }
            view.setAttribute("style", "display:none;");
        },

        // add item to source list
        "addItem":function(item){
            var _this       = this,
                params      = _this.parameters,
                view        = _this.getView(),
                cursor      = params._cursor,
                callback    = params.sourceListHandler,
                itemView    = document.createElement('a'),
                name        = (params.valueName?item[params.valueName]:item);

            itemView.setAttribute("href", "#");
            itemView.setAttribute("class", params.getSourceItemClass(item));
            itemView.innerHTML = name;
            view.appendChild(itemView);
            view.setAttribute("style", "");

            itemView.addEventListener("click", function(e){
                if(callback.call(params._inputtags, item, e)){
                    _this.removeAllItems();
                    cursor.setVal("");
                }
            });
        },

        // get cursor dom element
        "getView":function(){
            return this.view;
        }

    };



    if (!window.vitologi)window.vitologi = {};

    window.vitologi.inputtags = function (elem, parameters) {
        return new Inputtags(elem, parameters);
    };

    // Open prototypes for extending
    window.vitologi.inputtags._classes = {
        "Inputtags": Inputtags,
        "Cursor": Cursor,
        "Tag": Tag,
        "SourceList": SourceList
    };

})(window);