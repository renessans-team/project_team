// Copyright 2022 The Chromium Authors
    // Use of this source code is governed by a BSD-style license that can be
    // found in the LICENSE file.
    /**
    * Verify |value| is truthy.
    * @param value A value to check for truthiness. Note that this
    *     may be used to test whether |value| is defined or not, and we don't want
    *     to force a cast to boolean.
    */
    function assert(value, message) {
        if (value) {
        return;
    }
        throw new Error('Assertion failed' + (message ? `: ${message}` : ''));
    }

    // Copyright 2022 The Chromium Authors
    // Use of this source code is governed by a BSD-style license that can be
    // found in the LICENSE file.
    /**
    * @fileoverview This file defines a singleton which provides access to all data
    * that is available as soon as the page's resources are loaded (before DOM
    * content has finished loading). This data includes both localized strings and
    * any data that is important to have ready from a very early stage (e.g. things
    * that must be displayed right away).
    *
    * Note that loadTimeData is not guaranteed to be consistent between page
    * refreshes (https://crbug.com/740629) and should not contain values that might
    * change if the page is re-opened later.
    */
    class LoadTimeData {
        data_ = null;
        /**
         * Sets the backing object.
         *
         * Note that there is no getter for |data_| to discourage abuse of the form:
         *
         *     var value = loadTimeData.data()['key'];
         */
        set data(value) {
        assert(!this.data_, 'Re-setting data.');
        this.data_ = value;
    }
        /**
         * @param id An ID of a value that might exist.
         * @return True if |id| is a key in the dictionary.
         */
        valueExists(id) {
        assert(this.data_, 'No data. Did you remember to include strings.js?');
        return id in this.data_;
    }
        /**
         * Fetches a value, expecting that it exists.
         * @param id The key that identifies the desired value.
         * @return The corresponding value.
         */
        getValue(id) {
        assert(this.data_, 'No data. Did you remember to include strings.js?');
        const value = this.data_[id];
        assert(typeof value !== 'undefined', 'Could not find value for ' + id);
        return value;
    }
        /**
         * As above, but also makes sure that the value is a string.
         * @param id The key that identifies the desired string.
         * @return The corresponding string value.
         */
        getString(id) {
        const value = this.getValue(id);
        assert(typeof value === 'string', `[${value}] (${id}) is not a string`);
        return value;
    }
        /**
         * Returns a formatted localized string where $1 to $9 are replaced by the
         * second to the tenth argument.
         * @param id The ID of the string we want.
         * @param args The extra values to include in the formatted output.
         * @return The formatted string.
         */
        getStringF(id, ...args) {
        const value = this.getString(id);
        if (!value) {
        return '';
    }
        return this.substituteString(value, ...args);
    }
        /**
         * Returns a formatted localized string where $1 to $9 are replaced by the
         * second to the tenth argument. Any standalone $ signs must be escaped as
         * $$.
         * @param label The label to substitute through. This is not an resource ID.
         * @param args The extra values to include in the formatted output.
         * @return The formatted string.
         */
        substituteString(label, ...args) {
        return label.replace(/\$(.|$|\n)/g, function (m) {
        assert(m.match(/\$[$1-9]/), 'Unescaped $ found in localized string.');
        if (m === '$$') {
        return '$';
    }
        const substitute = args[Number(m[1]) - 1];
        if (substitute === undefined || substitute === null) {
        // Not all callers actually provide values for all substitutes. Return
        // an empty value for this case.
        return '';
    }
        return substitute.toString();
    });
    }
        /**
         * Returns a formatted string where $1 to $9 are replaced by the second to
         * tenth argument, split apart into a list of pieces describing how the
         * substitution was performed. Any standalone $ signs must be escaped as $$.
         * @param label A localized string to substitute through.
         *     This is not an resource ID.
         * @param args The extra values to include in the formatted output.
         * @return The formatted string pieces.
         */
        getSubstitutedStringPieces(label, ...args) {
        // Split the string by separately matching all occurrences of $1-9 and of
        // non $1-9 pieces.
        const pieces = (label.match(/(\$[1-9])|(([^$]|\$([^1-9]|$))+)/g) ||
        []).map(function (p) {
        // Pieces that are not $1-9 should be returned after replacing $$
        // with $.
        if (!p.match(/^\$[1-9]$/)) {
        assert((p.match(/\$/g) || []).length % 2 === 0, 'Unescaped $ found in localized string.');
        return { value: p.replace(/\$\$/g, '$'), arg: null };
    }
        // Otherwise, return the substitution value.
        const substitute = args[Number(p[1]) - 1];
        if (substitute === undefined || substitute === null) {
        // Not all callers actually provide values for all substitutes. Return
        // an empty value for this case.
        return { value: '', arg: p };
    }
        return { value: substitute.toString(), arg: p };
    });
        return pieces;
    }
        /**
         * As above, but also makes sure that the value is a boolean.
         * @param id The key that identifies the desired boolean.
         * @return The corresponding boolean value.
         */
        getBoolean(id) {
        const value = this.getValue(id);
        assert(typeof value === 'boolean', `[${value}] (${id}) is not a boolean`);
        return value;
    }
        /**
         * As above, but also makes sure that the value is an integer.
         * @param id The key that identifies the desired number.
         * @return The corresponding number value.
         */
        getInteger(id) {
        const value = this.getValue(id);
        assert(typeof value === 'number', `[${value}] (${id}) is not a number`);
        assert(value === Math.floor(value), 'Number isn\'t integer: ' + value);
        return value;
    }
        /**
         * Override values in loadTimeData with the values found in |replacements|.
         * @param replacements The dictionary object of keys to replace.
         */
        overrideValues(replacements) {
        assert(typeof replacements === 'object', 'Replacements must be a dictionary object.');
        assert(this.data_, 'Data must exist before being overridden');
        for (const key in replacements) {
        this.data_[key] = replacements[key];
    }
    }
        /**
         * Reset loadTimeData's data. Should only be used in tests.
         * @param newData The data to restore to, when null restores to unset state.
         */
        resetForTesting(newData = null) {
        this.data_ = newData;
    }
        /**
         * @return Whether loadTimeData.data has been set.
         */
        isInitialized() {
        return this.data_ !== null;
    }
    }
    const loadTimeData = new LoadTimeData();

    // Copyright 2022 The Chromium Authors
    // Use of this source code is governed by a BSD-style license that can be
    // found in the LICENSE file.
    /**
    * Alias for document.getElementById. Found elements must be HTMLElements.
    */
    function getRequiredElement(id) {
        const el = document.querySelector(`#${id}`);
        assert(el);
        assert(el instanceof HTMLElement);
        return el;
    }

    /**
    * @license
    * Copyright 2019 Google LLC
    * SPDX-License-Identifier: BSD-3-Clause
    */
    const t$3=globalThis,e$3=t$3.ShadowRoot&&(void 0===t$3.ShadyCSS||t$3.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,s$3=Symbol(),o$3=new WeakMap;let n$3=class n{constructor(t,e,o){if(this._$cssResult$=!0,o!==s$3)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e;}get styleSheet(){let t=this.o;const s=this.t;if(e$3&&void 0===t){const e=void 0!==s&&1===s.length;e&&(t=o$3.get(s)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),e&&o$3.set(s,t));}return t}toString(){return this.cssText}};const r$4=t=>new n$3("string"==typeof t?t:t+"",void 0,s$3),S$1=(s,o)=>{if(e$3)s.adoptedStyleSheets=o.map((t=>t instanceof CSSStyleSheet?t:t.styleSheet));else for(const e of o){const o=document.createElement("style"),n=t$3.litNonce;void 0!==n&&o.setAttribute("nonce",n),o.textContent=e.cssText,s.appendChild(o);}},c$3=e$3?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const s of t.cssRules)e+=s.cssText;return r$4(e)})(t):t
    /**
    * @license
    * Copyright 2017 Google LLC
    * SPDX-License-Identifier: BSD-3-Clause
    */;const{is:i$2,defineProperty:e$2,getOwnPropertyDescriptor:r$3,getOwnPropertyNames:h$2,getOwnPropertySymbols:o$2,getPrototypeOf:n$2}=Object,a$1=globalThis,c$2=a$1.trustedTypes,l$1=c$2?c$2.emptyScript:"",p$1=a$1.reactiveElementPolyfillSupport,d$1=(t,s)=>t,u$1={toAttribute(t,s){switch(s){case Boolean:t=t?l$1:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t);}return t},fromAttribute(t,s){let i=t;switch(s){case Boolean:i=null!==t;break;case Number:i=null===t?null:Number(t);break;case Object:case Array:try{i=JSON.parse(t);}catch(t){i=null;}}return i}},f$3=(t,s)=>!i$2(t,s),y$1={attribute:!0,type:String,converter:u$1,reflect:!1,hasChanged:f$3};Symbol.metadata??=Symbol("metadata"),a$1.litPropertyMetadata??=new WeakMap;class b extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t);}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,s=y$1){if(s.state&&(s.attribute=!1),this._$Ei(),this.elementProperties.set(t,s),!s.noAccessor){const i=Symbol(),r=this.getPropertyDescriptor(t,i,s);void 0!==r&&e$2(this.prototype,t,r);}}static getPropertyDescriptor(t,s,i){const{get:e,set:h}=r$3(this.prototype,t)??{get(){return this[s]},set(t){this[s]=t;}};return {get(){return e?.call(this)},set(s){const r=e?.call(this);h.call(this,s),this.requestUpdate(t,r,i);},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??y$1}static _$Ei(){if(this.hasOwnProperty(d$1("elementProperties")))return;const t=n$2(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties);}static finalize(){if(this.hasOwnProperty(d$1("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(d$1("properties"))){const t=this.properties,s=[...h$2(t),...o$2(t)];for(const i of s)this.createProperty(i,t[i]);}const t=this[Symbol.metadata];if(null!==t){const s=litPropertyMetadata.get(t);if(void 0!==s)for(const[t,i]of s)this.elementProperties.set(t,i);}this._$Eh=new Map;for(const[t,s]of this.elementProperties){const i=this._$Eu(t,s);void 0!==i&&this._$Eh.set(i,t);}this.elementStyles=this.finalizeStyles(this.styles);}static finalizeStyles(s){const i=[];if(Array.isArray(s)){const e=new Set(s.flat(1/0).reverse());for(const s of e)i.unshift(c$3(s));}else void 0!==s&&i.push(c$3(s));return i}static _$Eu(t,s){const i=s.attribute;return !1===i?void 0:"string"==typeof i?i:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev();}_$Ev(){this._$Eg=new Promise((t=>this.enableUpdating=t)),this._$AL=new Map,this._$ES(),this.requestUpdate(),this.constructor.l?.forEach((t=>t(this)));}addController(t){(this._$E_??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.();}removeController(t){this._$E_?.delete(t);}_$ES(){const t=new Map,s=this.constructor.elementProperties;for(const i of s.keys())this.hasOwnProperty(i)&&(t.set(i,this[i]),delete this[i]);t.size>0&&(this._$Ep=t);}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return S$1(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$E_?.forEach((t=>t.hostConnected?.()));}enableUpdating(t){}disconnectedCallback(){this._$E_?.forEach((t=>t.hostDisconnected?.()));}attributeChangedCallback(t,s,i){this._$AK(t,i);}_$EO(t,s){const i=this.constructor.elementProperties.get(t),e=this.constructor._$Eu(t,i);if(void 0!==e&&!0===i.reflect){const r=(void 0!==i.converter?.toAttribute?i.converter:u$1).toAttribute(s,i.type);this._$Em=t,null==r?this.removeAttribute(e):this.setAttribute(e,r),this._$Em=null;}}_$AK(t,s){const i=this.constructor,e=i._$Eh.get(t);if(void 0!==e&&this._$Em!==e){const t=i.getPropertyOptions(e),r="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:u$1;this._$Em=e,this[e]=r.fromAttribute(s,t.type),this._$Em=null;}}requestUpdate(t,s,i,e=!1,r){if(void 0!==t){if(i??=this.constructor.getPropertyOptions(t),!(i.hasChanged??f$3)(e?r:this[t],s))return;this.C(t,s,i);}!1===this.isUpdatePending&&(this._$Eg=this._$EP());}C(t,s,i){this._$AL.has(t)||this._$AL.set(t,s),!0===i.reflect&&this._$Em!==t&&(this._$Ej??=new Set).add(t);}async _$EP(){this.isUpdatePending=!0;try{await this._$Eg;}catch(t){Promise.reject(t);}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,s]of this._$Ep)this[t]=s;this._$Ep=void 0;}const t=this.constructor.elementProperties;if(t.size>0)for(const[s,i]of t)!0!==i.wrapped||this._$AL.has(s)||void 0===this[s]||this.C(s,this[s],i);}let t=!1;const s=this._$AL;try{t=this.shouldUpdate(s),t?(this.willUpdate(s),this._$E_?.forEach((t=>t.hostUpdate?.())),this.update(s)):this._$ET();}catch(s){throw t=!1,this._$ET(),s}t&&this._$AE(s);}willUpdate(t){}_$AE(t){this._$E_?.forEach((t=>t.hostUpdated?.())),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t);}_$ET(){this._$AL=new Map,this.isUpdatePending=!1;}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$Eg}shouldUpdate(t){return !0}update(t){this._$Ej&&=this._$Ej.forEach((t=>this._$EO(t,this[t]))),this._$ET();}updated(t){}firstUpdated(t){}}b.elementStyles=[],b.shadowRootOptions={mode:"open"},b[d$1("elementProperties")]=new Map,b[d$1("finalized")]=new Map,p$1?.({ReactiveElement:b}),(a$1.reactiveElementVersions??=[]).push("2.0.2");
    /**
    * @license
    * Copyright 2017 Google LLC
    * SPDX-License-Identifier: BSD-3-Clause
    */const t$2=globalThis,i$1=t$2.trustedTypes,s$2=i$1?i$1.createPolicy("lit-html-desktop",{createHTML:t=>t}):void 0,e$1="$lit$",h$1=`lit$${(Math.random()+"").slice(9)}$`,o$1="?"+h$1,n$1=`<${o$1}>`,r$2=document,l=()=>r$2.createComment(""),c$1=t=>null===t||"object"!=typeof t&&"function"!=typeof t,a=Array.isArray,u=t=>a(t)||"function"==typeof t?.[Symbol.iterator],d="[ \t\n\f\r]",f$2=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,v=/-->/g,_=/>/g,m=RegExp(`>|${d}(?:([^\\s"'>=/]+)(${d}*=${d}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),p=/'/g,g=/"/g,$=/^(?:script|style|textarea|title)$/i,y=t=>(i,...s)=>({_$litType$:t,strings:i,values:s}),x=y(1),w=Symbol.for("lit-noChange"),T=Symbol.for("lit-nothing"),A=new WeakMap,E=r$2.createTreeWalker(r$2,129);function C(t,i){if(!Array.isArray(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==s$2?s$2.createHTML(i):i}const P=(t,i)=>{const s=t.length-1,o=[];let r,l=2===i?"<svg>":"",c=f$2;for(let i=0;i<s;i++){const s=t[i];let a,u,d=-1,y=0;for(;y<s.length&&(c.lastIndex=y,u=c.exec(s),null!==u);)y=c.lastIndex,c===f$2?"!--"===u[1]?c=v:void 0!==u[1]?c=_:void 0!==u[2]?($.test(u[2])&&(r=RegExp("</"+u[2],"g")),c=m):void 0!==u[3]&&(c=m):c===m?">"===u[0]?(c=r??f$2,d=-1):void 0===u[1]?d=-2:(d=c.lastIndex-u[2].length,a=u[1],c=void 0===u[3]?m:'"'===u[3]?g:p):c===g||c===p?c=m:c===v||c===_?c=f$2:(c=m,r=void 0);const x=c===m&&t[i+1].startsWith("/>")?" ":"";l+=c===f$2?s+n$1:d>=0?(o.push(a),s.slice(0,d)+e$1+s.slice(d)+h$1+x):s+h$1+(-2===d?i:x);}return [C(t,l+(t[s]||"<?>")+(2===i?"</svg>":"")),o]};class V{constructor({strings:t,_$litType$:s},n){let r;this.parts=[];let c=0,a=0;const u=t.length-1,d=this.parts,[f,v]=P(t,s);if(this.el=V.createElement(f,n),E.currentNode=this.el.content,2===s){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes);}for(;null!==(r=E.nextNode())&&d.length<u;){if(1===r.nodeType){if(r.hasAttributes())for(const t of r.getAttributeNames())if(t.endsWith(e$1)){const i=v[a++],s=r.getAttribute(t).split(h$1),e=/([.?@])?(.*)/.exec(i);d.push({type:1,index:c,name:e[2],strings:s,ctor:"."===e[1]?k:"?"===e[1]?H:"@"===e[1]?I:R}),r.removeAttribute(t);}else t.startsWith(h$1)&&(d.push({type:6,index:c}),r.removeAttribute(t));if($.test(r.tagName)){const t=r.textContent.split(h$1),s=t.length-1;if(s>0){r.textContent=i$1?i$1.emptyScript:"";for(let i=0;i<s;i++)r.append(t[i],l()),E.nextNode(),d.push({type:2,index:++c});r.append(t[s],l());}}}else if(8===r.nodeType)if(r.data===o$1)d.push({type:2,index:c});else {let t=-1;for(;-1!==(t=r.data.indexOf(h$1,t+1));)d.push({type:7,index:c}),t+=h$1.length-1;}c++;}}static createElement(t,i){const s=r$2.createElement("template");return s.innerHTML=t,s}}function N(t,i,s=t,e){if(i===w)return i;let h=void 0!==e?s._$Co?.[e]:s._$Cl;const o=c$1(i)?void 0:i._$litDirective$;return h?.constructor!==o&&(h?._$AO?.(!1),void 0===o?h=void 0:(h=new o(t),h._$AT(t,s,e)),void 0!==e?(s._$Co??=[])[e]=h:s._$Cl=h),void 0!==h&&(i=N(t,h._$AS(t,i.values),h,e)),i}class S{constructor(t,i){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=i;}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:i},parts:s}=this._$AD,e=(t?.creationScope??r$2).importNode(i,!0);E.currentNode=e;let h=E.nextNode(),o=0,n=0,l=s[0];for(;void 0!==l;){if(o===l.index){let i;2===l.type?i=new M(h,h.nextSibling,this,t):1===l.type?i=new l.ctor(h,l.name,l.strings,this,t):6===l.type&&(i=new L(h,this,t)),this._$AV.push(i),l=s[++n];}o!==l?.index&&(h=E.nextNode(),o++);}return E.currentNode=r$2,e}p(t){let i=0;for(const s of this._$AV)void 0!==s&&(void 0!==s.strings?(s._$AI(t,s,i),i+=s.strings.length-2):s._$AI(t[i])),i++;}}class M{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,i,s,e){this.type=2,this._$AH=T,this._$AN=void 0,this._$AA=t,this._$AB=i,this._$AM=s,this.options=e,this._$Cv=e?.isConnected??!0;}get parentNode(){let t=this._$AA.parentNode;const i=this._$AM;return void 0!==i&&11===t?.nodeType&&(t=i.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,i=this){t=N(this,t,i),c$1(t)?t===T||null==t||""===t?(this._$AH!==T&&this._$AR(),this._$AH=T):t!==this._$AH&&t!==w&&this._(t):void 0!==t._$litType$?this.g(t):void 0!==t.nodeType?this.$(t):u(t)?this.T(t):this._(t);}k(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}$(t){this._$AH!==t&&(this._$AR(),this._$AH=this.k(t));}_(t){this._$AH!==T&&c$1(this._$AH)?this._$AA.nextSibling.data=t:this.$(r$2.createTextNode(t)),this._$AH=t;}g(t){const{values:i,_$litType$:s}=t,e="number"==typeof s?this._$AC(t):(void 0===s.el&&(s.el=V.createElement(C(s.h,s.h[0]),this.options)),s);if(this._$AH?._$AD===e)this._$AH.p(i);else {const t=new S(e,this),s=t.u(this.options);t.p(i),this.$(s),this._$AH=t;}}_$AC(t){let i=A.get(t.strings);return void 0===i&&A.set(t.strings,i=new V(t)),i}T(t){a(this._$AH)||(this._$AH=[],this._$AR());const i=this._$AH;let s,e=0;for(const h of t)e===i.length?i.push(s=new M(this.k(l()),this.k(l()),this,this.options)):s=i[e],s._$AI(h),e++;e<i.length&&(this._$AR(s&&s._$AB.nextSibling,e),i.length=e);}_$AR(t=this._$AA.nextSibling,i){for(this._$AP?.(!1,!0,i);t&&t!==this._$AB;){const i=t.nextSibling;t.remove(),t=i;}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t));}}class R{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,i,s,e,h){this.type=1,this._$AH=T,this._$AN=void 0,this.element=t,this.name=i,this._$AM=e,this.options=h,s.length>2||""!==s[0]||""!==s[1]?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=T;}_$AI(t,i=this,s,e){const h=this.strings;let o=!1;if(void 0===h)t=N(this,t,i,0),o=!c$1(t)||t!==this._$AH&&t!==w,o&&(this._$AH=t);else {const e=t;let n,r;for(t=h[0],n=0;n<h.length-1;n++)r=N(this,e[s+n],i,n),r===w&&(r=this._$AH[n]),o||=!c$1(r)||r!==this._$AH[n],r===T?t=T:t!==T&&(t+=(r??"")+h[n+1]),this._$AH[n]=r;}o&&!e&&this.O(t);}O(t){t===T?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"");}}class k extends R{constructor(){super(...arguments),this.type=3;}O(t){this.element[this.name]=t===T?void 0:t;}}class H extends R{constructor(){super(...arguments),this.type=4;}O(t){this.element.toggleAttribute(this.name,!!t&&t!==T);}}class I extends R{constructor(t,i,s,e,h){super(t,i,s,e,h),this.type=5;}_$AI(t,i=this){if((t=N(this,t,i,0)??T)===w)return;const s=this._$AH,e=t===T&&s!==T||t.capture!==s.capture||t.once!==s.once||t.passive!==s.passive,h=t!==T&&(s===T||e);e&&this.element.removeEventListener(this.name,this,s),h&&this.element.addEventListener(this.name,this,t),this._$AH=t;}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t);}}class L{constructor(t,i,s){this.element=t,this.type=6,this._$AN=void 0,this._$AM=i,this.options=s;}get _$AU(){return this._$AM._$AU}_$AI(t){N(this,t);}}const Z=t$2.litHtmlPolyfillSupport;Z?.(V,M),(t$2.litHtmlVersions??=[]).push("3.1.0");const j=(t,i,s)=>{const e=s?.renderBefore??i;let h=e._$litPart$;if(void 0===h){const t=s?.renderBefore??null;e._$litPart$=h=new M(i.insertBefore(l(),t),t,void 0,s??{});}return h._$AI(t),h
        /**
         * @license
         * Copyright 2017 Google LLC
         * SPDX-License-Identifier: BSD-3-Clause
         */};let s$1=class s extends b{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0;}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const i=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=j(i,this.renderRoot,this.renderOptions);}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0);}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1);}render(){return w}};s$1._$litElement$=!0,s$1["finalized"]=!0,globalThis.litElementHydrateSupport?.({LitElement:s$1});const r$1=globalThis.litElementPolyfillSupport;r$1?.({LitElement:s$1});(globalThis.litElementVersions??=[]).push("4.0.2");

        // Copyright 2023 The Chromium Authors
        // Use of this source code is governed by a BSD-style license that can be
        // found in the LICENSE file.
        const HIDDEN_CLASS = 'hidden';

        // Copyright 2024 The Chromium Authors
        // Use of this source code is governed by a BSD-style license that can be
        // found in the LICENSE file.
        const IS_IOS = /CriOS/.test(window.navigator.userAgent);
        const IS_HIDPI = window.devicePixelRatio > 1;
        const IS_MOBILE = /Android/.test(window.navigator.userAgent) || IS_IOS;
        const IS_RTL = document.documentElement.dir === 'rtl';
        /**
        * Frames per second.
        * @const
        */
        const FPS = 60;

        // Copyright 2024 The Chromium Authors
        // Use of this source code is governed by a BSD-style license that can be
        // found in the LICENSE file.
        /**
        * Get random number.
        * @param {number} min
        * @param {number} max
        */
        function getRandomNum(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }
        /**
        * Return the current timestamp.
        * @return {number}
        */
        function getTimeStamp() {
            return IS_IOS ? new Date().getTime() : performance.now();
        }

        // Copyright 2024 The Chromium Authors
        // Use of this source code is governed by a BSD-style license that can be
        // found in the LICENSE file.
        class DistanceMeter {
            /**
             * Handles displaying the distance meter.
             * @param {!HTMLCanvasElement} canvas
             * @param {Object} spritePos Image position in sprite.
             * @param {number} canvasWidth
             */
            constructor(canvas, spritePos, canvasWidth) {
            this.canvas = canvas;
            this.canvasCtx =
            /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
            this.image = Runner.imageSprite;
            this.spritePos = spritePos;
            this.x = 0;
            this.y = 5;
            this.currentDistance = 0;
            this.maxScore = 0;
            this.highScore = '0';
            this.container = null;
            this.digits = [];
            this.achievement = false;
            this.defaultString = '';
            this.flashTimer = 0;
            this.flashIterations = 0;
            this.invertTrigger = false;
            this.flashingRafId = null;
            this.highScoreBounds = {};
            this.highScoreFlashing = false;
            this.config = DistanceMeter.config;
            this.maxScoreUnits = this.config.MAX_DISTANCE_UNITS;
            this.canvasWidth = canvasWidth;
            this.init(canvasWidth);
        }
            /**
             * Initialise the distance meter to '00000'.
             * @param {number} width Canvas width in px.
             */
            init(width) {
            let maxDistanceStr = '';
            this.calcXPos(width);
            this.maxScore = this.maxScoreUnits;
            for (let i = 0; i < this.maxScoreUnits; i++) {
            this.draw(i, 0);
            this.defaultString += '0';
            maxDistanceStr += '9';
        }
            this.maxScore = parseInt(maxDistanceStr, 10);
        }
            /**
             * Calculate the xPos in the canvas.
             * @param {number} canvasWidth
             */
            calcXPos(canvasWidth) {
            this.x = canvasWidth -
            (DistanceMeter.dimensions.DEST_WIDTH * (this.maxScoreUnits + 1));
        }
            /**
             * Draw a digit to canvas.
             * @param {number} digitPos Position of the digit.
             * @param {number} value Digit value 0-9.
             * @param {boolean=} opt_highScore Whether drawing the high score.
             */
            draw(digitPos, value, opt_highScore) {
            let sourceWidth = DistanceMeter.dimensions.WIDTH;
            let sourceHeight = DistanceMeter.dimensions.HEIGHT;
            let sourceX = DistanceMeter.dimensions.WIDTH * value;
            let sourceY = 0;
            const targetX = digitPos * DistanceMeter.dimensions.DEST_WIDTH;
            const targetY = this.y;
            const targetWidth = DistanceMeter.dimensions.WIDTH;
            const targetHeight = DistanceMeter.dimensions.HEIGHT;
            // For high DPI we 2x source values.
            if (IS_HIDPI) {
            sourceWidth *= 2;
            sourceHeight *= 2;
            sourceX *= 2;
        }
            sourceX += this.spritePos.x;
            sourceY += this.spritePos.y;
            this.canvasCtx.save();
            if (IS_RTL) {
            if (opt_highScore) {
            this.canvasCtx.translate(this.canvasWidth -
            (DistanceMeter.dimensions.WIDTH * (this.maxScoreUnits + 3)), this.y);
        }
            else {
            this.canvasCtx.translate(this.canvasWidth - DistanceMeter.dimensions.WIDTH, this.y);
        }
            this.canvasCtx.scale(-1, 1);
        }
            else {
            const highScoreX = this.x - (this.maxScoreUnits * 2) * DistanceMeter.dimensions.WIDTH;
            if (opt_highScore) {
            this.canvasCtx.translate(highScoreX, this.y);
        }
            else {
            this.canvasCtx.translate(this.x, this.y);
        }
        }
            this.canvasCtx.drawImage(this.image, sourceX, sourceY, sourceWidth, sourceHeight, targetX, targetY, targetWidth, targetHeight);
            this.canvasCtx.restore();
        }
            /**
             * Covert pixel distance to a 'real' distance.
             * @param {number} distance Pixel distance ran.
             * @return {number} The 'real' distance ran.
             */
            getActualDistance(distance) {
            return distance ? Math.round(distance * this.config.COEFFICIENT) : 0;
        }
            /**
             * Update the distance meter.
             * @param {number} distance
             * @param {number} deltaTime
             * @return {boolean} Whether the achievement sound fx should be played.
             */
            update(deltaTime, distance) {
            let paint = true;
            let playSound = false;
            if (!this.achievement) {
            distance = this.getActualDistance(distance);
            // Score has gone beyond the initial digit count.
            if (distance > this.maxScore &&
            this.maxScoreUnits === this.config.MAX_DISTANCE_UNITS) {
            this.maxScoreUnits++;
            this.maxScore = parseInt(this.maxScore + '9', 10);
        }
            else {
            this.distance = 0;
        }
            if (distance > 0) {
            // Achievement unlocked.
            if (distance % this.config.ACHIEVEMENT_DISTANCE === 0) {
            // Flash score and play sound.
            this.achievement = true;
            this.flashTimer = 0;
            playSound = true;
        }
            // Create a string representation of the distance with leading 0.
            const distanceStr = (this.defaultString + distance).substr(-this.maxScoreUnits);
            this.digits = distanceStr.split('');
        }
            else {
            this.digits = this.defaultString.split('');
        }
        }
            else {
            // Control flashing of the score on reaching achievement.
            if (this.flashIterations <= this.config.FLASH_ITERATIONS) {
            this.flashTimer += deltaTime;
            if (this.flashTimer < this.config.FLASH_DURATION) {
            paint = false;
        }
            else if (this.flashTimer > this.config.FLASH_DURATION * 2) {
            this.flashTimer = 0;
            this.flashIterations++;
        }
        }
            else {
            this.achievement = false;
            this.flashIterations = 0;
            this.flashTimer = 0;
        }
        }
            // Draw the digits if not flashing.
            if (paint) {
            for (let i = this.digits.length - 1; i >= 0; i--) {
            this.draw(i, parseInt(this.digits[i], 10));
        }
        }
            this.drawHighScore();
            return playSound;
        }
            /**
             * Draw the high score.
             */
            drawHighScore() {
            if (parseInt(this.highScore, 10) > 0) {
            this.canvasCtx.save();
            this.canvasCtx.globalAlpha = .8;
            for (let i = this.highScore.length - 1; i >= 0; i--) {
            this.draw(i, parseInt(this.highScore[i], 10), true);
        }
            this.canvasCtx.restore();
        }
        }
            /**
             * Set the highscore as a array string.
             * Position of char in the sprite: H - 10, I - 11.
             * @param {number} distance Distance ran in pixels.
             */
            setHighScore(distance) {
            distance = this.getActualDistance(distance);
            const highScoreStr = (this.defaultString + distance).substr(-this.maxScoreUnits);
            this.highScore = ['10', '11', ''].concat(highScoreStr.split(''));
        }
            /**
             * Whether a clicked is in the high score area.
             * @param {Event} e Event object.
             * @return {boolean} Whether the click was in the high score bounds.
             */
            hasClickedOnHighScore(e) {
            let x = 0;
            let y = 0;
            if (e.touches) {
            // Bounds for touch differ from pointer.
            const canvasBounds = this.canvas.getBoundingClientRect();
            x = e.touches[0].clientX - canvasBounds.left;
            y = e.touches[0].clientY - canvasBounds.top;
        }
            else {
            x = e.offsetX;
            y = e.offsetY;
        }
            this.highScoreBounds = this.getHighScoreBounds();
            return x >= this.highScoreBounds.x &&
            x <= this.highScoreBounds.x + this.highScoreBounds.width &&
            y >= this.highScoreBounds.y &&
            y <= this.highScoreBounds.y + this.highScoreBounds.height;
        }
            /**
             * Get the bounding box for the high score.
             * @return {Object} Object with x, y, width and height properties.
             */
            getHighScoreBounds() {
            return {
            x: (this.x - (this.maxScoreUnits * 2) * DistanceMeter.dimensions.WIDTH) -
            DistanceMeter.config.HIGH_SCORE_HIT_AREA_PADDING,
            y: this.y,
            width: DistanceMeter.dimensions.WIDTH * (this.highScore.length + 1) +
            DistanceMeter.config.HIGH_SCORE_HIT_AREA_PADDING,
            height: DistanceMeter.dimensions.HEIGHT +
            (DistanceMeter.config.HIGH_SCORE_HIT_AREA_PADDING * 2),
        };
        }
            /**
             * Animate flashing the high score to indicate ready for resetting.
             * The flashing stops following this.config.FLASH_ITERATIONS x 2 flashes.
             */
            flashHighScore() {
            const now = getTimeStamp();
            const deltaTime = now - (this.frameTimeStamp || now);
            let paint = true;
            this.frameTimeStamp = now;
            // Reached the max number of flashes.
            if (this.flashIterations > this.config.FLASH_ITERATIONS * 2) {
            this.cancelHighScoreFlashing();
            return;
        }
            this.flashTimer += deltaTime;
            if (this.flashTimer < this.config.FLASH_DURATION) {
            paint = false;
        }
            else if (this.flashTimer > this.config.FLASH_DURATION * 2) {
            this.flashTimer = 0;
            this.flashIterations++;
        }
            if (paint) {
            this.drawHighScore();
        }
            else {
            this.clearHighScoreBounds();
        }
            // Frame update.
            this.flashingRafId = requestAnimationFrame(this.flashHighScore.bind(this));
        }
            /**
             * Draw empty rectangle over high score.
             */
            clearHighScoreBounds() {
            this.canvasCtx.save();
            this.canvasCtx.fillStyle = '#fff';
            this.canvasCtx.rect(this.highScoreBounds.x, this.highScoreBounds.y, this.highScoreBounds.width, this.highScoreBounds.height);
            this.canvasCtx.fill();
            this.canvasCtx.restore();
        }
            /**
             * Starts the flashing of the high score.
             */
            startHighScoreFlashing() {
            this.highScoreFlashing = true;
            this.flashHighScore();
        }
            /**
             * Whether high score is flashing.
             * @return {boolean}
             */
            isHighScoreFlashing() {
            return this.highScoreFlashing;
        }
            /**
             * Stop flashing the high score.
             */
            cancelHighScoreFlashing() {
            if (this.flashingRafId) {
            cancelAnimationFrame(this.flashingRafId);
        }
            this.flashIterations = 0;
            this.flashTimer = 0;
            this.highScoreFlashing = false;
            this.clearHighScoreBounds();
            this.drawHighScore();
        }
            /**
             * Clear the high score.
             */
            resetHighScore() {
            this.setHighScore(0);
            this.cancelHighScoreFlashing();
        }
            /**
             * Reset the distance meter back to '00000'.
             */
            reset() {
            this.update(0, 0);
            this.achievement = false;
        }
        }
        /**
        * @enum {number}
        */
        DistanceMeter.dimensions = {
            WIDTH: 10,
            HEIGHT: 13,
            DEST_WIDTH: 11,
        };
        /**
        * Y positioning of the digits in the sprite sheet.
        * X position is always 0.
        * @type {Array<number>}
        */
        DistanceMeter.yPos = [0, 13, 27, 40, 53, 67, 80, 93, 107, 120];
        /**
        * Distance meter config.
        * @enum {number}
        */
        DistanceMeter.config = {
            // Number of digits.
            MAX_DISTANCE_UNITS: 5,
            // Distance that causes achievement animation.
            ACHIEVEMENT_DISTANCE: 100,
            // Used for conversion from pixel distance to a scaled unit.
            COEFFICIENT: 0.025,
            // Flash duration in milliseconds.
            FLASH_DURATION: 1000 / 4,
            // Flash iterations for achievement animation.
            FLASH_ITERATIONS: 3,
            // Padding around the high score hit area.
            HIGH_SCORE_HIT_AREA_PADDING: 4,
        };

        // Copyright 2021 The Chromium Authors
        // Use of this source code is governed by a BSD-style license that can be
        // found in the LICENSE file.
        /* @const
        * Add matching sprite definition and config to spriteDefinitionByType.
        */
        const GAME_TYPE = ['altgame'];
        //******************************************************************************
        /**
        * Collision box object.
        * @param {number} x X position.
        * @param {number} y Y Position.
        * @param {number} w Width.
        * @param {number} h Height.
        * @constructor
        */
        function CollisionBox(x, y, w, h) {
            this.x = x;
            this.y = y;
            this.width = w;
            this.height = h;
        }
        /**
        * T-Rex runner sprite definitions.
        */
        const spriteDefinitionByType = {
            original: {
            LDPI: {
            BACKGROUND_EL: { x: 86, y: 2 },
            CACTUS_LARGE: { x: 332, y: 2 },
            CACTUS_SMALL: { x: 228, y: 2 },
            OBSTACLE_2: { x: 332, y: 2 },
            OBSTACLE: { x: 228, y: 2 },
            CLOUD: { x: 86, y: 2 },
            HORIZON: { x: 2, y: 54 },
            MOON: { x: 484, y: 2 },
            PTERODACTYL: { x: 134, y: 2 },
            RESTART: { x: 2, y: 68 },
            TEXT_SPRITE: { x: 655, y: 2 },
            TREX: { x: 848, y: 2 },
            STAR: { x: 645, y: 2 },
            COLLECTABLE: { x: 0, y: 0 },
            ALT_GAME_END: { x: 32, y: 0 },
        },
            HDPI: {
            BACKGROUND_EL: { x: 166, y: 2 },
            CACTUS_LARGE: { x: 652, y: 2 },
            CACTUS_SMALL: { x: 446, y: 2 },
            OBSTACLE_2: { x: 652, y: 2 },
            OBSTACLE: { x: 446, y: 2 },
            CLOUD: { x: 166, y: 2 },
            HORIZON: { x: 2, y: 104 },
            MOON: { x: 954, y: 2 },
            PTERODACTYL: { x: 260, y: 2 },
            RESTART: { x: 2, y: 130 },
            TEXT_SPRITE: { x: 1294, y: 2 },
            TREX: { x: 1678, y: 2 },
            STAR: { x: 1276, y: 2 },
            COLLECTABLE: { x: 0, y: 0 },
            ALT_GAME_END: { x: 64, y: 0 },
        },
            MAX_GAP_COEFFICIENT: 1.5,
            MAX_OBSTACLE_LENGTH: 3,
            HAS_CLOUDS: 1,
            BOTTOM_PAD: 10,
            TREX: {
            WAITING_1: { x: 44, w: 44, h: 47, xOffset: 0 },
            WAITING_2: { x: 0, w: 44, h: 47, xOffset: 0 },
            RUNNING_1: { x: 88, w: 44, h: 47, xOffset: 0 },
            RUNNING_2: { x: 132, w: 44, h: 47, xOffset: 0 },
            JUMPING: { x: 0, w: 44, h: 47, xOffset: 0 },
            CRASHED: { x: 220, w: 44, h: 47, xOffset: 0 },
            COLLISION_BOXES: [
            new CollisionBox(22, 0, 17, 16),
            new CollisionBox(1, 18, 30, 9),
            new CollisionBox(10, 35, 14, 8),
            new CollisionBox(1, 24, 29, 5),
            new CollisionBox(5, 30, 21, 4),
            new CollisionBox(9, 34, 15, 4),
            ],
        },
            /** @type {Array<ObstacleType>} */
            OBSTACLES: [
        {
            type: 'CACTUS_SMALL',
            width: 17,
            height: 35,
            yPos: 105,
            multipleSpeed: 4,
            minGap: 120,
            minSpeed: 0,
            collisionBoxes: [
            new CollisionBox(0, 7, 5, 27),
            new CollisionBox(4, 0, 6, 34),
            new CollisionBox(10, 4, 7, 14),
            ],
        },
        {
            type: 'CACTUS_LARGE',
            width: 25,
            height: 50,
            yPos: 90,
            multipleSpeed: 7,
            minGap: 120,
            minSpeed: 0,
            collisionBoxes: [
            new CollisionBox(0, 12, 7, 38),
            new CollisionBox(8, 0, 7, 49),
            new CollisionBox(13, 10, 10, 38),
            ],
        },
        {
            type: 'PTERODACTYL',
            width: 46,
            height: 40,
            yPos: [100, 75, 50], // Variable height.
            yPosMobile: [100, 50], // Variable height mobile.
            multipleSpeed: 999,
            minSpeed: 8.5,
            minGap: 150,
            collisionBoxes: [
            new CollisionBox(15, 15, 16, 5),
            new CollisionBox(18, 21, 24, 6),
            new CollisionBox(2, 14, 4, 3),
            new CollisionBox(6, 10, 4, 7),
            new CollisionBox(10, 8, 6, 9),
            ],
            numFrames: 2,
            frameRate: 1000 / 6,
            speedOffset: .8,
        },
        {
            type: 'COLLECTABLE',
            width: 31,
            height: 24,
            yPos: 104,
            multipleSpeed: 1000,
            minGap: 9999,
            minSpeed: 0,
            collisionBoxes: [
            new CollisionBox(0, 0, 32, 25),
            ],
        },
            ],
            BACKGROUND_EL: {
            'CLOUD': {
            HEIGHT: 14,
            MAX_CLOUD_GAP: 400,
            MAX_SKY_LEVEL: 30,
            MIN_CLOUD_GAP: 100,
            MIN_SKY_LEVEL: 71,
            OFFSET: 4,
            WIDTH: 46,
            X_POS: 1,
            Y_POS: 120,
        },
        },
            BACKGROUND_EL_CONFIG: {
            MAX_BG_ELS: 1,
            MAX_GAP: 400,
            MIN_GAP: 100,
            POS: 0,
            SPEED: 0.5,
            Y_POS: 125,
        },
            LINES: [
        { SOURCE_X: 2, SOURCE_Y: 52, WIDTH: 600, HEIGHT: 12, YPOS: 127 },
            ],
            ALT_GAME_OVER_TEXT_CONFIG: {
            TEXT_X: 32,
            TEXT_Y: 0,
            TEXT_WIDTH: 246,
            TEXT_HEIGHT: 17,
            FLASH_DURATION: 1500,
            FLASHING: false,
        },
        },
            altgame: {
            LDPI: {
            BACKGROUND_EL: { x: 260, y: 19 },
            OBSTACLE1: { x: 152, y: 65 },
            OBSTACLE2: { x: 188, y: 65 },
            OBSTACLE3: { x: 152, y: 65 },
            OBSTACLE4: { x: 188, y: 65 },
            OBSTACLE5: { x: 0, y: 60 },
            OBSTACLE6: { x: 42, y: 58 },
            OBSTACLE7: { x: 98, y: 58 },
            OBSTACLE8: { x: 96, y: 19 },
            HORIZON: { x: 0, y: 3 },
            TREX: { x: 557, y: 63 },
            COLLECTABLE: { x: 193, y: 19 },
        },
            HDPI: {
            BACKGROUND_EL: { x: 520, y: 38 },
            OBSTACLE1: { x: 304, y: 130 },
            OBSTACLE2: { x: 376, y: 130 },
            OBSTACLE3: { x: 304, y: 130 },
            OBSTACLE4: { x: 376, y: 130 },
            OBSTACLE5: { x: 0, y: 120 },
            OBSTACLE6: { x: 84, y: 116 },
            OBSTACLE7: { x: 196, y: 116 },
            OBSTACLE8: { x: 192, y: 38 },
            HORIZON: { x: 0, y: 6 },
            TREX: { x: 1114, y: 126 },
            COLLECTABLE: { x: 386, y: 38 },
        },
            MAX_GAP_COEFFICIENT: 1.5,
            MAX_OBSTACLE_LENGTH: 2,
            HAS_CLOUDS: 0,
            BOTTOM_PAD: 10,
            TREX: {
            MAX_JUMP_HEIGHT: 50,
            MIN_JUMP_HEIGHT: 40,
            INITIAL_JUMP_VELOCITY: -10,
            RUNNING_1: { x: 96, w: 49, h: 47, xOffset: 0 },
            RUNNING_2: { x: 145, w: 49, h: 47, xOffset: 0 },
            JUMPING: { x: 47, w: 49, h: 47, xOffset: 0 },
            CRASHED: { x: 194, w: 61, h: 47, xOffset: 0 },
            DUCKING_1: { x: 257, w: 55, h: 26, xOffset: 0 },
            DUCKING_2: { x: 316, w: 55, h: 26, xOffset: 0 },
            COLLISION_BOXES: [
            new CollisionBox(22, 0, 17, 16),
            new CollisionBox(1, 18, 30, 9),
            new CollisionBox(10, 35, 14, 8),
            new CollisionBox(1, 24, 29, 5),
            new CollisionBox(5, 30, 21, 4),
            new CollisionBox(9, 34, 15, 4),
            ],
        },
            /** @type {Array<ObstacleType>} */
            OBSTACLES: [
        {
            type: 'OBSTACLE1',
            width: 36,
            height: 45,
            yPos: 95,
            multipleSpeed: 999,
            minGap: 120,
            minSpeed: 0,
            collisionBoxes: [
            new CollisionBox(0, 17, 8, 28),
            new CollisionBox(6, 3, 24, 42),
            new CollisionBox(28, 17, 8, 28),
            ],
        },
        {
            type: 'OBSTACLE2',
            width: 36,
            height: 45,
            yPos: 95,
            multipleSpeed: 999,
            minGap: 120,
            minSpeed: 0,
            collisionBoxes: [
            new CollisionBox(0, 17, 8, 28),
            new CollisionBox(6, 3, 24, 42),
            new CollisionBox(28, 17, 8, 28),
            ],
        },
        {
            type: 'OBSTACLE3',
            width: 72,
            height: 45,
            yPos: 95,
            multipleSpeed: 999,
            minGap: 120,
            minSpeed: 8,
            collisionBoxes: [
            new CollisionBox(0, 17, 8, 28),
            new CollisionBox(6, 3, 24, 42),
            new CollisionBox(28, 17, 8, 28),
            new CollisionBox(36, 17, 8, 28),
            new CollisionBox(42, 3, 24, 42),
            new CollisionBox(64, 17, 8, 28),
            ],
        },
        {
            type: 'OBSTACLE4',
            width: 72,
            height: 45,
            yPos: 95,
            multipleSpeed: 999,
            minGap: 120,
            minSpeed: 8,
            collisionBoxes: [
            new CollisionBox(0, 17, 8, 28),
            new CollisionBox(6, 3, 24, 42),
            new CollisionBox(28, 17, 8, 28),
            new CollisionBox(36, 17, 8, 28),
            new CollisionBox(42, 3, 24, 42),
            new CollisionBox(64, 17, 8, 28),
            ],
        },
        {
            type: 'OBSTACLE5',
            width: 42,
            height: 50,
            yPos: 95,
            multipleSpeed: 999,
            minGap: 120,
            minSpeed: 5,
            collisionBoxes: [
            new CollisionBox(0, 0, 42, 50),
            ],
        },
        {
            type: 'OBSTACLE6',
            width: 56,
            height: 52,
            yPos: 93,
            multipleSpeed: 999,
            minGap: 120,
            minSpeed: 7,
            collisionBoxes: [
            new CollisionBox(0, 11, 8, 40),
            new CollisionBox(8, 0, 19, 51),
            new CollisionBox(27, 11, 28, 40),
            ],
        },
        {
            type: 'OBSTACLE7',
            width: 54,
            height: 52,
            yPos: 93,
            multipleSpeed: 999,
            minGap: 120,
            minSpeed: 6,
            collisionBoxes: [
            new CollisionBox(0, 11, 19, 40),
            new CollisionBox(19, 0, 19, 51),
            new CollisionBox(38, 14, 15, 37),
            ],
        },
        {
            type: 'OBSTACLE8',
            width: 49,
            height: 20,
            yPos: [100, 75, 50], // Variable height.
            yPosMobile: [100, 50], // Variable height mobile.
            multipleSpeed: 999,
            minSpeed: 8.5,
            minGap: 150,
            collisionBoxes: [
            new CollisionBox(15, 15, 16, 5),
            new CollisionBox(18, 21, 24, 6),
            new CollisionBox(2, 14, 4, 3),
            new CollisionBox(6, 10, 4, 7),
            new CollisionBox(10, 8, 6, 9),
            ],
            numFrames: 2,
            frameRate: 1000 / 6,
            speedOffset: .8,
        },
            ],
            BACKGROUND_EL: {
            'GROUP1': {
            HEIGHT: 91,
            MAX_CLOUD_GAP: 600,
            MAX_SKY_LEVEL: 0,
            MIN_CLOUD_GAP: 300,
            MIN_SKY_LEVEL: 0,
            OFFSET: 11,
            WIDTH: 131,
            X_POS: 260,
        },
            'GROUP2': {
            HEIGHT: 91,
            MAX_CLOUD_GAP: 600,
            MAX_SKY_LEVEL: 0,
            MIN_CLOUD_GAP: 300,
            MIN_SKY_LEVEL: 0,
            OFFSET: 11,
            WIDTH: 166,
            X_POS: 391,
        },
        },
            BACKGROUND_EL_CONFIG: {
            MAX_BG_ELS: 8,
            MAX_GAP: 600,
            MIN_GAP: 300,
            POS: 0,
            SPEED: 0.8,
            Y_POS: 122,
        },
            LINES: [
        { SOURCE_X: 2, SOURCE_Y: 3, WIDTH: 600, HEIGHT: 12, YPOS: 128 },
            ],
        },
        };

        // Copyright 2024 The Chromium Authors
        // Use of this source code is governed by a BSD-style license that can be
        // found in the LICENSE file.
        class Trex {
            /**
             * T-rex game character.
             * @param {HTMLCanvasElement} canvas
             * @param {Object} spritePos Positioning within image sprite.
             */
            constructor(canvas, spritePos) {
            this.canvas = canvas;
            this.canvasCtx =
            /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
            this.spritePos = spritePos;
            this.xPos = 0;
            this.yPos = 0;
            this.xInitialPos = 0;
            // Position when on the ground.
            this.groundYPos = 0;
            this.currentFrame = 0;
            this.currentAnimFrames = [];
            this.blinkDelay = 0;
            this.blinkCount = 0;
            this.animStartTime = 0;
            this.timer = 0;
            this.msPerFrame = 1000 / FPS;
            this.config = Object.assign(Trex.config, Trex.normalJumpConfig);
            // Current status.
            this.status = Trex.status.WAITING;
            this.jumping = false;
            this.ducking = false;
            this.jumpVelocity = 0;
            this.reachedMinHeight = false;
            this.speedDrop = false;
            this.jumpCount = 0;
            this.jumpspotX = 0;
            this.altGameModeEnabled = false;
            this.flashing = false;
            this.init();
        }
            /**
             * T-rex player initialiser.
             * Sets the t-rex to blink at random intervals.
             */
            init() {
            this.groundYPos = Runner.defaultDimensions.HEIGHT - this.config.HEIGHT -
            Runner.config.BOTTOM_PAD;
            this.yPos = this.groundYPos;
            this.minJumpHeight = this.groundYPos - this.config.MIN_JUMP_HEIGHT;
            this.draw(0, 0);
            this.update(0, Trex.status.WAITING);
        }
            /**
             * Assign the appropriate jump parameters based on the game speed.
             */
            enableSlowConfig() {
            const jumpConfig = Runner.slowDown ? Trex.slowJumpConfig : Trex.normalJumpConfig;
            Trex.config = Object.assign(Trex.config, jumpConfig);
            this.adjustAltGameConfigForSlowSpeed();
        }
            /**
             * Enables the alternative game. Redefines the dino config.
             * @param {Object} spritePos New positioning within image sprite.
             */
            enableAltGameMode(spritePos) {
            this.altGameModeEnabled = true;
            this.spritePos = spritePos;
            const spriteDefinition = Runner.spriteDefinition['TREX'];
            // Update animation frames.
            Trex.animFrames.RUNNING.frames =
            [spriteDefinition.RUNNING_1.x, spriteDefinition.RUNNING_2.x];
            Trex.animFrames.CRASHED.frames = [spriteDefinition.CRASHED.x];
            if (typeof spriteDefinition.JUMPING.x === 'object') {
            Trex.animFrames.JUMPING.frames = spriteDefinition.JUMPING.x;
        }
            else {
            Trex.animFrames.JUMPING.frames = [spriteDefinition.JUMPING.x];
        }
            Trex.animFrames.DUCKING.frames =
            [spriteDefinition.DUCKING_1.x, spriteDefinition.DUCKING_2.x];
            // Update Trex config
            Trex.config.GRAVITY = spriteDefinition.GRAVITY || Trex.config.GRAVITY;
            Trex.config.HEIGHT = spriteDefinition.RUNNING_1.h,
            Trex.config.INITIAL_JUMP_VELOCITY = spriteDefinition.INITIAL_JUMP_VELOCITY;
            Trex.config.MAX_JUMP_HEIGHT = spriteDefinition.MAX_JUMP_HEIGHT;
            Trex.config.MIN_JUMP_HEIGHT = spriteDefinition.MIN_JUMP_HEIGHT;
            Trex.config.WIDTH = spriteDefinition.RUNNING_1.w;
            Trex.config.WIDTH_CRASHED = spriteDefinition.CRASHED.w;
            Trex.config.WIDTH_JUMP = spriteDefinition.JUMPING.w;
            Trex.config.INVERT_JUMP = spriteDefinition.INVERT_JUMP;
            this.adjustAltGameConfigForSlowSpeed(spriteDefinition.GRAVITY);
            this.config = Trex.config;
            // Adjust bottom horizon placement.
            this.groundYPos = Runner.defaultDimensions.HEIGHT - this.config.HEIGHT -
            Runner.spriteDefinition['BOTTOM_PAD'];
            this.yPos = this.groundYPos;
            this.reset();
        }
            /**
             * Slow speeds adjustments for the alt game modes.
             * @param {number=} opt_gravityValue
             */
            adjustAltGameConfigForSlowSpeed(opt_gravityValue) {
            if (Runner.slowDown) {
            if (opt_gravityValue) {
            Trex.config.GRAVITY = opt_gravityValue / 1.5;
        }
            Trex.config.MIN_JUMP_HEIGHT *= 1.5;
            Trex.config.MAX_JUMP_HEIGHT *= 1.5;
            Trex.config.INITIAL_JUMP_VELOCITY =
            Trex.config.INITIAL_JUMP_VELOCITY * 1.5;
        }
        }
            /**
             * Setter whether dino is flashing.
             * @param {boolean} status
             */
            setFlashing(status) {
            this.flashing = status;
        }
            /**
             * Setter for the jump velocity.
             * The appropriate drop velocity is also set.
             * @param {number} setting
             */
            setJumpVelocity(setting) {
            this.config.INITIAL_JUMP_VELOCITY = -setting;
            this.config.DROP_VELOCITY = -setting / 2;
        }
            /**
             * Set the animation status.
             * @param {!number} deltaTime
             * @param {Trex.status=} opt_status Optional status to switch to.
             */
            update(deltaTime, opt_status) {
            this.timer += deltaTime;
            // Update the status.
            if (opt_status) {
            this.status = opt_status;
            this.currentFrame = 0;
            this.msPerFrame = Trex.animFrames[opt_status].msPerFrame;
            this.currentAnimFrames = Trex.animFrames[opt_status].frames;
            if (opt_status === Trex.status.WAITING) {
            this.animStartTime = getTimeStamp();
            this.setBlinkDelay();
        }
        }
            // Game intro animation, T-rex moves in from the left.
            if (this.playingIntro && this.xPos < this.config.START_X_POS) {
            this.xPos += Math.round((this.config.START_X_POS / this.config.INTRO_DURATION) * deltaTime);
            this.xInitialPos = this.xPos;
        }
            if (this.status === Trex.status.WAITING) {
            this.blink(getTimeStamp());
        }
            else {
            this.draw(this.currentAnimFrames[this.currentFrame], 0);
        }
            // Update the frame position.
            if (!this.flashing && this.timer >= this.msPerFrame) {
            this.currentFrame =
            this.currentFrame === this.currentAnimFrames.length - 1 ?
            0 :
            this.currentFrame + 1;
            this.timer = 0;
        }
            // Speed drop becomes duck if the down key is still being pressed.
            if (this.speedDrop && this.yPos === this.groundYPos) {
            this.speedDrop = false;
            this.setDuck(true);
        }
        }
            /**
             * Draw the t-rex to a particular position.
             * @param {number} x
             * @param {number} y
             */
            draw(x, y) {
            let sourceX = x;
            let sourceY = y;
            let sourceWidth = this.ducking && this.status !== Trex.status.CRASHED ?
            this.config.WIDTH_DUCK :
            this.config.WIDTH;
            let sourceHeight = this.config.HEIGHT;
            const outputHeight = sourceHeight;
            const outputWidth = this.altGameModeEnabled && this.status === Trex.status.CRASHED ?
            this.config.WIDTH_CRASHED :
            this.config.WIDTH;
            let jumpOffset = Runner.spriteDefinition.TREX.JUMPING.xOffset;
            // Width of sprite can change on jump or crashed.
            if (this.altGameModeEnabled) {
            if (this.jumping && this.status !== Trex.status.CRASHED) {
            sourceWidth = this.config.WIDTH_JUMP;
        }
            else if (this.status === Trex.status.CRASHED) {
            sourceWidth = this.config.WIDTH_CRASHED;
        }
        }
            if (IS_HIDPI) {
            sourceX *= 2;
            sourceY *= 2;
            sourceWidth *= 2;
            sourceHeight *= 2;
            jumpOffset *= 2;
        }
            // Adjustments for sprite sheet position.
            sourceX += this.spritePos.x;
            sourceY += this.spritePos.y;
            // Flashing.
            if (this.flashing) {
            if (this.timer < this.config.FLASH_ON) {
            this.canvasCtx.globalAlpha = 0.5;
        }
            else if (this.timer > this.config.FLASH_OFF) {
            this.timer = 0;
        }
        }
            // Ducking.
            if (this.ducking && this.status !== Trex.status.CRASHED) {
            this.canvasCtx.drawImage(Runner.imageSprite, sourceX, sourceY, sourceWidth, sourceHeight, this.xPos, this.yPos, this.config.WIDTH_DUCK, outputHeight);
        }
            else if (this.altGameModeEnabled && this.jumping &&
            this.status !== Trex.status.CRASHED) {
            // Jumping with adjustments.
            this.canvasCtx.drawImage(Runner.imageSprite, sourceX, sourceY, sourceWidth, sourceHeight, this.xPos - jumpOffset, this.yPos, this.config.WIDTH_JUMP, outputHeight);
        }
            else {
            // Crashed whilst ducking. Trex is standing up so needs adjustment.
            if (this.ducking && this.status === Trex.status.CRASHED) {
            this.xPos++;
        }
            // Standing / running
            this.canvasCtx.drawImage(Runner.imageSprite, sourceX, sourceY, sourceWidth, sourceHeight, this.xPos, this.yPos, outputWidth, outputHeight);
        }
            this.canvasCtx.globalAlpha = 1;
        }
            /**
             * Sets a random time for the blink to happen.
             */
            setBlinkDelay() {
            this.blinkDelay = Math.ceil(Math.random() * Trex.BLINK_TIMING);
        }
            /**
             * Make t-rex blink at random intervals.
             * @param {number} time Current time in milliseconds.
             */
            blink(time) {
            const deltaTime = time - this.animStartTime;
            if (deltaTime >= this.blinkDelay) {
            this.draw(this.currentAnimFrames[this.currentFrame], 0);
            if (this.currentFrame === 1) {
            // Set new random delay to blink.
            this.setBlinkDelay();
            this.animStartTime = time;
            this.blinkCount++;
        }
        }
        }
            /**
             * Initialise a jump.
             * @param {number} speed
             */
            startJump(speed) {
            if (!this.jumping) {
            this.update(0, Trex.status.JUMPING);
            // Tweak the jump velocity based on the speed.
            this.jumpVelocity = this.config.INITIAL_JUMP_VELOCITY - (speed / 10);
            this.jumping = true;
            this.reachedMinHeight = false;
            this.speedDrop = false;
            if (this.config.INVERT_JUMP) {
            this.minJumpHeight = this.groundYPos + this.config.MIN_JUMP_HEIGHT;
        }
        }
        }
            /**
             * Jump is complete, falling down.
             */
            endJump() {
            if (this.reachedMinHeight &&
            this.jumpVelocity < this.config.DROP_VELOCITY) {
            this.jumpVelocity = this.config.DROP_VELOCITY;
        }
        }
            /**
             * Update frame for a jump.
             * @param {number} deltaTime
             */
            updateJump(deltaTime) {
            const msPerFrame = Trex.animFrames[this.status].msPerFrame;
            const framesElapsed = deltaTime / msPerFrame;
            // Speed drop makes Trex fall faster.
            if (this.speedDrop) {
            this.yPos += Math.round(this.jumpVelocity * this.config.SPEED_DROP_COEFFICIENT *
            framesElapsed);
        }
            else if (this.config.INVERT_JUMP) {
            this.yPos -= Math.round(this.jumpVelocity * framesElapsed);
        }
            else {
            this.yPos += Math.round(this.jumpVelocity * framesElapsed);
        }
            this.jumpVelocity += this.config.GRAVITY * framesElapsed;
            // Minimum height has been reached.
            if (this.config.INVERT_JUMP && (this.yPos > this.minJumpHeight) ||
            !this.config.INVERT_JUMP && (this.yPos < this.minJumpHeight) ||
            this.speedDrop) {
            this.reachedMinHeight = true;
        }
            // Reached max height.
            if (this.config.INVERT_JUMP && (this.yPos > -this.config.MAX_JUMP_HEIGHT) ||
            !this.config.INVERT_JUMP && (this.yPos < this.config.MAX_JUMP_HEIGHT) ||
            this.speedDrop) {
            this.endJump();
        }
            // Back down at ground level. Jump completed.
            if ((this.config.INVERT_JUMP && this.yPos) < this.groundYPos ||
            (!this.config.INVERT_JUMP && this.yPos) > this.groundYPos) {
            this.reset();
            this.jumpCount++;
            if (Runner.audioCues) {
            Runner.generatedSoundFx.loopFootSteps();
        }
        }
        }
            /**
             * Set the speed drop. Immediately cancels the current jump.
             */
            setSpeedDrop() {
            this.speedDrop = true;
            this.jumpVelocity = 1;
        }
            /**
             * @param {boolean} isDucking
             */
            setDuck(isDucking) {
            if (isDucking && this.status !== Trex.status.DUCKING) {
            this.update(0, Trex.status.DUCKING);
            this.ducking = true;
        }
            else if (this.status === Trex.status.DUCKING) {
            this.update(0, Trex.status.RUNNING);
            this.ducking = false;
        }
        }
            /**
             * Reset the t-rex to running at start of game.
             */
            reset() {
            this.xPos = this.xInitialPos;
            this.yPos = this.groundYPos;
            this.jumpVelocity = 0;
            this.jumping = false;
            this.ducking = false;
            this.update(0, Trex.status.RUNNING);
            this.midair = false;
            this.speedDrop = false;
            this.jumpCount = 0;
        }
        }
        /**
        * T-rex player config.
        */
        Trex.config = {
            DROP_VELOCITY: -5,
            FLASH_OFF: 175,
            FLASH_ON: 100,
            HEIGHT: 47,
            HEIGHT_DUCK: 25,
            INTRO_DURATION: 1500,
            SPEED_DROP_COEFFICIENT: 3,
            SPRITE_WIDTH: 262,
            START_X_POS: 50,
            WIDTH: 44,
            WIDTH_DUCK: 59,
        };
        Trex.slowJumpConfig = {
            GRAVITY: 0.25,
            MAX_JUMP_HEIGHT: 50,
            MIN_JUMP_HEIGHT: 45,
            INITIAL_JUMP_VELOCITY: -20,
        };
        Trex.normalJumpConfig = {
            GRAVITY: 0.6,
            MAX_JUMP_HEIGHT: 30,
            MIN_JUMP_HEIGHT: 30,
            INITIAL_JUMP_VELOCITY: -10,
        };
        /**
        * Used in collision detection.
        * @enum {Array<CollisionBox>}
        */
        Trex.collisionBoxes = {
            DUCKING: [new CollisionBox(1, 18, 55, 25)],
            RUNNING: [
            new CollisionBox(22, 0, 17, 16),
            new CollisionBox(1, 18, 30, 9),
            new CollisionBox(10, 35, 14, 8),
            new CollisionBox(1, 24, 29, 5),
            new CollisionBox(5, 30, 21, 4),
            new CollisionBox(9, 34, 15, 4),
            ],
        };
        /**
        * Animation states.
        * @enum {string}
        */
        Trex.status = {
            CRASHED: 'CRASHED',
            DUCKING: 'DUCKING',
            JUMPING: 'JUMPING',
            RUNNING: 'RUNNING',
            WAITING: 'WAITING',
        };
        /**
        * Blinking coefficient.
        * @const
        */
        Trex.BLINK_TIMING = 7000;
        /**
        * Animation config for different states.
        * @enum {Object}
        */
        Trex.animFrames = {
            WAITING: {
            frames: [44, 0],
            msPerFrame: 1000 / 3,
        },
            RUNNING: {
            frames: [88, 132],
            msPerFrame: 1000 / 12,
        },
            CRASHED: {
            frames: [220],
            msPerFrame: 1000 / 60,
        },
            JUMPING: {
            frames: [0],
            msPerFrame: 1000 / 60,
        },
            DUCKING: {
            frames: [264, 323],
            msPerFrame: 1000 / 8,
        },
        };

        // Copyright 2024 The Chromium Authors
        // Use of this source code is governed by a BSD-style license that can be
        // found in the LICENSE file.
        class GameOverPanel {
            /**
             * Game over panel.
             * @param {!HTMLCanvasElement} canvas
             * @param {Object} textImgPos
             * @param {Object} restartImgPos
             * @param {!Object} dimensions Canvas dimensions.
             * @param {Object=} opt_altGameEndImgPos
             * @param {boolean=} opt_altGameActive
             */
            constructor(canvas, textImgPos, restartImgPos, dimensions, opt_altGameEndImgPos, opt_altGameActive) {
            this.canvas = canvas;
            this.canvasCtx =
            /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
            this.canvasDimensions = dimensions;
            this.textImgPos = textImgPos;
            this.restartImgPos = restartImgPos;
            this.altGameEndImgPos = opt_altGameEndImgPos;
            this.altGameModeActive = opt_altGameActive;
            // Retry animation.
            this.frameTimeStamp = 0;
            this.animTimer = 0;
            this.currentFrame = 0;
            this.gameOverRafId = null;
            this.flashTimer = 0;
            this.flashCounter = 0;
            this.originalText = true;
        }
            /**
             * Update the panel dimensions.
             * @param {number} width New canvas width.
             * @param {number} opt_height Optional new canvas height.
             */
            updateDimensions(width, opt_height) {
            this.canvasDimensions.WIDTH = width;
            if (opt_height) {
            this.canvasDimensions.HEIGHT = opt_height;
        }
            this.currentFrame = GameOverPanel.animConfig.frames.length - 1;
        }
            drawGameOverText(dimensions, opt_useAltText) {
            const centerX = this.canvasDimensions.WIDTH / 2;
            let textSourceX = dimensions.TEXT_X;
            let textSourceY = dimensions.TEXT_Y;
            let textSourceWidth = dimensions.TEXT_WIDTH;
            let textSourceHeight = dimensions.TEXT_HEIGHT;
            const textTargetX = Math.round(centerX - (dimensions.TEXT_WIDTH / 2));
            const textTargetY = Math.round((this.canvasDimensions.HEIGHT - 25) / 3);
            const textTargetWidth = dimensions.TEXT_WIDTH;
            const textTargetHeight = dimensions.TEXT_HEIGHT;
            if (IS_HIDPI) {
            textSourceY *= 2;
            textSourceX *= 2;
            textSourceWidth *= 2;
            textSourceHeight *= 2;
        }
            if (!opt_useAltText) {
            textSourceX += this.textImgPos.x;
            textSourceY += this.textImgPos.y;
        }
            const spriteSource = opt_useAltText ? Runner.altCommonImageSprite : Runner.origImageSprite;
            this.canvasCtx.save();
            if (IS_RTL) {
            this.canvasCtx.translate(this.canvasDimensions.WIDTH, 0);
            this.canvasCtx.scale(-1, 1);
        }
            // Game over text from sprite.
            this.canvasCtx.drawImage(spriteSource, textSourceX, textSourceY, textSourceWidth, textSourceHeight, textTargetX, textTargetY, textTargetWidth, textTargetHeight);
            this.canvasCtx.restore();
        }
            /**
             * Draw additional adornments for alternative game types.
             */
            drawAltGameElements(tRex) {
            // Additional adornments.
            if (this.altGameModeActive && Runner.spriteDefinition.ALT_GAME_END_CONFIG) {
            const altGameEndConfig = Runner.spriteDefinition.ALT_GAME_END_CONFIG;
            let altGameEndSourceWidth = altGameEndConfig.WIDTH;
            let altGameEndSourceHeight = altGameEndConfig.HEIGHT;
            const altGameEndTargetX = tRex.xPos + altGameEndConfig.X_OFFSET;
            const altGameEndTargetY = tRex.yPos + altGameEndConfig.Y_OFFSET;
            if (IS_HIDPI) {
            altGameEndSourceWidth *= 2;
            altGameEndSourceHeight *= 2;
        }
            this.canvasCtx.drawImage(Runner.altCommonImageSprite, this.altGameEndImgPos.x, this.altGameEndImgPos.y, altGameEndSourceWidth, altGameEndSourceHeight, altGameEndTargetX, altGameEndTargetY, altGameEndConfig.WIDTH, altGameEndConfig.HEIGHT);
        }
        }
            /**
             * Draw restart button.
             */
            drawRestartButton() {
            const dimensions = GameOverPanel.dimensions;
            let framePosX = GameOverPanel.animConfig.frames[this.currentFrame];
            let restartSourceWidth = dimensions.RESTART_WIDTH;
            let restartSourceHeight = dimensions.RESTART_HEIGHT;
            const restartTargetX = (this.canvasDimensions.WIDTH / 2) - (dimensions.RESTART_WIDTH / 2);
            const restartTargetY = this.canvasDimensions.HEIGHT / 2;
            if (IS_HIDPI) {
            restartSourceWidth *= 2;
            restartSourceHeight *= 2;
            framePosX *= 2;
        }
            this.canvasCtx.save();
            if (IS_RTL) {
            this.canvasCtx.translate(this.canvasDimensions.WIDTH, 0);
            this.canvasCtx.scale(-1, 1);
        }
            this.canvasCtx.drawImage(Runner.origImageSprite, this.restartImgPos.x + framePosX, this.restartImgPos.y, restartSourceWidth, restartSourceHeight, restartTargetX, restartTargetY, dimensions.RESTART_WIDTH, dimensions.RESTART_HEIGHT);
            this.canvasCtx.restore();
        }
            /**
             * Draw the panel.
             * @param {boolean} opt_altGameModeActive
             * @param {!Trex} opt_tRex
             */
            draw(opt_altGameModeActive, opt_tRex) {
            if (opt_altGameModeActive) {
            this.altGameModeActive = opt_altGameModeActive;
        }
            this.drawGameOverText(GameOverPanel.dimensions, false);
            this.drawRestartButton();
            this.drawAltGameElements(opt_tRex);
            this.update();
        }
            /**
             * Update animation frames.
             */
            update() {
            const now = getTimeStamp();
            const deltaTime = now - (this.frameTimeStamp || now);
            this.frameTimeStamp = now;
            this.animTimer += deltaTime;
            this.flashTimer += deltaTime;
            // Restart Button
            if (this.currentFrame === 0 &&
            this.animTimer > GameOverPanel.LOGO_PAUSE_DURATION) {
            this.animTimer = 0;
            this.currentFrame++;
            this.drawRestartButton();
        }
            else if (this.currentFrame > 0 &&
            this.currentFrame < GameOverPanel.animConfig.frames.length) {
            if (this.animTimer >= GameOverPanel.animConfig.msPerFrame) {
            this.currentFrame++;
            this.drawRestartButton();
        }
        }
            else if (!this.altGameModeActive &&
            this.currentFrame === GameOverPanel.animConfig.frames.length) {
            this.reset();
            return;
        }
            // Game over text
            if (this.altGameModeActive &&
            spriteDefinitionByType.original.ALT_GAME_OVER_TEXT_CONFIG) {
            const altTextConfig = spriteDefinitionByType.original.ALT_GAME_OVER_TEXT_CONFIG;
            if (altTextConfig.FLASHING) {
            if (this.flashCounter < GameOverPanel.FLASH_ITERATIONS &&
            this.flashTimer > altTextConfig.FLASH_DURATION) {
            this.flashTimer = 0;
            this.originalText = !this.originalText;
            this.clearGameOverTextBounds();
            if (this.originalText) {
            this.drawGameOverText(GameOverPanel.dimensions, false);
            this.flashCounter++;
        }
            else {
            this.drawGameOverText(altTextConfig, true);
        }
        }
            else if (this.flashCounter >= GameOverPanel.FLASH_ITERATIONS) {
            this.reset();
            return;
        }
        }
            else {
            this.clearGameOverTextBounds(altTextConfig);
            this.drawGameOverText(altTextConfig, true);
        }
        }
            this.gameOverRafId = requestAnimationFrame(this.update.bind(this));
        }
            /**
             * Clear game over text.
             * @param {Object} dimensions Game over text config.
             */
            clearGameOverTextBounds(dimensions) {
            this.canvasCtx.save();
            this.canvasCtx.clearRect(Math.round(this.canvasDimensions.WIDTH / 2 - (dimensions.TEXT_WIDTH / 2)), Math.round((this.canvasDimensions.HEIGHT - 25) / 3), dimensions.TEXT_WIDTH, dimensions.TEXT_HEIGHT + 4);
            this.canvasCtx.restore();
        }
            reset() {
            if (this.gameOverRafId) {
            cancelAnimationFrame(this.gameOverRafId);
            this.gameOverRafId = null;
        }
            this.animTimer = 0;
            this.frameTimeStamp = 0;
            this.currentFrame = 0;
            this.flashTimer = 0;
            this.flashCounter = 0;
            this.originalText = true;
        }
        }
        GameOverPanel.RESTART_ANIM_DURATION = 875;
        GameOverPanel.LOGO_PAUSE_DURATION = 875;
        GameOverPanel.FLASH_ITERATIONS = 5;
        /**
        * Animation frames spec.
        */
        GameOverPanel.animConfig = {
            frames: [0, 36, 72, 108, 144, 180, 216, 252],
            msPerFrame: GameOverPanel.RESTART_ANIM_DURATION / 8,
        };
        /**
        * Dimensions used in the panel.
        * @enum {number}
        */
        GameOverPanel.dimensions = {
            TEXT_X: 0,
            TEXT_Y: 13,
            TEXT_WIDTH: 191,
            TEXT_HEIGHT: 11,
            RESTART_WIDTH: 36,
            RESTART_HEIGHT: 32,
        };

        // Copyright 2024 The Chromium Authors
        // Use of this source code is governed by a BSD-style license that can be
        // found in the LICENSE file.
        /**
        * Generated sound FX class for audio cues.
        */
        class GeneratedSoundFx {
            audioCues = false;
            context = null;
            panner = null;
            bgSoundIntervalId = null;
            init() {
            this.audioCues = true;
            if (!this.context) {
            this.context = new AudioContext();
            if (IS_IOS) {
            this.context.onstatechange = () => {
            assert(this.context);
            if (this.context.state !== 'running') {
            this.context.resume();
        }
        };
            this.context.resume();
        }
            this.panner = this.context.createStereoPanner ?
            this.context.createStereoPanner() :
            null;
        }
        }
            stopAll() {
            this.cancelFootSteps();
        }
            /**
             * Play oscillators at certain frequency and for a certain time.
             */
            playNote(frequency, startTime, duration, vol = 0.01, pan = 0) {
            assert(this.context);
            const osc1 = this.context.createOscillator();
            const osc2 = this.context.createOscillator();
            const volume = this.context.createGain();
            // Set oscillator wave type
            osc1.type = 'triangle';
            osc2.type = 'triangle';
            volume.gain.value = 0.1;
            // Set up node routing
            if (this.panner) {
            this.panner.pan.value = pan;
            osc1.connect(volume).connect(this.panner);
            osc2.connect(volume).connect(this.panner);
            this.panner.connect(this.context.destination);
        }
            else {
            osc1.connect(volume);
            osc2.connect(volume);
            volume.connect(this.context.destination);
        }
            // Detune oscillators for chorus effect
            osc1.frequency.value = frequency + 1;
            osc2.frequency.value = frequency - 2;
            // Fade out
            volume.gain.setValueAtTime(vol, startTime + duration - 0.05);
            volume.gain.linearRampToValueAtTime(0.00001, startTime + duration);
            // Start oscillators
            osc1.start(startTime);
            osc2.start(startTime);
            // Stop oscillators
            osc1.stop(startTime + duration);
            osc2.stop(startTime + duration);
        }
            background() {
            assert(this.context);
            if (this.audioCues) {
            const now = this.context.currentTime;
            this.playNote(493.883, now, 0.116);
            this.playNote(659.255, now + 0.116, 0.232);
            this.loopFootSteps();
        }
        }
            loopFootSteps() {
            if (this.audioCues && !this.bgSoundIntervalId) {
            this.bgSoundIntervalId = setInterval(() => {
            assert(this.context);
            this.playNote(73.42, this.context.currentTime, 0.05, 0.16);
            this.playNote(69.30, this.context.currentTime + 0.116, 0.116, 0.16);
        }, 280);
        }
        }
            cancelFootSteps() {
            if (this.audioCues && this.bgSoundIntervalId) {
            assert(this.context);
            clearInterval(this.bgSoundIntervalId);
            this.bgSoundIntervalId = null;
            this.playNote(103.83, this.context.currentTime, 0.232, 0.02);
            this.playNote(116.54, this.context.currentTime + 0.116, 0.232, 0.02);
        }
        }
            collect() {
            if (this.audioCues) {
            assert(this.context);
            this.cancelFootSteps();
            const now = this.context.currentTime;
            this.playNote(830.61, now, 0.116);
            this.playNote(1318.51, now + 0.116, 0.232);
        }
        }
            jump() {
            if (this.audioCues) {
            assert(this.context);
            const now = this.context.currentTime;
            this.playNote(659.25, now, 0.116, 0.3, -0.6);
            this.playNote(880, now + 0.116, 0.232, 0.3, -0.6);
        }
        }
        }

        // Copyright 2024 The Chromium Authors
        // Use of this source code is governed by a BSD-style license that can be
        // found in the LICENSE file.
        class BackgroundEl {
            /**
             * Background item.
             * Similar to cloud, without random y position.
             * @param {HTMLCanvasElement} canvas Canvas element.
             * @param {Object} spritePos Position of image in sprite.
             * @param {number} containerWidth
             * @param {string} type Element type.
             */
            constructor(canvas, spritePos, containerWidth, type) {
            this.canvas = canvas;
            this.canvasCtx =
            /** @type {CanvasRenderingContext2D} */ (this.canvas.getContext('2d'));
            this.spritePos = spritePos;
            this.containerWidth = containerWidth;
            this.xPos = containerWidth;
            this.yPos = 0;
            this.remove = false;
            this.type = type;
            this.gap =
            getRandomNum(BackgroundEl.config.MIN_GAP, BackgroundEl.config.MAX_GAP);
            this.animTimer = 0;
            this.switchFrames = false;
            this.spriteConfig = {};
            this.init();
        }
            /**
             * Initialise the element setting the y position.
             */
            init() {
            this.spriteConfig = Runner.spriteDefinition.BACKGROUND_EL[this.type];
            if (this.spriteConfig.FIXED) {
            this.xPos = this.spriteConfig.FIXED_X_POS;
        }
            this.yPos = BackgroundEl.config.Y_POS - this.spriteConfig.HEIGHT +
            this.spriteConfig.OFFSET;
            this.draw();
        }
            /**
             * Draw the element.
             */
            draw() {
            this.canvasCtx.save();
            let sourceWidth = this.spriteConfig.WIDTH;
            let sourceHeight = this.spriteConfig.HEIGHT;
            let sourceX = this.spriteConfig.X_POS;
            const outputWidth = sourceWidth;
            const outputHeight = sourceHeight;
            if (IS_HIDPI) {
            sourceWidth *= 2;
            sourceHeight *= 2;
            sourceX *= 2;
        }
            this.canvasCtx.drawImage(Runner.imageSprite, sourceX, this.spritePos.y, sourceWidth, sourceHeight, this.xPos, this.yPos, outputWidth, outputHeight);
            this.canvasCtx.restore();
        }
            /**
             * Update the background element position.
             * @param {number} speed
             */
            update(speed) {
            if (!this.remove) {
            if (this.spriteConfig.FIXED) {
            this.animTimer += speed;
            if (this.animTimer > BackgroundEl.config.MS_PER_FRAME) {
            this.animTimer = 0;
            this.switchFrames = !this.switchFrames;
        }
            if (this.spriteConfig.FIXED_Y_POS_1 &&
            this.spriteConfig.FIXED_Y_POS_2) {
            this.yPos = this.switchFrames ? this.spriteConfig.FIXED_Y_POS_1 :
            this.spriteConfig.FIXED_Y_POS_2;
        }
        }
            else {
            // Fixed speed, regardless of actual game speed.
            this.xPos -= BackgroundEl.config.SPEED;
        }
            this.draw();
            // Mark as removable if no longer in the canvas.
            if (!this.isVisible()) {
            this.remove = true;
        }
        }
        }
            /**
             * Check if the element is visible on the stage.
             * @return {boolean}
             */
            isVisible() {
            return this.xPos + this.spriteConfig.WIDTH > 0;
        }
        }
        /**
        * Background element object config.
        * Real values assigned when game type changes.
        * @enum {number}
        */
        BackgroundEl.config = {
            MAX_BG_ELS: 0,
            MAX_GAP: 0,
            MIN_GAP: 0,
            POS: 0,
            SPEED: 0,
            Y_POS: 0,
            MS_PER_FRAME: 0, // only needed when BACKGROUND_EL.FIXED is true
        };

        // Copyright 2024 The Chromium Authors
        // Use of this source code is governed by a BSD-style license that can be
        // found in the LICENSE file.
        class Cloud {
            /**
             * Cloud background item.
             * Similar to an obstacle object but without collision boxes.
             * @param {HTMLCanvasElement} canvas Canvas element.
             * @param {Object} spritePos Position of image in sprite.
             * @param {number} containerWidth
             */
            constructor(canvas, spritePos, containerWidth) {
            this.canvas = canvas;
            this.canvasCtx =
            /** @type {CanvasRenderingContext2D} */ (this.canvas.getContext('2d'));
            this.spritePos = spritePos;
            this.containerWidth = containerWidth;
            this.xPos = containerWidth;
            this.yPos = 0;
            this.remove = false;
            this.gap =
            getRandomNum(Cloud.config.MIN_CLOUD_GAP, Cloud.config.MAX_CLOUD_GAP);
            this.init();
        }
            /**
             * Initialise the cloud. Sets the Cloud height.
             */
            init() {
            this.yPos =
            getRandomNum(Cloud.config.MAX_SKY_LEVEL, Cloud.config.MIN_SKY_LEVEL);
            this.draw();
        }
            /**
             * Draw the cloud.
             */
            draw() {
            this.canvasCtx.save();
            let sourceWidth = Cloud.config.WIDTH;
            let sourceHeight = Cloud.config.HEIGHT;
            const outputWidth = sourceWidth;
            const outputHeight = sourceHeight;
            if (IS_HIDPI) {
            sourceWidth = sourceWidth * 2;
            sourceHeight = sourceHeight * 2;
        }
            this.canvasCtx.drawImage(Runner.imageSprite, this.spritePos.x, this.spritePos.y, sourceWidth, sourceHeight, this.xPos, this.yPos, outputWidth, outputHeight);
            this.canvasCtx.restore();
        }
            /**
             * Update the cloud position.
             * @param {number} speed
             */
            update(speed) {
            if (!this.remove) {
            this.xPos -= Math.ceil(speed);
            this.draw();
            // Mark as removable if no longer in the canvas.
            if (!this.isVisible()) {
            this.remove = true;
        }
        }
        }
            /**
             * Check if the cloud is visible on the stage.
             * @return {boolean}
             */
            isVisible() {
            return this.xPos + Cloud.config.WIDTH > 0;
        }
        }
        /**
        * Cloud object config.
        * @enum {number}
        */
        Cloud.config = {
            HEIGHT: 14,
            MAX_CLOUD_GAP: 400,
            MAX_SKY_LEVEL: 30,
            MIN_CLOUD_GAP: 100,
            MIN_SKY_LEVEL: 71,
            WIDTH: 46,
        };

        // Copyright 2024 The Chromium Authors
        // Use of this source code is governed by a BSD-style license that can be
        // found in the LICENSE file.
        class HorizonLine {
            /**
             * Horizon Line.
             * Consists of two connecting lines. Randomly assigns a flat / bumpy horizon.
             * @param {HTMLCanvasElement} canvas
             * @param {Object} lineConfig Configuration object.
             */
            constructor(canvas, lineConfig) {
            let sourceX = lineConfig.SOURCE_X;
            let sourceY = lineConfig.SOURCE_Y;
            if (IS_HIDPI) {
            sourceX *= 2;
            sourceY *= 2;
        }
            this.spritePos = { x: sourceX, y: sourceY };
            this.canvas = canvas;
            this.canvasCtx =
            /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
            this.sourceDimensions = {};
            this.dimensions = lineConfig;
            this.sourceXPos =
            [this.spritePos.x, this.spritePos.x + this.dimensions.WIDTH];
            this.xPos = [];
            this.yPos = 0;
            this.bumpThreshold = 0.5;
            this.setSourceDimensions(lineConfig);
            this.draw();
        }
            /**
             * Set the source dimensions of the horizon line.
             */
            setSourceDimensions(newDimensions) {
            for (const dimension in newDimensions) {
            if (dimension !== 'SOURCE_X' && dimension !== 'SOURCE_Y') {
            if (IS_HIDPI) {
            if (dimension !== 'YPOS') {
            this.sourceDimensions[dimension] = newDimensions[dimension] * 2;
        }
        }
            else {
            this.sourceDimensions[dimension] = newDimensions[dimension];
        }
            this.dimensions[dimension] = newDimensions[dimension];
        }
        }
            this.xPos = [0, newDimensions.WIDTH];
            this.yPos = newDimensions.YPOS;
        }
            /**
             * Return the crop x position of a type.
             */
            getRandomType() {
            return Math.random() > this.bumpThreshold ? this.dimensions.WIDTH : 0;
        }
            /**
             * Draw the horizon line.
             */
            draw() {
            this.canvasCtx.drawImage(Runner.imageSprite, this.sourceXPos[0], this.spritePos.y, this.sourceDimensions.WIDTH, this.sourceDimensions.HEIGHT, this.xPos[0], this.yPos, this.dimensions.WIDTH, this.dimensions.HEIGHT);
            this.canvasCtx.drawImage(Runner.imageSprite, this.sourceXPos[1], this.spritePos.y, this.sourceDimensions.WIDTH, this.sourceDimensions.HEIGHT, this.xPos[1], this.yPos, this.dimensions.WIDTH, this.dimensions.HEIGHT);
        }
            /**
             * Update the x position of an individual piece of the line.
             * @param {number} pos Line position.
             * @param {number} increment
             */
            updateXPos(pos, increment) {
            const line1 = pos;
            const line2 = pos === 0 ? 1 : 0;
            this.xPos[line1] -= increment;
            this.xPos[line2] = this.xPos[line1] + this.dimensions.WIDTH;
            if (this.xPos[line1] <= -this.dimensions.WIDTH) {
            this.xPos[line1] += this.dimensions.WIDTH * 2;
            this.xPos[line2] = this.xPos[line1] - this.dimensions.WIDTH;
            this.sourceXPos[line1] = this.getRandomType() + this.spritePos.x;
        }
        }
            /**
             * Update the horizon line.
             * @param {number} deltaTime
             * @param {number} speed
             */
            update(deltaTime, speed) {
            const increment = Math.floor(speed * (FPS / 1000) * deltaTime);
            if (this.xPos[0] <= 0) {
            this.updateXPos(0, increment);
        }
            else {
            this.updateXPos(1, increment);
        }
            this.draw();
        }
            /**
             * Reset horizon to the starting position.
             */
            reset() {
            this.xPos[0] = 0;
            this.xPos[1] = this.dimensions.WIDTH;
        }
        }

        // Copyright 2024 The Chromium Authors
        // Use of this source code is governed by a BSD-style license that can be
        // found in the LICENSE file.
        class NightMode {
            /**
             * Nightmode shows a moon and stars on the horizon.
             * @param {HTMLCanvasElement} canvas
             * @param {number} spritePos
             * @param {number} containerWidth
             */
            constructor(canvas, spritePos, containerWidth) {
            this.spritePos = spritePos;
            this.canvas = canvas;
            this.canvasCtx =
            /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
            this.xPos = containerWidth - 50;
            this.yPos = 30;
            this.currentPhase = 0;
            this.opacity = 0;
            this.containerWidth = containerWidth;
            this.stars = [];
            this.drawStars = false;
            this.placeStars();
        }
            /**
             * Update moving moon, changing phases.
             * @param {boolean} activated Whether night mode is activated.
             */
            update(activated) {
            // Moon phase.
            if (activated && this.opacity === 0) {
            this.currentPhase++;
            if (this.currentPhase >= NightMode.phases.length) {
            this.currentPhase = 0;
        }
        }
            // Fade in / out.
            if (activated && (this.opacity < 1 || this.opacity === 0)) {
            this.opacity += NightMode.config.FADE_SPEED;
        }
            else if (this.opacity > 0) {
            this.opacity -= NightMode.config.FADE_SPEED;
        }
            // Set moon positioning.
            if (this.opacity > 0) {
            this.xPos = this.updateXPos(this.xPos, NightMode.config.MOON_SPEED);
            // Update stars.
            if (this.drawStars) {
            for (let i = 0; i < NightMode.config.NUM_STARS; i++) {
            this.stars[i].x =
            this.updateXPos(this.stars[i].x, NightMode.config.STAR_SPEED);
        }
        }
            this.draw();
        }
            else {
            this.opacity = 0;
            this.placeStars();
        }
            this.drawStars = true;
        }
            updateXPos(currentPos, speed) {
            if (currentPos < -NightMode.config.WIDTH) {
            currentPos = this.containerWidth;
        }
            else {
            currentPos -= speed;
        }
            return currentPos;
        }
            draw() {
            let moonSourceWidth = this.currentPhase === 3 ? NightMode.config.WIDTH * 2 :
            NightMode.config.WIDTH;
            let moonSourceHeight = NightMode.config.HEIGHT;
            let moonSourceX = this.spritePos.x + NightMode.phases[this.currentPhase];
            const moonOutputWidth = moonSourceWidth;
            let starSize = NightMode.config.STAR_SIZE;
            let starSourceX = spriteDefinitionByType.original.LDPI.STAR.x;
            if (IS_HIDPI) {
            moonSourceWidth *= 2;
            moonSourceHeight *= 2;
            moonSourceX =
            this.spritePos.x + (NightMode.phases[this.currentPhase] * 2);
            starSize *= 2;
            starSourceX = spriteDefinitionByType.original.HDPI.STAR.x;
        }
            this.canvasCtx.save();
            this.canvasCtx.globalAlpha = this.opacity;
            // Stars.
            if (this.drawStars) {
            for (let i = 0; i < NightMode.config.NUM_STARS; i++) {
            this.canvasCtx.drawImage(Runner.origImageSprite, starSourceX, this.stars[i].sourceY, starSize, starSize, Math.round(this.stars[i].x), this.stars[i].y, NightMode.config.STAR_SIZE, NightMode.config.STAR_SIZE);
        }
        }
            // Moon.
            this.canvasCtx.drawImage(Runner.origImageSprite, moonSourceX, this.spritePos.y, moonSourceWidth, moonSourceHeight, Math.round(this.xPos), this.yPos, moonOutputWidth, NightMode.config.HEIGHT);
            this.canvasCtx.globalAlpha = 1;
            this.canvasCtx.restore();
        }
            // Do star placement.
            placeStars() {
            const segmentSize = Math.round(this.containerWidth / NightMode.config.NUM_STARS);
            for (let i = 0; i < NightMode.config.NUM_STARS; i++) {
            this.stars[i] = {};
            this.stars[i].x = getRandomNum(segmentSize * i, segmentSize * (i + 1));
            this.stars[i].y = getRandomNum(0, NightMode.config.STAR_MAX_Y);
            if (IS_HIDPI) {
            this.stars[i].sourceY = spriteDefinitionByType.original.HDPI.STAR.y +
            NightMode.config.STAR_SIZE * 2 * i;
        }
            else {
            this.stars[i].sourceY = spriteDefinitionByType.original.LDPI.STAR.y +
            NightMode.config.STAR_SIZE * i;
        }
        }
        }
            reset() {
            this.currentPhase = 0;
            this.opacity = 0;
            this.update(false);
        }
        }
        /**
        * @enum {number}
        */
        NightMode.config = {
            FADE_SPEED: 0.035,
            HEIGHT: 40,
            MOON_SPEED: 0.25,
            NUM_STARS: 2,
            STAR_SIZE: 9,
            STAR_SPEED: 0.3,
            STAR_MAX_Y: 70,
            WIDTH: 20,
        };
        NightMode.phases = [140, 120, 100, 60, 40, 20, 0];

        // Copyright 2024 The Chromium Authors
        // Use of this source code is governed by a BSD-style license that can be
        // found in the LICENSE file.
        class Obstacle {
            /**
             * Obstacle.
             * @param {CanvasRenderingContext2D} canvasCtx
             * @param {ObstacleType} type
             * @param {Object} spriteImgPos Obstacle position in sprite.
             * @param {Object} dimensions
             * @param {number} gapCoefficient Mutipler in determining the gap.
             * @param {number} speed
             * @param {number=} opt_xOffset
             * @param {boolean=} opt_isAltGameMode
             */
            constructor(canvasCtx, type, spriteImgPos, dimensions, gapCoefficient, speed, opt_xOffset, opt_isAltGameMode) {
            this.canvasCtx = canvasCtx;
            this.spritePos = spriteImgPos;
            this.typeConfig = type;
            this.gapCoefficient = Runner.slowDown ? gapCoefficient * 2 : gapCoefficient;
            this.size = getRandomNum(1, Obstacle.MAX_OBSTACLE_LENGTH);
            this.dimensions = dimensions;
            this.remove = false;
            this.xPos = dimensions.WIDTH + (opt_xOffset || 0);
            this.yPos = 0;
            this.width = 0;
            this.collisionBoxes = [];
            this.gap = 0;
            this.speedOffset = 0;
            this.altGameModeActive = opt_isAltGameMode;
            this.imageSprite = this.typeConfig.type === 'COLLECTABLE' ?
            Runner.altCommonImageSprite :
            this.altGameModeActive ? Runner.altGameImageSprite :
            Runner.imageSprite;
            // For animated obstacles.
            this.currentFrame = 0;
            this.timer = 0;
            this.init(speed);
        }
            /**
             * Initialise the DOM for the obstacle.
             * @param {number} speed
             */
            init(speed) {
            this.cloneCollisionBoxes();
            // Only allow sizing if we're at the right speed.
            if (this.size > 1 && this.typeConfig.multipleSpeed > speed) {
            this.size = 1;
        }
            this.width = this.typeConfig.width * this.size;
            // Check if obstacle can be positioned at various heights.
            if (Array.isArray(this.typeConfig.yPos)) {
            const yPosConfig = IS_MOBILE ? this.typeConfig.yPosMobile : this.typeConfig.yPos;
            this.yPos = yPosConfig[getRandomNum(0, yPosConfig.length - 1)];
        }
            else {
            this.yPos = this.typeConfig.yPos;
        }
            this.draw();
            // Make collision box adjustments,
            // Central box is adjusted to the size as one box.
            //      ____        ______        ________
            //    _|   |-|    _|     |-|    _|       |-|
            //   | |<->| |   | |<--->| |   | |<----->| |
            //   | | 1 | |   | |  2  | |   | |   3   | |
            //   |_|___|_|   |_|_____|_|   |_|_______|_|
            //
            if (this.size > 1) {
            this.collisionBoxes[1].width = this.width - this.collisionBoxes[0].width -
            this.collisionBoxes[2].width;
            this.collisionBoxes[2].x = this.width - this.collisionBoxes[2].width;
        }
            // For obstacles that go at a different speed from the horizon.
            if (this.typeConfig.speedOffset) {
            this.speedOffset = Math.random() > 0.5 ? this.typeConfig.speedOffset :
            -this.typeConfig.speedOffset;
        }
            this.gap = this.getGap(this.gapCoefficient, speed);
            // Increase gap for audio cues enabled.
            if (Runner.audioCues) {
            this.gap *= 2;
        }
        }
            /**
             * Draw and crop based on size.
             */
            draw() {
            let sourceWidth = this.typeConfig.width;
            let sourceHeight = this.typeConfig.height;
            if (IS_HIDPI) {
            sourceWidth = sourceWidth * 2;
            sourceHeight = sourceHeight * 2;
        }
            // X position in sprite.
            let sourceX = (sourceWidth * this.size) * (0.5 * (this.size - 1)) + this.spritePos.x;
            // Animation frames.
            if (this.currentFrame > 0) {
            sourceX += sourceWidth * this.currentFrame;
        }
            this.canvasCtx.drawImage(this.imageSprite, sourceX, this.spritePos.y, sourceWidth * this.size, sourceHeight, this.xPos, this.yPos, this.typeConfig.width * this.size, this.typeConfig.height);
        }
            /**
             * Obstacle frame update.
             * @param {number} deltaTime
             * @param {number} speed
             */
            update(deltaTime, speed) {
            if (!this.remove) {
            if (this.typeConfig.speedOffset) {
            speed += this.speedOffset;
        }
            this.xPos -= Math.floor((speed * FPS / 1000) * deltaTime);
            // Update frame
            if (this.typeConfig.numFrames) {
            this.timer += deltaTime;
            if (this.timer >= this.typeConfig.frameRate) {
            this.currentFrame =
            this.currentFrame === this.typeConfig.numFrames - 1 ?
            0 :
            this.currentFrame + 1;
            this.timer = 0;
        }
        }
            this.draw();
            if (!this.isVisible()) {
            this.remove = true;
        }
        }
        }
            /**
             * Calculate a random gap size.
             * - Minimum gap gets wider as speed increases
             * @param {number} gapCoefficient
             * @param {number} speed
             * @return {number} The gap size.
             */
            getGap(gapCoefficient, speed) {
            const minGap = Math.round(this.width * speed + this.typeConfig.minGap * gapCoefficient);
            const maxGap = Math.round(minGap * Obstacle.MAX_GAP_COEFFICIENT);
            return getRandomNum(minGap, maxGap);
        }
            /**
             * Check if obstacle is visible.
             * @return {boolean} Whether the obstacle is in the game area.
             */
            isVisible() {
            return this.xPos + this.width > 0;
        }
            /**
             * Make a copy of the collision boxes, since these will change based on
             * obstacle type and size.
             */
            cloneCollisionBoxes() {
            const collisionBoxes = this.typeConfig.collisionBoxes;
            for (let i = collisionBoxes.length - 1; i >= 0; i--) {
            this.collisionBoxes[i] = new CollisionBox(collisionBoxes[i].x, collisionBoxes[i].y, collisionBoxes[i].width, collisionBoxes[i].height);
        }
        }
        }
        /**
        * Coefficient for calculating the maximum gap.
        */
        Obstacle.MAX_GAP_COEFFICIENT = 1.5;
        /**
        * Maximum obstacle grouping count.
        */
        Obstacle.MAX_OBSTACLE_LENGTH = 3;

        // Copyright 2024 The Chromium Authors
        // Use of this source code is governed by a BSD-style license that can be
        // found in the LICENSE file.
        /**
        * Horizon background class.
        */
        class Horizon {
            /**
             * @param {HTMLCanvasElement} canvas
             * @param {Object} spritePos Sprite positioning.
             * @param {Object} dimensions Canvas dimensions.
             * @param {number} gapCoefficient
             */
            constructor(canvas, spritePos, dimensions, gapCoefficient) {
            this.canvas = canvas;
            this.canvasCtx =
            /** @type {CanvasRenderingContext2D} */ (this.canvas.getContext('2d'));
            this.config = Horizon.config;
            this.dimensions = dimensions;
            this.gapCoefficient = gapCoefficient;
            this.obstacles = [];
            this.obstacleHistory = [];
            this.horizonOffsets = [0, 0];
            this.cloudFrequency = this.config.CLOUD_FREQUENCY;
            this.spritePos = spritePos;
            this.nightMode = null;
            this.altGameModeActive = false;
            // Cloud
            this.clouds = [];
            this.cloudSpeed = this.config.BG_CLOUD_SPEED;
            // Background elements
            this.backgroundEls = [];
            this.lastEl = null;
            this.backgroundSpeed = this.config.BG_CLOUD_SPEED;
            // Horizon
            this.horizonLine = null;
            this.horizonLines = [];
            this.init();
        }
            /**
             * Initialise the horizon. Just add the line and a cloud. No obstacles.
             */
            init() {
            Obstacle.types = spriteDefinitionByType.original.OBSTACLES;
            this.addCloud();
            // Multiple Horizon lines
            for (let i = 0; i < Runner.spriteDefinition.LINES.length; i++) {
            this.horizonLines.push(new HorizonLine(this.canvas, Runner.spriteDefinition.LINES[i]));
        }
            this.nightMode =
            new NightMode(this.canvas, this.spritePos.MOON, this.dimensions.WIDTH);
        }
            /**
             * Update obstacle definitions based on the speed of the game.
             */
            adjustObstacleSpeed() {
            for (let i = 0; i < Obstacle.types.length; i++) {
            if (Runner.slowDown) {
            Obstacle.types[i].multipleSpeed = Obstacle.types[i].multipleSpeed / 2;
            Obstacle.types[i].minGap *= 1.5;
            Obstacle.types[i].minSpeed = Obstacle.types[i].minSpeed / 2;
            // Convert variable y position obstacles to fixed.
            if (typeof (Obstacle.types[i].yPos) === 'object') {
            Obstacle.types[i].yPos = Obstacle.types[i].yPos[0];
            Obstacle.types[i].yPosMobile = Obstacle.types[i].yPos[0];
        }
        }
        }
        }
            /**
             * Update sprites to correspond to change in sprite sheet.
             * @param {number} spritePos
             */
            enableAltGameMode(spritePos) {
            // Clear existing horizon objects.
            this.clouds = [];
            this.backgroundEls = [];
            this.altGameModeActive = true;
            this.spritePos = spritePos;
            Obstacle.types = Runner.spriteDefinition.OBSTACLES;
            this.adjustObstacleSpeed();
            Obstacle.MAX_GAP_COEFFICIENT = Runner.spriteDefinition.MAX_GAP_COEFFICIENT;
            Obstacle.MAX_OBSTACLE_LENGTH = Runner.spriteDefinition.MAX_OBSTACLE_LENGTH;
            BackgroundEl.config = Runner.spriteDefinition.BACKGROUND_EL_CONFIG;
            this.horizonLines = [];
            for (let i = 0; i < Runner.spriteDefinition.LINES.length; i++) {
            this.horizonLines.push(new HorizonLine(this.canvas, Runner.spriteDefinition.LINES[i]));
        }
            this.reset();
        }
            /**
             * @param {number} deltaTime
             * @param {number} currentSpeed
             * @param {boolean} updateObstacles Used as an override to prevent
             *     the obstacles from being updated / added. This happens in the
             *     ease in section.
             * @param {boolean} showNightMode Night mode activated.
             */
            update(deltaTime, currentSpeed, updateObstacles, showNightMode) {
            this.runningTime += deltaTime;
            if (this.altGameModeActive) {
            this.updateBackgroundEls(deltaTime, currentSpeed);
        }
            for (let i = 0; i < this.horizonLines.length; i++) {
            this.horizonLines[i].update(deltaTime, currentSpeed);
        }
            if (!this.altGameModeActive || Runner.spriteDefinition.HAS_CLOUDS) {
            this.nightMode.update(showNightMode);
            this.updateClouds(deltaTime, currentSpeed);
        }
            if (updateObstacles) {
            this.updateObstacles(deltaTime, currentSpeed);
        }
        }
            /**
             * Update background element positions. Also handles creating new elements.
             * @param {number} elSpeed
             * @param {Array<Object>} bgElArray
             * @param {number} maxBgEl
             * @param {Function} bgElAddFunction
             * @param {number} frequency
             */
            updateBackgroundEl(elSpeed, bgElArray, maxBgEl, bgElAddFunction, frequency) {
            const numElements = bgElArray.length;
            if (numElements) {
            for (let i = numElements - 1; i >= 0; i--) {
            bgElArray[i].update(elSpeed);
        }
            const lastEl = bgElArray[numElements - 1];
            // Check for adding a new element.
            if (numElements < maxBgEl &&
            (this.dimensions.WIDTH - lastEl.xPos) > lastEl.gap &&
            frequency > Math.random()) {
            bgElAddFunction();
        }
        }
            else {
            bgElAddFunction();
        }
        }
            /**
             * Update the cloud positions.
             * @param {number} deltaTime
             * @param {number} speed
             */
            updateClouds(deltaTime, speed) {
            const elSpeed = this.cloudSpeed / 1000 * deltaTime * speed;
            this.updateBackgroundEl(elSpeed, this.clouds, this.config.MAX_CLOUDS, this.addCloud.bind(this), this.cloudFrequency);
            // Remove expired elements.
            this.clouds = this.clouds.filter((obj) => !obj.remove);
        }
            /**
             * Update the background element positions.
             * @param {number} deltaTime
             * @param {number} speed
             */
            updateBackgroundEls(deltaTime, speed) {
            this.updateBackgroundEl(deltaTime, this.backgroundEls, BackgroundEl.config.MAX_BG_ELS, this.addBackgroundEl.bind(this), this.cloudFrequency);
            // Remove expired elements.
            this.backgroundEls = this.backgroundEls.filter((obj) => !obj.remove);
        }
            /**
             * Update the obstacle positions.
             * @param {number} deltaTime
             * @param {number} currentSpeed
             */
            updateObstacles(deltaTime, currentSpeed) {
            const updatedObstacles = this.obstacles.slice(0);
            for (let i = 0; i < this.obstacles.length; i++) {
            const obstacle = this.obstacles[i];
            obstacle.update(deltaTime, currentSpeed);
            // Clean up existing obstacles.
            if (obstacle.remove) {
            updatedObstacles.shift();
        }
        }
            this.obstacles = updatedObstacles;
            if (this.obstacles.length > 0) {
            const lastObstacle = this.obstacles[this.obstacles.length - 1];
            if (lastObstacle && !lastObstacle.followingObstacleCreated &&
            lastObstacle.isVisible() &&
            (lastObstacle.xPos + lastObstacle.width + lastObstacle.gap) <
            this.dimensions.WIDTH) {
            this.addNewObstacle(currentSpeed);
            lastObstacle.followingObstacleCreated = true;
        }
        }
            else {
            // Create new obstacles.
            this.addNewObstacle(currentSpeed);
        }
        }
            removeFirstObstacle() {
            this.obstacles.shift();
        }
            /**
             * Add a new obstacle.
             * @param {number} currentSpeed
             */
            addNewObstacle(currentSpeed) {
            const obstacleCount = Obstacle.types[Obstacle.types.length - 1].type !== 'COLLECTABLE' ||
            (Runner.isAltGameModeEnabled() && !this.altGameModeActive ||
            this.altGameModeActive) ?
            Obstacle.types.length - 1 :
            Obstacle.types.length - 2;
            const obstacleTypeIndex = obstacleCount > 0 ? getRandomNum(0, obstacleCount) : 0;
            const obstacleType = Obstacle.types[obstacleTypeIndex];
            // Check for multiples of the same type of obstacle.
            // Also check obstacle is available at current speed.
            if ((obstacleCount > 0 && this.duplicateObstacleCheck(obstacleType.type)) ||
            currentSpeed < obstacleType.minSpeed) {
            this.addNewObstacle(currentSpeed);
        }
            else {
            const obstacleSpritePos = this.spritePos[obstacleType.type];
            this.obstacles.push(new Obstacle(this.canvasCtx, obstacleType, obstacleSpritePos, this.dimensions, this.gapCoefficient, currentSpeed, obstacleType.width, this.altGameModeActive));
            this.obstacleHistory.unshift(obstacleType.type);
            if (this.obstacleHistory.length > 1) {
            this.obstacleHistory.splice(Runner.config.MAX_OBSTACLE_DUPLICATION);
        }
        }
        }
            /**
             * Returns whether the previous two obstacles are the same as the next one.
             * Maximum duplication is set in config value MAX_OBSTACLE_DUPLICATION.
             * @return {boolean}
             */
            duplicateObstacleCheck(nextObstacleType) {
            let duplicateCount = 0;
            for (let i = 0; i < this.obstacleHistory.length; i++) {
            duplicateCount =
            this.obstacleHistory[i] === nextObstacleType ? duplicateCount + 1 : 0;
        }
            return duplicateCount >= Runner.config.MAX_OBSTACLE_DUPLICATION;
        }
            /**
             * Reset the horizon layer.
             * Remove existing obstacles and reposition the horizon line.
             */
            reset() {
            this.obstacles = [];
            for (let l = 0; l < this.horizonLines.length; l++) {
            this.horizonLines[l].reset();
        }
            this.nightMode.reset();
        }
            /**
             * Update the canvas width and scaling.
             * @param {number} width Canvas width.
             * @param {number} height Canvas height.
             */
            resize(width, height) {
            this.canvas.width = width;
            this.canvas.height = height;
        }
            /**
             * Add a new cloud to the horizon.
             */
            addCloud() {
            this.clouds.push(new Cloud(this.canvas, this.spritePos.CLOUD, this.dimensions.WIDTH));
        }
            /**
             * Add a random background element to the horizon.
             */
            addBackgroundEl() {
            const backgroundElTypes = Object.keys(Runner.spriteDefinition.BACKGROUND_EL);
            if (backgroundElTypes.length > 0) {
            let index = getRandomNum(0, backgroundElTypes.length - 1);
            let type = backgroundElTypes[index];
            // Add variation if available.
            while (type === this.lastEl && backgroundElTypes.length > 1) {
            index = getRandomNum(0, backgroundElTypes.length - 1);
            type = backgroundElTypes[index];
        }
            this.lastEl = type;
            this.backgroundEls.push(new BackgroundEl(this.canvas, this.spritePos.BACKGROUND_EL, this.dimensions.WIDTH, type));
        }
        }
        }
        /**
        * Horizon config.
        * @enum {number}
        */
        Horizon.config = {
            BG_CLOUD_SPEED: 0.2,
            BUMPY_THRESHOLD: .3,
            CLOUD_FREQUENCY: .5,
            HORIZON_HEIGHT: 16,
            MAX_CLOUDS: 6,
        };

        // Copyright 2014 The Chromium Authors
        // Use of this source code is governed by a BSD-style license that can be
        // found in the LICENSE file.
        /**
        * T-Rex runner.
        * @param {string} outerContainerId Outer containing element id.
        * @param {!Object=} opt_config
        * @constructor
        * @implements {EventListener}
        * @export
        */
        function Runner(outerContainerId, opt_config) {
            // Singleton
            if (Runner.instance_) {
            return Runner.instance_;
        }
            Runner.instance_ = this;
            this.outerContainerEl = document.querySelector(outerContainerId);
            this.containerEl = null;
            this.snackbarEl = null;
            // A div to intercept touch events. Only set while (playing && useTouch).
            this.touchController = null;
            this.config = opt_config || Object.assign(Runner.config, Runner.normalConfig);
            // Logical dimensions of the container.
            this.dimensions = Runner.defaultDimensions;
            this.gameType = null;
            Runner.spriteDefinition = spriteDefinitionByType['original'];
            this.altGameImageSprite = null;
            this.altGameModeActive = false;
            this.altGameModeFlashTimer = null;
            this.fadeInTimer = 0;
            this.canvas = null;
            this.canvasCtx = null;
            this.tRex = null;
            this.distanceMeter = null;
            this.distanceRan = 0;
            this.highestScore = 0;
            this.syncHighestScore = false;
            this.time = 0;
            this.runningTime = 0;
            this.msPerFrame = 1000 / FPS;
            this.currentSpeed = this.config.SPEED;
            Runner.slowDown = false;
            this.obstacles = [];
            this.activated = false; // Whether the easter egg has been activated.
            this.playing = false; // Whether the game is currently in play state.
            this.crashed = false;
            this.paused = false;
            this.inverted = false;
            this.invertTimer = 0;
            this.resizeTimerId_ = null;
            this.playCount = 0;
            // Sound FX.
            this.audioBuffer = null;
            /** @type {Object} */
            this.soundFx = {};
            this.generatedSoundFx = null;
            // Global web audio context for playing sounds.
            this.audioContext = null;
            // Images.
            this.images = {};
            this.imagesLoaded = 0;
            // Gamepad state.
            this.pollingGamepads = false;
            this.gamepadIndex = undefined;
            this.previousGamepad = null;
            if (this.isDisabled()) {
            this.setupDisabledRunner();
        }
            else {
            if (Runner.isAltGameModeEnabled()) {
            this.initAltGameType();
            Runner.gameType = this.gameType;
        }
            this.loadImages();
            window['initializeEasterEggHighScore'] =
            this.initializeHighScore.bind(this);
        }
        }
        /**
        * Default game width.
        * @const
        */
        const DEFAULT_WIDTH = 600;
        /** @const */
        const ARCADE_MODE_URL = 'chrome://dino/';
        /** @const */
        const RESOURCE_POSTFIX = 'offline-resources-';
        /** @const */
        const A11Y_STRINGS = {
            ariaLabel: 'dinoGameA11yAriaLabel',
            description: 'dinoGameA11yDescription',
            gameOver: 'dinoGameA11yGameOver',
            highScore: 'dinoGameA11yHighScore',
            jump: 'dinoGameA11yJump',
            started: 'dinoGameA11yStartGame',
            speedLabel: 'dinoGameA11ySpeedToggle',
        };
        /**
        * Default game configuration.
        * Shared config for all  versions of the game. Additional parameters are
        * defined in Runner.normalConfig and Runner.slowConfig.
        */
        Runner.config = {
            AUDIOCUE_PROXIMITY_THRESHOLD: 190,
            AUDIOCUE_PROXIMITY_THRESHOLD_MOBILE_A11Y: 250,
            BG_CLOUD_SPEED: 0.2,
            BOTTOM_PAD: 10,
            // Scroll Y threshold at which the game can be activated.
            CANVAS_IN_VIEW_OFFSET: -10,
            CLEAR_TIME: 3000,
            CLOUD_FREQUENCY: 0.5,
            FADE_DURATION: 1,
            FLASH_DURATION: 1000,
            GAMEOVER_CLEAR_TIME: 1200,
            INITIAL_JUMP_VELOCITY: 12,
            INVERT_FADE_DURATION: 12000,
            MAX_BLINK_COUNT: 3,
            MAX_CLOUDS: 6,
            MAX_OBSTACLE_LENGTH: 3,
            MAX_OBSTACLE_DUPLICATION: 2,
            RESOURCE_TEMPLATE_ID: 'audio-resources',
            SPEED: 6,
            SPEED_DROP_COEFFICIENT: 3,
            ARCADE_MODE_INITIAL_TOP_POSITION: 35,
            ARCADE_MODE_TOP_POSITION_PERCENT: 0.1,
        };
        Runner.normalConfig = {
            ACCELERATION: 0.001,
            AUDIOCUE_PROXIMITY_THRESHOLD: 190,
            AUDIOCUE_PROXIMITY_THRESHOLD_MOBILE_A11Y: 250,
            GAP_COEFFICIENT: 0.6,
            INVERT_DISTANCE: 700,
            MAX_SPEED: 13,
            MOBILE_SPEED_COEFFICIENT: 1.2,
            SPEED: 6,
        };
        Runner.slowConfig = {
            ACCELERATION: 0.0005,
            AUDIOCUE_PROXIMITY_THRESHOLD: 170,
            AUDIOCUE_PROXIMITY_THRESHOLD_MOBILE_A11Y: 220,
            GAP_COEFFICIENT: 0.3,
            INVERT_DISTANCE: 350,
            MAX_SPEED: 9,
            MOBILE_SPEED_COEFFICIENT: 1.5,
            SPEED: 4.2,
        };
        /**
        * Default dimensions.
        */
        Runner.defaultDimensions = {
            WIDTH: DEFAULT_WIDTH,
            HEIGHT: 150,
        };
        /**
        * CSS class names.
        * @enum {string}
        */
        Runner.classes = {
            ARCADE_MODE: 'arcade-mode',
            CANVAS: 'runner-canvas',
            CONTAINER: 'runner-container',
            CRASHED: 'crashed',
            ICON: 'icon-offline',
            INVERTED: 'inverted',
            SNACKBAR: 'snackbar',
            SNACKBAR_SHOW: 'snackbar-show',
            TOUCH_CONTROLLER: 'controller',
        };
        /**
        * Sound FX. Reference to the ID of the audio tag on interstitial page.
        * @enum {string}
        */
        Runner.sounds = {
            BUTTON_PRESS: 'offline-sound-press',
            HIT: 'offline-sound-hit',
            SCORE: 'offline-sound-reached',
        };
        /**
        * Key code mapping.
        * @enum {Object}
        */
        Runner.keycodes = {
            JUMP: { '38': 1, '32': 1 }, // Up, spacebar
            DUCK: { '40': 1 }, // Down
            RESTART: { '13': 1 }, // Enter
        };
        /**
        * Runner event names.
        * @enum {string}
        */
        Runner.events = {
            ANIM_END: 'webkitAnimationEnd',
            CLICK: 'click',
            KEYDOWN: 'keydown',
            KEYUP: 'keyup',
            POINTERDOWN: 'pointerdown',
            POINTERUP: 'pointerup',
            RESIZE: 'resize',
            TOUCHEND: 'touchend',
            TOUCHSTART: 'touchstart',
            VISIBILITY: 'visibilitychange',
            BLUR: 'blur',
            FOCUS: 'focus',
            LOAD: 'load',
            GAMEPADCONNECTED: 'gamepadconnected',
        };
        Runner.prototype = {
            /**
             * Initialize alternative game type.
             */
            initAltGameType() {
            if (GAME_TYPE.length > 0) {
            this.gameType = loadTimeData && loadTimeData.valueExists('altGameType') ?
            GAME_TYPE[parseInt(loadTimeData.getValue('altGameType'), 10) - 1] :
            '';
        }
        },
            /**
             * Whether the easter egg has been disabled. CrOS enterprise enrolled devices.
             * @return {boolean}
             */
            isDisabled() {
            return loadTimeData && loadTimeData.valueExists('disabledEasterEgg');
        },
            /**
             * For disabled instances, set up a snackbar with the disabled message.
             */
            setupDisabledRunner() {
            this.containerEl = document.createElement('div');
            this.containerEl.className = Runner.classes.SNACKBAR;
            this.containerEl.textContent = loadTimeData.getValue('disabledEasterEgg');
            this.outerContainerEl.appendChild(this.containerEl);
            // Show notification when the activation key is pressed.
            document.addEventListener(Runner.events.KEYDOWN, function (e) {
            if (Runner.keycodes.JUMP[e.keyCode]) {
            this.containerEl.classList.add(Runner.classes.SNACKBAR_SHOW);
            document.querySelector('.icon').classList.add('icon-disabled');
        }
        }.bind(this));
        },
            /**
             * Setting individual settings for debugging.
             * @param {string} setting
             * @param {number|string} value
             */
            updateConfigSetting(setting, value) {
            if (setting in this.config && value !== undefined) {
            this.config[setting] = value;
            switch (setting) {
            case 'GRAVITY':
            case 'MIN_JUMP_HEIGHT':
            case 'SPEED_DROP_COEFFICIENT':
            this.tRex.config[setting] = value;
            break;
            case 'INITIAL_JUMP_VELOCITY':
            this.tRex.setJumpVelocity(value);
            break;
            case 'SPEED':
            this.setSpeed(/** @type {number} */ (value));
            break;
        }
        }
        },
            /**
             * Creates an on page image element from the base 64 encoded string source.
             * @param {string} resourceName Name in data object,
             * @return {HTMLImageElement} The created element.
             */
            createImageElement(resourceName) {
            const imgSrc = loadTimeData && loadTimeData.valueExists(resourceName) ?
            loadTimeData.getString(resourceName) :
            null;
            if (imgSrc) {
            const el =
            /** @type {HTMLImageElement} */ (document.createElement('img'));
            el.id = resourceName;
            el.src = imgSrc;
            document.getElementById('offline-resources').appendChild(el);
            return el;
        }
            return null;
        },
            /**
             * Cache the appropriate image sprite from the page and get the sprite sheet
             * definition.
             */
            loadImages() {
            let scale = '1x';
            this.spriteDef = Runner.spriteDefinition.LDPI;
            if (IS_HIDPI) {
            scale = '2x';
            this.spriteDef = Runner.spriteDefinition.HDPI;
        }
            Runner.imageSprite = /** @type {HTMLImageElement} */
            (document.getElementById(RESOURCE_POSTFIX + scale));
            if (this.gameType) {
            Runner.altGameImageSprite = /** @type {HTMLImageElement} */
            (this.createImageElement('altGameSpecificImage' + scale));
            Runner.altCommonImageSprite = /** @type {HTMLImageElement} */
            (this.createImageElement('altGameCommonImage' + scale));
        }
            Runner.origImageSprite = Runner.imageSprite;
            // Disable the alt game mode if the sprites can't be loaded.
            if (!Runner.altGameImageSprite || !Runner.altCommonImageSprite) {
            Runner.isAltGameModeEnabled = () => false;
            this.altGameModeActive = false;
        }
            if (Runner.imageSprite.complete) {
            this.init();
        }
            else {
            // If the images are not yet loaded, add a listener.
            Runner.imageSprite.addEventListener(Runner.events.LOAD, this.init.bind(this));
        }
        },
            /**
             * Load and decode base 64 encoded sounds.
             */
            loadSounds() {
            if (!IS_IOS) {
            this.audioContext = new AudioContext();
            const resourceTemplate = document.getElementById(this.config.RESOURCE_TEMPLATE_ID).content;
            for (const sound in Runner.sounds) {
            let soundSrc = resourceTemplate.getElementById(Runner.sounds[sound]).src;
            soundSrc = soundSrc.substr(soundSrc.indexOf(',') + 1);
            const buffer = decodeBase64ToArrayBuffer(soundSrc);
            // Async, so no guarantee of order in array.
            this.audioContext.decodeAudioData(buffer, function (index, audioData) {
            this.soundFx[index] = audioData;
        }.bind(this, sound));
        }
        }
        },
            /**
             * Sets the game speed. Adjust the speed accordingly if on a smaller screen.
             * @param {number=} opt_speed
             */
            setSpeed(opt_speed) {
            const speed = opt_speed || this.currentSpeed;
            // Reduce the speed on smaller mobile screens.
            if (this.dimensions.WIDTH < DEFAULT_WIDTH) {
            const mobileSpeed = Runner.slowDown ? speed :
            speed * this.dimensions.WIDTH /
            DEFAULT_WIDTH * this.config.MOBILE_SPEED_COEFFICIENT;
            this.currentSpeed = mobileSpeed > speed ? speed : mobileSpeed;
        }
            else if (opt_speed) {
            this.currentSpeed = opt_speed;
        }
        },
            /**
             * Game initialiser.
             */
            init() {
            // Hide the static icon.
            document.querySelector('.' + Runner.classes.ICON).style.visibility =
            'hidden';
            if (this.isArcadeMode()) {
            document.title =
            document.title + ' - ' + getA11yString(A11Y_STRINGS.ariaLabel);
        }
            this.adjustDimensions();
            this.setSpeed();
            const ariaLabel = getA11yString(A11Y_STRINGS.ariaLabel);
            this.containerEl = document.createElement('div');
            this.containerEl.setAttribute('role', IS_MOBILE ? 'button' : 'application');
            this.containerEl.setAttribute('tabindex', '0');
            this.containerEl.setAttribute('title', getA11yString(A11Y_STRINGS.description));
            this.containerEl.setAttribute('aria-label', ariaLabel);
            this.containerEl.className = Runner.classes.CONTAINER;
            // Player canvas container.
            this.canvas = createCanvas(this.containerEl, this.dimensions.WIDTH, this.dimensions.HEIGHT);
            // Live region for game status updates.
            this.a11yStatusEl = document.createElement('span');
            this.a11yStatusEl.className = 'offline-runner-live-region';
            this.a11yStatusEl.setAttribute('aria-live', 'assertive');
            this.a11yStatusEl.textContent = '';
            Runner.a11yStatusEl = this.a11yStatusEl;
            // Add checkbox to slow down the game.
            this.slowSpeedCheckboxLabel = document.createElement('label');
            this.slowSpeedCheckboxLabel.className = 'slow-speed-option hidden';
            this.slowSpeedCheckboxLabel.textContent =
            getA11yString(A11Y_STRINGS.speedLabel);
            this.slowSpeedCheckbox = document.createElement('input');
            this.slowSpeedCheckbox.setAttribute('type', 'checkbox');
            this.slowSpeedCheckbox.setAttribute('title', getA11yString(A11Y_STRINGS.speedLabel));
            this.slowSpeedCheckbox.setAttribute('tabindex', '0');
            this.slowSpeedCheckbox.setAttribute('checked', 'checked');
            this.slowSpeedToggleEl = document.createElement('span');
            this.slowSpeedToggleEl.className = 'slow-speed-toggle';
            this.slowSpeedCheckboxLabel.appendChild(this.slowSpeedCheckbox);
            this.slowSpeedCheckboxLabel.appendChild(this.slowSpeedToggleEl);
            if (IS_IOS) {
            this.outerContainerEl.appendChild(this.a11yStatusEl);
        }
            else {
            this.containerEl.appendChild(this.a11yStatusEl);
        }
            this.generatedSoundFx = new GeneratedSoundFx();
            this.canvasCtx =
            /** @type {CanvasRenderingContext2D} */ (this.canvas.getContext('2d'));
            this.canvasCtx.fillStyle = '#f7f7f7';
            this.canvasCtx.fill();
            Runner.updateCanvasScaling(this.canvas);
            // Horizon contains clouds, obstacles and the ground.
            this.horizon = new Horizon(this.canvas, this.spriteDef, this.dimensions, this.config.GAP_COEFFICIENT);
            // Distance meter
            this.distanceMeter = new DistanceMeter(this.canvas, this.spriteDef.TEXT_SPRITE, this.dimensions.WIDTH);
            // Draw t-rex
            this.tRex = new Trex(this.canvas, this.spriteDef.TREX);
            this.outerContainerEl.appendChild(this.containerEl);
            this.outerContainerEl.appendChild(this.slowSpeedCheckboxLabel);
            this.startListening();
            this.update();
            window.addEventListener(Runner.events.RESIZE, this.debounceResize.bind(this));
            // Handle dark mode
            const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            this.isDarkMode = darkModeMediaQuery && darkModeMediaQuery.matches;
            darkModeMediaQuery.addListener((e) => {
            this.isDarkMode = e.matches;
        });
        },
            /**
             * Create the touch controller. A div that covers whole screen.
             */
            createTouchController() {
            this.touchController = document.createElement('div');
            this.touchController.className = Runner.classes.TOUCH_CONTROLLER;
            this.touchController.addEventListener(Runner.events.TOUCHSTART, this);
            this.touchController.addEventListener(Runner.events.TOUCHEND, this);
            this.outerContainerEl.appendChild(this.touchController);
        },
            /**
             * Debounce the resize event.
             */
            debounceResize() {
            if (!this.resizeTimerId_) {
            this.resizeTimerId_ = setInterval(this.adjustDimensions.bind(this), 250);
        }
        },
            /**
             * Adjust game space dimensions on resize.
             */
            adjustDimensions() {
            clearInterval(this.resizeTimerId_);
            this.resizeTimerId_ = null;
            const boxStyles = window.getComputedStyle(this.outerContainerEl);
            const padding = Number(boxStyles.paddingLeft.substr(0, boxStyles.paddingLeft.length - 2));
            this.dimensions.WIDTH = this.outerContainerEl.offsetWidth - padding * 2;
            if (this.isArcadeMode()) {
            this.dimensions.WIDTH = Math.min(DEFAULT_WIDTH, this.dimensions.WIDTH);
            if (this.activated) {
            this.setArcadeModeContainerScale();
        }
        }
            // Redraw the elements back onto the canvas.
            if (this.canvas) {
            this.canvas.width = this.dimensions.WIDTH;
            this.canvas.height = this.dimensions.HEIGHT;
            Runner.updateCanvasScaling(this.canvas);
            this.distanceMeter.calcXPos(this.dimensions.WIDTH);
            this.clearCanvas();
            this.horizon.update(0, 0, true);
            this.tRex.update(0);
            // Outer container and distance meter.
            if (this.playing || this.crashed || this.paused) {
            this.containerEl.style.width = this.dimensions.WIDTH + 'px';
            this.containerEl.style.height = this.dimensions.HEIGHT + 'px';
            this.distanceMeter.update(0, Math.ceil(this.distanceRan));
            this.stop();
        }
            else {
            this.tRex.draw(0, 0);
        }
            // Game over panel.
            if (this.crashed && this.gameOverPanel) {
            this.gameOverPanel.updateDimensions(this.dimensions.WIDTH);
            this.gameOverPanel.draw(this.altGameModeActive, this.tRex);
        }
        }
        },
            /**
             * Play the game intro.
             * Canvas container width expands out to the full width.
             */
            playIntro() {
            if (!this.activated && !this.crashed) {
            this.playingIntro = true;
            this.tRex.playingIntro = true;
            // CSS animation definition.
            const keyframes = '@-webkit-keyframes intro { ' +
            'from { width:' + Trex.config.WIDTH + 'px }' +
            'to { width: ' + this.dimensions.WIDTH + 'px }' +
            '}';
            document.styleSheets[0].insertRule(keyframes, 0);
            this.containerEl.addEventListener(Runner.events.ANIM_END, this.startGame.bind(this));
            this.containerEl.style.webkitAnimation = 'intro .4s ease-out 1 both';
            this.containerEl.style.width = this.dimensions.WIDTH + 'px';
            this.setPlayStatus(true);
            this.activated = true;
        }
            else if (this.crashed) {
            this.restart();
        }
        },
            /**
             * Update the game status to started.
             */
            startGame() {
            if (this.isArcadeMode()) {
            this.setArcadeMode();
        }
            this.toggleSpeed();
            this.runningTime = 0;
            this.playingIntro = false;
            this.tRex.playingIntro = false;
            this.containerEl.style.webkitAnimation = '';
            this.playCount++;
            this.generatedSoundFx.background();
            if (Runner.audioCues) {
            this.containerEl.setAttribute('title', getA11yString(A11Y_STRINGS.jump));
        }
            // Handle tabbing off the page. Pause the current game.
            document.addEventListener(Runner.events.VISIBILITY, this.onVisibilityChange.bind(this));
            window.addEventListener(Runner.events.BLUR, this.onVisibilityChange.bind(this));
            window.addEventListener(Runner.events.FOCUS, this.onVisibilityChange.bind(this));
        },
            clearCanvas() {
            this.canvasCtx.clearRect(0, 0, this.dimensions.WIDTH, this.dimensions.HEIGHT);
        },
            /**
             * Checks whether the canvas area is in the viewport of the browser
             * through the current scroll position.
             * @return boolean.
             */
            isCanvasInView() {
            return this.containerEl.getBoundingClientRect().top >
            Runner.config.CANVAS_IN_VIEW_OFFSET;
        },
            /**
             * Enable the alt game mode. Switching out the sprites.
             */
            enableAltGameMode() {
            Runner.imageSprite = Runner.altGameImageSprite;
            Runner.spriteDefinition = spriteDefinitionByType[Runner.gameType];
            if (IS_HIDPI) {
            this.spriteDef = Runner.spriteDefinition.HDPI;
        }
            else {
            this.spriteDef = Runner.spriteDefinition.LDPI;
        }
            this.altGameModeActive = true;
            this.tRex.enableAltGameMode(this.spriteDef.TREX);
            this.horizon.enableAltGameMode(this.spriteDef);
            this.generatedSoundFx.background();
        },
            /**
             * Update the game frame and schedules the next one.
             */
            update() {
            this.updatePending = false;
            const now = getTimeStamp();
            let deltaTime = now - (this.time || now);
            // Flashing when switching game modes.
            if (this.altGameModeFlashTimer < 0 || this.altGameModeFlashTimer === 0) {
            this.altGameModeFlashTimer = null;
            this.tRex.setFlashing(false);
            this.enableAltGameMode();
        }
            else if (this.altGameModeFlashTimer > 0) {
            this.altGameModeFlashTimer -= deltaTime;
            this.tRex.update(deltaTime);
            deltaTime = 0;
        }
            this.time = now;
            if (this.playing) {
            this.clearCanvas();
            // Additional fade in - Prevents jump when switching sprites
            if (this.altGameModeActive &&
            this.fadeInTimer <= this.config.FADE_DURATION) {
            this.fadeInTimer += deltaTime / 1000;
            this.canvasCtx.globalAlpha = this.fadeInTimer;
        }
            else {
            this.canvasCtx.globalAlpha = 1;
        }
            if (this.tRex.jumping) {
            this.tRex.updateJump(deltaTime);
        }
            this.runningTime += deltaTime;
            const hasObstacles = this.runningTime > this.config.CLEAR_TIME;
            // First jump triggers the intro.
            if (this.tRex.jumpCount === 1 && !this.playingIntro) {
            this.playIntro();
        }
            // The horizon doesn't move until the intro is over.
            if (this.playingIntro) {
            this.horizon.update(0, this.currentSpeed, hasObstacles);
        }
            else if (!this.crashed) {
            const showNightMode = this.isDarkMode ^ this.inverted;
            deltaTime = !this.activated ? 0 : deltaTime;
            this.horizon.update(deltaTime, this.currentSpeed, hasObstacles, showNightMode);
        }
            // Check for collisions.
            let collision = hasObstacles &&
            checkForCollision(this.horizon.obstacles[0], this.tRex);
            // For a11y, audio cues.
            if (Runner.audioCues && hasObstacles) {
            const jumpObstacle = this.horizon.obstacles[0].typeConfig.type !== 'COLLECTABLE';
            if (!this.horizon.obstacles[0].jumpAlerted) {
            const threshold = Runner.isMobileMouseInput ?
            Runner.config.AUDIOCUE_PROXIMITY_THRESHOLD_MOBILE_A11Y :
            Runner.config.AUDIOCUE_PROXIMITY_THRESHOLD;
            const adjProximityThreshold = threshold +
            (threshold * Math.log10(this.currentSpeed / Runner.config.SPEED));
            if (this.horizon.obstacles[0].xPos < adjProximityThreshold) {
            if (jumpObstacle) {
            this.generatedSoundFx.jump();
        }
            this.horizon.obstacles[0].jumpAlerted = true;
        }
        }
        }
            // Activated alt game mode.
            if (Runner.isAltGameModeEnabled() && collision &&
            this.horizon.obstacles[0].typeConfig.type === 'COLLECTABLE') {
            this.horizon.removeFirstObstacle();
            this.tRex.setFlashing(true);
            collision = false;
            this.altGameModeFlashTimer = this.config.FLASH_DURATION;
            this.runningTime = 0;
            this.generatedSoundFx.collect();
        }
            if (!collision) {
            this.distanceRan += this.currentSpeed * deltaTime / this.msPerFrame;
            if (this.currentSpeed < this.config.MAX_SPEED) {
            this.currentSpeed += this.config.ACCELERATION;
        }
        }
            else {
            this.gameOver();
        }
            const playAchievementSound = this.distanceMeter.update(deltaTime, Math.ceil(this.distanceRan));
            if (!Runner.audioCues && playAchievementSound) {
            this.playSound(this.soundFx.SCORE);
        }
            // Night mode.
            if (!Runner.isAltGameModeEnabled()) {
            if (this.invertTimer > this.config.INVERT_FADE_DURATION) {
            this.invertTimer = 0;
            this.invertTrigger = false;
            this.invert(false);
        }
            else if (this.invertTimer) {
            this.invertTimer += deltaTime;
        }
            else {
            const actualDistance = this.distanceMeter.getActualDistance(Math.ceil(this.distanceRan));
            if (actualDistance > 0) {
            this.invertTrigger =
            !(actualDistance % this.config.INVERT_DISTANCE);
            if (this.invertTrigger && this.invertTimer === 0) {
            this.invertTimer += deltaTime;
            this.invert(false);
        }
        }
        }
        }
        }
            if (this.playing ||
            (!this.activated &&
            this.tRex.blinkCount < Runner.config.MAX_BLINK_COUNT)) {
            this.tRex.update(deltaTime);
            this.scheduleNextUpdate();
        }
        },
            /**
             * Event handler.
             * @param {Event} e
             */
            handleEvent(e) {
            return (function (evtType, events) {
            switch (evtType) {
            case events.KEYDOWN:
            case events.TOUCHSTART:
            case events.POINTERDOWN:
            this.onKeyDown(e);
            break;
            case events.KEYUP:
            case events.TOUCHEND:
            case events.POINTERUP:
            this.onKeyUp(e);
            break;
            case events.GAMEPADCONNECTED:
            this.onGamepadConnected(e);
            break;
        }
        }.bind(this))(e.type, Runner.events);
        },
            /**
             * Initialize audio cues if activated by focus on the canvas element.
             * @param {Event} e
             */
            handleCanvasKeyPress(e) {
            if (!this.activated && !Runner.audioCues) {
            this.toggleSpeed();
            Runner.audioCues = true;
            this.generatedSoundFx.init();
            Runner.generatedSoundFx = this.generatedSoundFx;
            Runner.config.CLEAR_TIME *= 1.2;
        }
            else if (e.keyCode && Runner.keycodes.JUMP[e.keyCode]) {
            this.onKeyDown(e);
        }
        },
            /**
             * Prevent space key press from scrolling.
             * @param {Event} e
             */
            preventScrolling(e) {
            if (e.keyCode === 32) {
            e.preventDefault();
        }
        },
            /**
             * Toggle speed setting if toggle is shown.
             */
            toggleSpeed() {
            if (Runner.audioCues) {
            const speedChange = Runner.slowDown !== this.slowSpeedCheckbox.checked;
            if (speedChange) {
            Runner.slowDown = this.slowSpeedCheckbox.checked;
            const updatedConfig = Runner.slowDown ? Runner.slowConfig : Runner.normalConfig;
            Runner.config = Object.assign(Runner.config, updatedConfig);
            this.currentSpeed = updatedConfig.SPEED;
            this.tRex.enableSlowConfig();
            this.horizon.adjustObstacleSpeed();
        }
            if (this.playing) {
            this.disableSpeedToggle(true);
        }
        }
        },
            /**
             * Show the speed toggle.
             * From focus event or when audio cues are activated.
             * @param {Event=} e
             */
            showSpeedToggle(e) {
            const isFocusEvent = e && e.type === 'focus';
            if (Runner.audioCues || isFocusEvent) {
            this.slowSpeedCheckboxLabel.classList.toggle(HIDDEN_CLASS, isFocusEvent ? false : !this.crashed);
        }
        },
            /**
             * Disable the speed toggle.
             * @param {boolean} disable
             */
            disableSpeedToggle(disable) {
            if (disable) {
            this.slowSpeedCheckbox.setAttribute('disabled', 'disabled');
        }
            else {
            this.slowSpeedCheckbox.removeAttribute('disabled');
        }
        },
            /**
             * Bind relevant key / mouse / touch listeners.
             */
            startListening() {
            // A11y keyboard / screen reader activation.
            this.containerEl.addEventListener(Runner.events.KEYDOWN, this.handleCanvasKeyPress.bind(this));
            if (!IS_MOBILE) {
            this.containerEl.addEventListener(Runner.events.FOCUS, this.showSpeedToggle.bind(this));
        }
            this.canvas.addEventListener(Runner.events.KEYDOWN, this.preventScrolling.bind(this));
            this.canvas.addEventListener(Runner.events.KEYUP, this.preventScrolling.bind(this));
            // Keys.
            document.addEventListener(Runner.events.KEYDOWN, this);
            document.addEventListener(Runner.events.KEYUP, this);
            // Touch / pointer.
            this.containerEl.addEventListener(Runner.events.TOUCHSTART, this);
            document.addEventListener(Runner.events.POINTERDOWN, this);
            document.addEventListener(Runner.events.POINTERUP, this);
            if (this.isArcadeMode()) {
            // Gamepad
            window.addEventListener(Runner.events.GAMEPADCONNECTED, this);
        }
        },
            /**
             * Remove all listeners.
             */
            stopListening() {
            document.removeEventListener(Runner.events.KEYDOWN, this);
            document.removeEventListener(Runner.events.KEYUP, this);
            if (this.touchController) {
            this.touchController.removeEventListener(Runner.events.TOUCHSTART, this);
            this.touchController.removeEventListener(Runner.events.TOUCHEND, this);
        }
            this.containerEl.removeEventListener(Runner.events.TOUCHSTART, this);
            document.removeEventListener(Runner.events.POINTERDOWN, this);
            document.removeEventListener(Runner.events.POINTERUP, this);
            if (this.isArcadeMode()) {
            window.removeEventListener(Runner.events.GAMEPADCONNECTED, this);
        }
        },
            /**
             * Process keydown.
             * @param {Event} e
             */
            onKeyDown(e) {
            // Prevent native page scrolling whilst tapping on mobile.
            if (IS_MOBILE && this.playing) {
            e.preventDefault();
        }
            if (this.isCanvasInView()) {
            // Allow toggling of speed toggle.
            if (Runner.keycodes.JUMP[e.keyCode] &&
            e.target === this.slowSpeedCheckbox) {
            return;
        }
            if (!this.crashed && !this.paused) {
            // For a11y, screen reader activation.
            const isMobileMouseInput = IS_MOBILE &&
            e.type === Runner.events.POINTERDOWN && e.pointerType === 'mouse' &&
            (e.target === this.containerEl ||
            (IS_IOS &&
            (e.target === this.touchController || e.target === this.canvas)));
            if (Runner.keycodes.JUMP[e.keyCode] ||
            e.type === Runner.events.TOUCHSTART || isMobileMouseInput) {
            e.preventDefault();
            // Starting the game for the first time.
            if (!this.playing) {
            // Started by touch so create a touch controller.
            if (!this.touchController && e.type === Runner.events.TOUCHSTART) {
            this.createTouchController();
        }
            if (isMobileMouseInput) {
            this.handleCanvasKeyPress(e);
        }
            this.loadSounds();
            this.setPlayStatus(true);
            this.update();
            if (window.errorPageController) {
            errorPageController.trackEasterEgg();
        }
        }
            // Start jump.
            if (!this.tRex.jumping && !this.tRex.ducking) {
            if (Runner.audioCues) {
            this.generatedSoundFx.cancelFootSteps();
        }
            else {
            this.playSound(this.soundFx.BUTTON_PRESS);
        }
            this.tRex.startJump(this.currentSpeed);
        }
        }
            else if (this.playing && Runner.keycodes.DUCK[e.keyCode]) {
            e.preventDefault();
            if (this.tRex.jumping) {
            // Speed drop, activated only when jump key is not pressed.
            this.tRex.setSpeedDrop();
        }
            else if (!this.tRex.jumping && !this.tRex.ducking) {
            // Duck.
            this.tRex.setDuck(true);
        }
        }
        }
        }
        },
            /**
             * Process key up.
             * @param {Event} e
             */
            onKeyUp(e) {
            const keyCode = String(e.keyCode);
            const isjumpKey = Runner.keycodes.JUMP[keyCode] ||
            e.type === Runner.events.TOUCHEND || e.type === Runner.events.POINTERUP;
            if (this.isRunning() && isjumpKey) {
            this.tRex.endJump();
        }
            else if (Runner.keycodes.DUCK[keyCode]) {
            this.tRex.speedDrop = false;
            this.tRex.setDuck(false);
        }
            else if (this.crashed) {
            // Check that enough time has elapsed before allowing jump key to restart.
            const deltaTime = getTimeStamp() - this.time;
            if (this.isCanvasInView() &&
            (Runner.keycodes.RESTART[keyCode] || this.isLeftClickOnCanvas(e) ||
            (deltaTime >= this.config.GAMEOVER_CLEAR_TIME &&
            Runner.keycodes.JUMP[keyCode]))) {
            this.handleGameOverClicks(e);
        }
        }
            else if (this.paused && isjumpKey) {
            // Reset the jump state
            this.tRex.reset();
            this.play();
        }
        },
            /**
             * Process gamepad connected event.
             * @param {Event} e
             */
            onGamepadConnected(e) {
            if (!this.pollingGamepads) {
            this.pollGamepadState();
        }
        },
            /**
             * rAF loop for gamepad polling.
             */
            pollGamepadState() {
            const gamepads = navigator.getGamepads();
            this.pollActiveGamepad(gamepads);
            this.pollingGamepads = true;
            requestAnimationFrame(this.pollGamepadState.bind(this));
        },
            /**
             * Polls for a gamepad with the jump button pressed. If one is found this
             * becomes the "active" gamepad and all others are ignored.
             * @param {!Array<Gamepad>} gamepads
             */
            pollForActiveGamepad(gamepads) {
            for (let i = 0; i < gamepads.length; ++i) {
            if (gamepads[i] && gamepads[i].buttons.length > 0 &&
            gamepads[i].buttons[0].pressed) {
            this.gamepadIndex = i;
            this.pollActiveGamepad(gamepads);
            return;
        }
        }
        },
            /**
             * Polls the chosen gamepad for button presses and generates KeyboardEvents
             * to integrate with the rest of the game logic.
             * @param {!Array<Gamepad>} gamepads
             */
            pollActiveGamepad(gamepads) {
            if (this.gamepadIndex === undefined) {
            this.pollForActiveGamepad(gamepads);
            return;
        }
            const gamepad = gamepads[this.gamepadIndex];
            if (!gamepad) {
            this.gamepadIndex = undefined;
            this.pollForActiveGamepad(gamepads);
            return;
        }
            // The gamepad specification defines the typical mapping of physical buttons
            // to button indicies: https://w3c.github.io/gamepad/#remapping
            this.pollGamepadButton(gamepad, 0, 38); // Jump
            if (gamepad.buttons.length >= 2) {
            this.pollGamepadButton(gamepad, 1, 40); // Duck
        }
            if (gamepad.buttons.length >= 10) {
            this.pollGamepadButton(gamepad, 9, 13); // Restart
        }
            this.previousGamepad = gamepad;
        },
            /**
             * Generates a key event based on a gamepad button.
             * @param {!Gamepad} gamepad
             * @param {number} buttonIndex
             * @param {number} keyCode
             */
            pollGamepadButton(gamepad, buttonIndex, keyCode) {
            const state = gamepad.buttons[buttonIndex].pressed;
            let previousState = false;
            if (this.previousGamepad) {
            previousState = this.previousGamepad.buttons[buttonIndex].pressed;
        }
            // Generate key events on the rising and falling edge of a button press.
            if (state !== previousState) {
            const e = new KeyboardEvent(state ? Runner.events.KEYDOWN : Runner.events.KEYUP, { keyCode: keyCode });
            document.dispatchEvent(e);
        }
        },
            /**
             * Handle interactions on the game over screen state.
             * A user is able to tap the high score twice to reset it.
             * @param {Event} e
             */
            handleGameOverClicks(e) {
            if (e.target !== this.slowSpeedCheckbox) {
            e.preventDefault();
            if (this.distanceMeter.hasClickedOnHighScore(e) && this.highestScore) {
            if (this.distanceMeter.isHighScoreFlashing()) {
            // Subsequent click, reset the high score.
            this.saveHighScore(0, true);
            this.distanceMeter.resetHighScore();
        }
            else {
            // First click, flash the high score.
            this.distanceMeter.startHighScoreFlashing();
        }
        }
            else {
            this.distanceMeter.cancelHighScoreFlashing();
            this.restart();
        }
        }
        },
            /**
             * Returns whether the event was a left click on canvas.
             * On Windows right click is registered as a click.
             * @param {Event} e
             * @return {boolean}
             */
            isLeftClickOnCanvas(e) {
            return e.button != null && e.button < 2 &&
            e.type === Runner.events.POINTERUP &&
            (e.target === this.canvas ||
            (IS_MOBILE && Runner.audioCues && e.target === this.containerEl));
        },
            /**
             * RequestAnimationFrame wrapper.
             */
            scheduleNextUpdate() {
            if (!this.updatePending) {
            this.updatePending = true;
            this.raqId = requestAnimationFrame(this.update.bind(this));
        }
        },
            /**
             * Whether the game is running.
             * @return {boolean}
             */
            isRunning() {
            return !!this.raqId;
        },
            /**
             * Set the initial high score as stored in the user's profile.
             * @param {number} highScore
             */
            initializeHighScore(highScore) {
            this.syncHighestScore = true;
            highScore = Math.ceil(highScore);
            if (highScore < this.highestScore) {
            if (window.errorPageController) {
            errorPageController.updateEasterEggHighScore(this.highestScore);
        }
            return;
        }
            this.highestScore = highScore;
            this.distanceMeter.setHighScore(this.highestScore);
        },
            /**
             * Sets the current high score and saves to the profile if available.
             * @param {number} distanceRan Total distance ran.
             * @param {boolean=} opt_resetScore Whether to reset the score.
             */
            saveHighScore(distanceRan, opt_resetScore) {
            this.highestScore = Math.ceil(distanceRan);
            this.distanceMeter.setHighScore(this.highestScore);
            // Store the new high score in the profile.
            if (this.syncHighestScore && window.errorPageController) {
            if (opt_resetScore) {
            errorPageController.resetEasterEggHighScore();
        }
            else {
            errorPageController.updateEasterEggHighScore(this.highestScore);
        }
        }
        },
            /**
             * Game over state.
             */
            gameOver() {
            this.playSound(this.soundFx.HIT);
            vibrate(200);
            this.stop();
            this.crashed = true;
            this.distanceMeter.achievement = false;
            this.tRex.update(100, Trex.status.CRASHED);
            // Game over panel.
            if (!this.gameOverPanel) {
            const origSpriteDef = IS_HIDPI ? spriteDefinitionByType.original.HDPI :
            spriteDefinitionByType.original.LDPI;
            if (this.canvas) {
            if (Runner.isAltGameModeEnabled) {
            this.gameOverPanel = new GameOverPanel(this.canvas, origSpriteDef.TEXT_SPRITE, origSpriteDef.RESTART, this.dimensions, origSpriteDef.ALT_GAME_END, this.altGameModeActive);
        }
            else {
            this.gameOverPanel = new GameOverPanel(this.canvas, origSpriteDef.TEXT_SPRITE, origSpriteDef.RESTART, this.dimensions);
        }
        }
        }
            this.gameOverPanel.draw(this.altGameModeActive, this.tRex);
            // Update the high score.
            if (this.distanceRan > this.highestScore) {
            this.saveHighScore(this.distanceRan);
        }
            // Reset the time clock.
            this.time = getTimeStamp();
            if (Runner.audioCues) {
            this.generatedSoundFx.stopAll();
            announcePhrase(getA11yString(A11Y_STRINGS.gameOver)
            .replace('$1', this.distanceMeter.getActualDistance(this.distanceRan)
            .toString()) +
            ' ' +
            getA11yString(A11Y_STRINGS.highScore)
            .replace('$1', this.distanceMeter.getActualDistance(this.highestScore)
            .toString()));
            this.containerEl.setAttribute('title', getA11yString(A11Y_STRINGS.ariaLabel));
        }
            this.showSpeedToggle();
            this.disableSpeedToggle(false);
        },
            stop() {
            this.setPlayStatus(false);
            this.paused = true;
            cancelAnimationFrame(this.raqId);
            this.raqId = 0;
            this.generatedSoundFx.stopAll();
        },
            play() {
            if (!this.crashed) {
            this.setPlayStatus(true);
            this.paused = false;
            this.tRex.update(0, Trex.status.RUNNING);
            this.time = getTimeStamp();
            this.update();
            this.generatedSoundFx.background();
        }
        },
            restart() {
            if (!this.raqId) {
            this.playCount++;
            this.runningTime = 0;
            this.setPlayStatus(true);
            this.toggleSpeed();
            this.paused = false;
            this.crashed = false;
            this.distanceRan = 0;
            this.setSpeed(this.config.SPEED);
            this.time = getTimeStamp();
            this.containerEl.classList.remove(Runner.classes.CRASHED);
            this.clearCanvas();
            this.distanceMeter.reset();
            this.horizon.reset();
            this.tRex.reset();
            this.playSound(this.soundFx.BUTTON_PRESS);
            this.invert(true);
            this.flashTimer = null;
            this.update();
            this.gameOverPanel.reset();
            this.generatedSoundFx.background();
            this.containerEl.setAttribute('title', getA11yString(A11Y_STRINGS.jump));
            announcePhrase(getA11yString(A11Y_STRINGS.started));
        }
        },
            setPlayStatus(isPlaying) {
            if (this.touchController) {
            this.touchController.classList.toggle(HIDDEN_CLASS, !isPlaying);
        }
            this.playing = isPlaying;
        },
            /**
             * Whether the game should go into arcade mode.
             * @return {boolean}
             */
            isArcadeMode() {
            // In RTL languages the title is wrapped with the left to right mark
            // control characters &#x202A; and &#x202C but are invisible.
            return IS_RTL ? document.title.indexOf(ARCADE_MODE_URL) === 1 :
            document.title === ARCADE_MODE_URL;
        },
            /**
             * Hides offline messaging for a fullscreen game only experience.
             */
            setArcadeMode() {
            document.body.classList.add(Runner.classes.ARCADE_MODE);
            this.setArcadeModeContainerScale();
        },
            /**
             * Sets the scaling for arcade mode.
             */
            setArcadeModeContainerScale() {
            const windowHeight = window.innerHeight;
            const scaleHeight = windowHeight / this.dimensions.HEIGHT;
            const scaleWidth = window.innerWidth / this.dimensions.WIDTH;
            const scale = Math.max(1, Math.min(scaleHeight, scaleWidth));
            const scaledCanvasHeight = this.dimensions.HEIGHT * scale;
            // Positions the game container at 10% of the available vertical window
            // height minus the game container height.
            const translateY = Math.ceil(Math.max(0, (windowHeight - scaledCanvasHeight -
            Runner.config.ARCADE_MODE_INITIAL_TOP_POSITION) *
            Runner.config.ARCADE_MODE_TOP_POSITION_PERCENT)) *
            window.devicePixelRatio;
            const cssScale = IS_RTL ? -scale + ',' + scale : scale;
            this.containerEl.style.transform =
            'scale(' + cssScale + ') translateY(' + translateY + 'px)';
        },
            /**
             * Pause the game if the tab is not in focus.
             */
            onVisibilityChange(e) {
            if (document.hidden || document.webkitHidden || e.type === 'blur' ||
            document.visibilityState !== 'visible') {
            this.stop();
        }
            else if (!this.crashed) {
            this.tRex.reset();
            this.play();
        }
        },
            /**
             * Play a sound.
             * @param {AudioBuffer} soundBuffer
             */
            playSound(soundBuffer) {
            if (soundBuffer) {
            const sourceNode = this.audioContext.createBufferSource();
            sourceNode.buffer = soundBuffer;
            sourceNode.connect(this.audioContext.destination);
            sourceNode.start(0);
        }
        },
            /**
             * Inverts the current page / canvas colors.
             * @param {boolean} reset Whether to reset colors.
             */
            invert(reset) {
            const htmlEl = document.firstElementChild;
            if (reset) {
            htmlEl.classList.toggle(Runner.classes.INVERTED, false);
            this.invertTimer = 0;
            this.inverted = false;
        }
            else {
            this.inverted =
            htmlEl.classList.toggle(Runner.classes.INVERTED, this.invertTrigger);
        }
        },
        };
        /**
        * Updates the canvas size taking into
        * account the backing store pixel ratio and
        * the device pixel ratio.
        *
        * See article by Paul Lewis:
        * http://www.html5rocks.com/en/tutorials/canvas/hidpi/
        *
        * @param {HTMLCanvasElement} canvas
        * @param {number=} opt_width
        * @param {number=} opt_height
        * @return {boolean} Whether the canvas was scaled.
        */
        Runner.updateCanvasScaling = function (canvas, opt_width, opt_height) {
            const context =
            /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
            // Query the various pixel ratios
            const devicePixelRatio = Math.floor(window.devicePixelRatio) || 1;
            /** @suppress {missingProperties} */
            const backingStoreRatio = Math.floor(context.webkitBackingStorePixelRatio) || 1;
            const ratio = devicePixelRatio / backingStoreRatio;
            // Upscale the canvas if the two ratios don't match
            if (devicePixelRatio !== backingStoreRatio) {
            const oldWidth = opt_width || canvas.width;
            const oldHeight = opt_height || canvas.height;
            canvas.width = oldWidth * ratio;
            canvas.height = oldHeight * ratio;
            canvas.style.width = oldWidth + 'px';
            canvas.style.height = oldHeight + 'px';
            // Scale the context to counter the fact that we've manually scaled
            // our canvas element.
            context.scale(ratio, ratio);
            return true;
        }
            else if (devicePixelRatio === 1) {
            // Reset the canvas width / height. Fixes scaling bug when the page is
            // zoomed and the devicePixelRatio changes accordingly.
            canvas.style.width = canvas.width + 'px';
            canvas.style.height = canvas.height + 'px';
        }
            return false;
        };
        /**
        * Whether events are enabled.
        * @return {boolean}
        */
        Runner.isAltGameModeEnabled = function () {
            return loadTimeData && loadTimeData.valueExists('enableAltGameMode');
        };
        /**
        * For screen readers make an announcement to the live region.
        * @param {string} phrase Sentence to speak.
        */
        function announcePhrase(phrase) {
            if (Runner.a11yStatusEl) {
            Runner.a11yStatusEl.textContent = '';
            Runner.a11yStatusEl.textContent = phrase;
        }
        }
        /**
        * Returns a string from loadTimeData data object.
        * @param {string} stringName
        * @return {string}
        */
        function getA11yString(stringName) {
            return loadTimeData && loadTimeData.valueExists(stringName) ?
            loadTimeData.getString(stringName) :
            '';
        }
        /**
        * Vibrate on mobile devices.
        * @param {number} duration Duration of the vibration in milliseconds.
        */
        function vibrate(duration) {
            if (IS_MOBILE && window.navigator.vibrate) {
            window.navigator.vibrate(duration);
        }
        }
        /**
        * Create canvas element.
        * @param {Element} container Element to append canvas to.
        * @param {number} width
        * @param {number} height
        * @param {string=} opt_classname
        * @return {HTMLCanvasElement}
        */
        function createCanvas(container, width, height, opt_classname) {
            const canvas =
            /** @type {!HTMLCanvasElement} */ (document.createElement('canvas'));
            canvas.className = Runner.classes.CANVAS;
            canvas.width = width;
            canvas.height = height;
            container.appendChild(canvas);
            return canvas;
        }
        /**
        * Decodes the base 64 audio to ArrayBuffer used by Web Audio.
        * @param {string} base64String
        */
        function decodeBase64ToArrayBuffer(base64String) {
            const len = (base64String.length / 4) * 3;
            const str = atob(base64String);
            const arrayBuffer = new ArrayBuffer(len);
            const bytes = new Uint8Array(arrayBuffer);
            for (let i = 0; i < len; i++) {
            bytes[i] = str.charCodeAt(i);
        }
            return bytes.buffer;
        }
        //******************************************************************************
        /**
        * Check for a collision.
        * @param {!Obstacle} obstacle
        * @param {!Trex} tRex T-rex object.
        * @param {CanvasRenderingContext2D=} opt_canvasCtx Optional canvas context for
        *    drawing collision boxes.
        * @return {Array<CollisionBox>|undefined}
        */
        function checkForCollision(obstacle, tRex, opt_canvasCtx) {
            Runner.defaultDimensions.WIDTH + obstacle.xPos;
            // Adjustments are made to the bounding box as there is a 1 pixel white
            // border around the t-rex and obstacles.
            const tRexBox = new CollisionBox(tRex.xPos + 1, tRex.yPos + 1, tRex.config.WIDTH - 2, tRex.config.HEIGHT - 2);
            const obstacleBox = new CollisionBox(obstacle.xPos + 1, obstacle.yPos + 1, obstacle.typeConfig.width * obstacle.size - 2, obstacle.typeConfig.height - 2);
            // Simple outer bounds check.
            if (boxCompare(tRexBox, obstacleBox)) {
            const collisionBoxes = obstacle.collisionBoxes;
            let tRexCollisionBoxes = [];
            if (Runner.isAltGameModeEnabled()) {
            tRexCollisionBoxes = Runner.spriteDefinition.TREX.COLLISION_BOXES;
        }
            else {
            tRexCollisionBoxes = tRex.ducking ? Trex.collisionBoxes.DUCKING :
            Trex.collisionBoxes.RUNNING;
        }
            // Detailed axis aligned box check.
            for (let t = 0; t < tRexCollisionBoxes.length; t++) {
            for (let i = 0; i < collisionBoxes.length; i++) {
            // Adjust the box to actual positions.
            const adjTrexBox = createAdjustedCollisionBox(tRexCollisionBoxes[t], tRexBox);
            const adjObstacleBox = createAdjustedCollisionBox(collisionBoxes[i], obstacleBox);
            const crashed = boxCompare(adjTrexBox, adjObstacleBox);
            if (crashed) {
            return [adjTrexBox, adjObstacleBox];
        }
        }
        }
        }
        }
        /**
        * Adjust the collision box.
        * @param {!CollisionBox} box The original box.
        * @param {!CollisionBox} adjustment Adjustment box.
        * @return {CollisionBox} The adjusted collision box object.
        */
        function createAdjustedCollisionBox(box, adjustment) {
            return new CollisionBox(box.x + adjustment.x, box.y + adjustment.y, box.width, box.height);
        }
        /**
        * Compare two collision boxes for a collision.
        * @param {CollisionBox} tRexBox
        * @param {CollisionBox} obstacleBox
        * @return {boolean} Whether the boxes intersected.
        */
        function boxCompare(tRexBox, obstacleBox) {
            let crashed = false;
            tRexBox.x;
            tRexBox.y;
            const obstacleBoxX = obstacleBox.x;
            obstacleBox.y;
            // Axis-Aligned Bounding Box method.
            if (tRexBox.x < obstacleBoxX + obstacleBox.width &&
            tRexBox.x + tRexBox.width > obstacleBoxX &&
            tRexBox.y < obstacleBox.y + obstacleBox.height &&
            tRexBox.height + tRexBox.y > obstacleBox.y) {
            crashed = true;
        }
            return crashed;
        }

        // Copyright 2013 The Chromium Authors
        // Use of this source code is governed by a BSD-style license that can be
        // found in the LICENSE file.
        let showingDetails = false;
        let lastData = null;
        function toggleHelpBox() {
            showingDetails = !showingDetails;
            assert(lastData);
            j(getHtml(lastData, showingDetails), getRequiredElement('content'));
        }
        function diagnoseErrors() {
            if (window.errorPageController) {
            window.errorPageController.diagnoseErrorsButtonClick();
        }
        }
        function portalSignin() {
            if (window.errorPageController) {
            window.errorPageController.portalSigninButtonClick();
        }
        }
        // Subframes use a different layout but the same html file.  This is to make it
        // easier to support platforms that load the error page via different
        // mechanisms (Currently just iOS).
        let isSubFrame = false;
        if (window.top.location !== window.location) {
            document.documentElement.setAttribute('subframe', '');
            isSubFrame = true;
        }
        // Re-renders the error page using |data| as the dictionary of values.
        // Used by NetErrorTabHelper to update DNS error pages with probe results.
        function updateForDnsProbe(newData) {
            onTemplateDataReceived(newData);
        }
        function getMainFrameErrorCssClass(showingDetails) {
            return showingDetails ? 'showing-details' : '';
        }
        function getMainFrameErrorIconCssClass(data) {
            return isSubFrame ? '' : data.iconClass;
        }
        function getSubFrameErrorIconCssClass(data) {
            return isSubFrame ? data.iconClass : '';
        }
        function shouldShowSuggestionsSummaryList(data) {
            return !!data.suggestionsSummaryList &&
            data.suggestionsSummaryList.length > 0;
        }
        function getSuggestionsSummaryItemCssClass(data) {
            assert(data.suggestionsSummaryList);
            return data.suggestionsSummaryList.length === 1 ? 'single-suggestion' : '';
        }
        // Implements button clicks.  This function is needed during the transition
        // between implementing these in trunk chromium and implementing them in iOS.
        function reloadButtonClick(e) {
            const url = e.target.dataset['url'];
            if (window.errorPageController) {
            //
            //
            window.errorPageController.reloadButtonClick();
            //
        }
            else {
            assert(url);
            window.location.href = url;
        }
        }
        function downloadButtonClick() {
            if (window.errorPageController) {
            window.errorPageController.downloadButtonClick();
            const downloadButton = getRequiredElement('download-button');
            downloadButton.disabled = true;
            downloadButton.textContent = downloadButton.disabledText;
        }
        }
        function detailsButtonClick() {
            if (window.errorPageController) {
            window.errorPageController.detailsButtonClick();
        }
            toggleHelpBox();
        }
        function setAutoFetchState(scheduled, canSchedule) {
            getRequiredElement('cancel-save-page-button')
                .classList.toggle(HIDDEN_CLASS, !scheduled);
            getRequiredElement('save-page-for-later-button')
            .classList.toggle(HIDDEN_CLASS, !canSchedule);
        }
        function savePageLaterClick() {
            assert(window.errorPageController);
            window.errorPageController.savePageForLater();
            // savePageForLater will eventually trigger a call to setAutoFetchState() when
            // it completes.
        }
        function cancelSavePageClick() {
            assert(window.errorPageController);
            window.errorPageController.cancelSavePage();
            // setAutoFetchState is not called in response to cancelSavePage(), so do it
            // now.
            setAutoFetchState(false, true);
        }
        function shouldShowControlButtons(data) {
            const downloadButtonVisible = !!data.downloadButton && !!data.downloadButton.msg;
            const reloadButtonVisible = !!data.reloadButton && !!data.reloadButton.msg;
            return reloadButtonVisible || downloadButtonVisible;
        }
        function shouldShowDetailsButton(data) {
            return !!data.suggestionsDetails && data.suggestionsDetails.length > 0;
        }
        function getDetailsButtonCssClass(data) {
            return shouldShowControlButtons(data) ? '' : 'singular';
        }
        function getDetailsButtonText(data, showingDetails) {
            assert(data.details);
            assert(data.hideDetails);
            return showingDetails ? data.hideDetails : data.details;
        }
        // Sets up the proper button layout for the current platform.
        function getButtonsCssClass() {
            let primaryControlOnLeft = true;
            // clang-format off
            //
            return primaryControlOnLeft ? 'suggested-left' : 'suggested-right';
        }
        function onDocumentLoad() {
            onTemplateDataReceived(window.loadTimeDataRaw);
        }
        function onTemplateDataReceived(newData) {
            lastData = newData;
            j(getHtml(lastData, showingDetails), getRequiredElement('content'));
            if (!isSubFrame && newData.iconClass === 'icon-offline') {
            document.documentElement.classList.add('offline');
            // Set loadTimeData.data because it is used by the dino code.
            loadTimeData.data = newData;
            new Runner('.interstitial-wrapper');
        }
        }
        function getHtml(data, showingDetails) {
            // clang-format off
            return x `
    <div id="main-frame-error" class="interstitial-wrapper ${getMainFrameErrorCssClass(showingDetails)}">
      <div id="main-content">
        <div class="icon ${getMainFrameErrorIconCssClass(data)}"></div>
        <div id="main-message">
          <h1>
            <span .innerHTML="${data.heading.msg}"></span>
          </h1>
          ${data.summary ? x `
            <p .innerHTML="${data.summary.msg}"></p>
          ` : ''}

          ${shouldShowSuggestionsSummaryList(data) ? x `
            <div id="suggestions-list">
              <p>${data.suggestionsSummaryListHeader}</p>
              <ul class="${getSuggestionsSummaryItemCssClass(data)}">
                ${data.suggestionsSummaryList.map(item => x `
                  <li .innerHTML="${item.summary}"></li>
                `)}
              </ul>
            </div>
          ` : ''}

          <div class="error-code">${data.errorCode}</div>

          ${data.savePageLater ? x `
            <div id="save-page-for-later-button">
              <a class="link-button" @click="${savePageLaterClick}">
                ${data.savePageLater.savePageMsg}
              </a>
            </div>
            <div id="cancel-save-page-button" class="hidden"
                @click="${cancelSavePageClick}"
                .innerHTML="${data.savePageLater.cancelMsg}">
            </div>
          ` : ''}
        </div>
      </div>
      <div id="buttons" class="nav-wrapper ${getButtonsCssClass()}">
        <div id="control-buttons" ?hidden="${!shouldShowControlButtons(data)}">
          ${data.reloadButton ? x `
            <button id="reload-button"
                class="blue-button text-button"
                @click="${reloadButtonClick}"
                data-url="${data.reloadButton.reloadUrl}">
              ${data.reloadButton.msg}
            </button>
          ` : ''}
          ${data.downloadButton ? x `
            <button id="download-button"
                class="blue-button text-button"
                @click="${downloadButtonClick}"
                .disabledText="${data.downloadButton.disabledMsg}">
              ${data.downloadButton.msg}
            </button>
          ` : ''}
        </div>
        ${shouldShowDetailsButton(data) ? x `
          <button id="details-button" class="secondary-button text-button
              small-link ${getDetailsButtonCssClass(data)}"
              @click="${detailsButtonClick}">
            ${getDetailsButtonText(data, showingDetails)}
          </button>
        ` : ''}
      </div>
      ${data.suggestionsDetails ? x `
        <div id="details">
          ${data.suggestionsDetails.map(item => x `
            <div class="suggestions">
              <div class="suggestion-header" .innerHTML="${item.header}"></div>
              <div class="suggestion-body" .innerHTML="${item.body}"></div>
            </div>
          `)}
        </div>
      ` : ''}
    </div>
    ${data.summary ? x `
      <div id="sub-frame-error">
        <!-- Show details when hovering over the icon, in case the details are
             hidden because they're too large. -->
        <div class="icon ${getSubFrameErrorIconCssClass(data)}"></div>
        <div id="sub-frame-error-details" .innerHTML="${data.summary.msg}">
        </div>
      </div>
    ` : ''}
  `;
            // clang-format on
        }
        // Expose methods that are triggered either
        //  - By `onclick=...` handlers in the HTML code, OR
        //  - By `href="javascript:..."` in localized links.
        //  - By inected JS code coming from C++
        //
        //  since those need to be available on the 'window' object.
        Object.assign(window, {
            diagnoseErrors,
            portalSignin,
            toggleHelpBox,
            updateForDnsProbe,
        });
        document.addEventListener('DOMContentLoaded', onDocumentLoad);
        //# sourceMappingURL=neterror.rollup.js.map
