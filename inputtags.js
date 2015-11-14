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

    /**
     * Merge objects
     *
     * @returns {Object} extended object
     * @private
     */
    var _extend = function _extend() {
            if(typeof arguments[0] !== "object")throw new Error("Can`t merge this shit.");

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
         * Plugin inputtags constructor
         *
         * @param {HTMLElement} element  DOM element for extend
         * @param {Object} parameters some parameters
         * @constructor
         */
        Inputtags = function Inputtags(element, parameters){

            if(!(element instanceof HTMLElement))throw new Error("Wrong argument for create inputtag. Provide " + (typeof element) + "(HTMLElement need)");

            this.parameters = parameters;
            this.getRaw = function(){return element;};
            this.initialize();
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
                view = document.createElement('span'),
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
                        throw new Error("Some of item properties is not defined in options (set keyName and valueName).");
                    }

                    break;

                case "object":

                    if(item.keyName?!item.valueName:item.valueName){
                        throw new Error("Some of item properties is not defined (set keyName or valueName).");
                    }

                    name = item[parameters.valueName];

                    break;

                default:
                    throw new Error("Tags type can be only string or object.");
                    break;

            }

            if(
                !parameters.duplicate
                && inputtags.hasVal(item)
            ){
                return;
            }

            text.innerHTML = name;
            remover.innerHTML = "x";

            view.appendChild(text);
            view.appendChild(remover);
            view.setAttribute("class", parameters.getTagClass(_this));
            remover.setAttribute("class", parameters.getTagRemoverClass(_this));

            // Remove tag from dom tree and from tag list
            remover.addEventListener("click", function(){
                parameters.removeTag.call(parameters._inputtags, _this);
            });

            // get tag value
            _this.getVal = function(){
                return item;
            };

            // get tag dom element
            _this.getView = function(){
                return view;
            };

            parameters.addTag.call(parameters._inputtags, _this);
            sourceList.removeAllItems();
        },

        /**
         * Object-cursor for tags
         *
         * @constructor
         */
        Cursor = function Cursor(callback, parameters){
            var _this = this,
                view = document.createElement('input');

            parameters._cursor = _this;
            view.setAttribute("class", parameters.getCursorClass(_this));

            // get cursor value
            _this.getVal = function(){
                return view.value;
            };

            // get cursor dom element
            _this.getView = function(){
                return view;
            };

            // set cursor value
            _this.setVal = function(val){
                return view.value = val;
            };

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
        SourceList = function SourceList(callback, parameters){
            var _this = this,
                cursor = parameters._cursor,
                view = document.createElement('div');

            parameters._sourceList = _this;
            view.setAttribute("class", parameters.getSourceListClass(_this));
            view.setAttribute("style", "display:none;");

            // remove items
            _this.removeAllItems = function(){
                while (view.firstChild) {
                    view.removeChild(view.firstChild);
                }
                view.setAttribute("style", "display:none;");
            };

            // add item to source list
            _this.addItem = function(item){
                var itemView = document.createElement('a'),
                    name = (parameters.valueName?item[parameters.valueName]:item);

                itemView.setAttribute("href", "#");
                itemView.setAttribute("class", parameters.getSourceItemClass(item));
                itemView.innerHTML = name;
                view.appendChild(itemView);
                view.setAttribute("style", "");

                itemView.addEventListener("click", function(e){
                    if(callback.call(parameters._inputtags, item, e)){
                        _this.removeAllItems();
                        cursor.setVal("");
                    }
                });
            };

            // get cursor dom element
            _this.getView = function(){
                return view;
            };


        },

        defaultParameters = {
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

            "addTag":function(tag){
                var params = this.parameters,
                    inputtags = params._inputtags,
                    cursorView = params._cursor.getView(),
                    raw = params._inputtags.getRaw();

                params._tags.push(tag);
                cursorView.parentNode.insertBefore(tag.getView(), cursorView);
                raw.setAttribute("value", JSON.stringify(inputtags.getVal()));
            },

            "removeTag":function(tag){
                var params = this.parameters,
                    inputtags = params._inputtags,
                    sourceList = params._sourceList,
                    tags = params._tags,
                    raw = params._inputtags.getRaw(),
                    i=0, len= tags.length;

                for(; i<len; i++){
                    if(tags[i] === tag)tags.splice(i,1);
                }

                sourceList.removeAllItems();
                tag.getView().parentNode.removeChild(tag.getView());
                raw.setAttribute("value", JSON.stringify(inputtags.getVal()));
            },

            "sourceHandler": function(item){
                var params = this.parameters,
                    inputtags = params._inputtags;

                if(
                    !params.duplicate
                    && inputtags.hasVal(item)
                 ){
                    return false;
                }

                new Tag(item, params);

                return true;

            }

        };


    Inputtags.prototype = {
        "constructor": Inputtags,
        "parameters": null,

        "initialize":function(){

            var _this   = this,
                raw     = _this.getRaw(),
                view    = document.createElement('div'),
                params, cursor, sourceList;

            // Customize parameters
            params = _this.parameters = _extend({"_tags":[]}, defaultParameters, _this.parameters);
            params._inputtags = _this;

            cursor = new Cursor(params.cursorHandler, params);
            sourceList = new SourceList(params.sourceHandler, params);
            view.setAttribute("class", params.getInputtagsClass(_this));
            view.appendChild(cursor.getView());
            view.appendChild(sourceList.getView());
            raw.setAttribute("style", "display:none");
            raw.parentNode.insertBefore(view, raw);


            view.addEventListener("click", function(){
                cursor.getView().focus();
            });

        },

        "getVal":function(){
            var _this = this,
                tags = _this.parameters._tags,
                data = [], i = 0, len = tags.length;

            for(;i<len; i++){
                data.push(tags[i].getVal());
            }

            return data;
        },

        "hasVal":function(item){
            var params = this.parameters,
                tags = params._tags,
                key = params.keyName,
                i= 0, len = tags.length;

            for(; i<len; i++){
                if(key && (tags[i].getVal())[key] === item[key]){
                    return true;
                }else if(tags[i].getVal() === item){
                    return true;
                }

            }

            return false;
        }
    };

    if(!window.vitologi)window.vitologi = {};
    window.vitologi.inputtags = function(elem, parameters){return new Inputtags(elem, parameters);};

})(window);