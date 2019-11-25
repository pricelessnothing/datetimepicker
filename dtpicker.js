function DateTimePicker(div, options){

    var KEY0 = 48,
        KEY9 = 57,
        _KEY0 = 96,
        _KEY9 = 105,
        DEL = 46,
        ENTER = 13,
        ESC = 27,
        BACKSPACE = 8,
        ARROWLEFT = 37,
        ARROWUP = 38,
        ARROWRIGHT = 39,
        ARROWDOWN = 40,
        TAB = 9,
        F5 = 116,
        AKEY = 65,
        CKEY = 67,
        VKEY = 86,
        XKEY = 90

    var me = this;
    me.div = $(div[0]);

    me.datecomponentchanged = new CustomEvent('datecomponentchanged', {
        // 'prevComponent' : 'undefined'
    });

    me.cfg = $.extend(
        {
            format: 'Y-m-d H:i:s',
            placeholder: '_'
        }, 
        options);


    /* ------------------- util methods */

    var trimPlaceholders = function (string){
        //no regexp 'cause potential special chars
        var str = string.split('');
        var i = 0;
        while(str[i] === me.cfg.placeholder) str[i++] = '';
        i = str.length - 1;
        while(str[i] === me.cfg.placeholder) str[i--] = '';
        return str.join('');
    } 

    var setInputCaretPos = function () {
        if (innerCaretPos === 0)
            me.input[0].setSelectionRange(0,0);
        else {
            var k = 0, i = 0;
            for(i in mask){
                if (mask[i] === me.cfg.placeholder) k++;
                if (k === innerCaretPos) break;
            }
            me.input[0].setSelectionRange(+i+1,+i+1);
        }
    }
   
    var initInputString = function (mask) {
        var res = '', mask = mask.split('');
        for(i in mask){
            if (mask[i] === me.cfg.placeholder)
                res+=mask[i];
        }
        return res;
    }
   
    var getInnerCaretPos = function(pos) {
        var txt = me.input.val().split('');
        var iPos = 0;
        while(pos--){
            if(txt[pos] >= '0' && txt[pos] <= '9' || txt[pos] === me.cfg.placeholder)
            iPos++;
        }
        return iPos;
    }
   
    var applyOnMask = function () {
        var res = makeMask().split('');
        var str = inputString.split('');
        var i = 0, j = 0;
        while(i < str.length && j < res.length){
            if(res[j] === me.cfg.placeholder)
                res[j++] = str[i++];
            else j++;
        }
        return res.join('');
    }

    var updateDateObject = function () {
        objValue = new Date(
            +dateComponents['Y'],
            +dateComponents['m'] - 1,
            +dateComponents['d'],
            +dateComponents['H'],
            +dateComponents['i'],
            +dateComponents['s']
        );
    }
  
    var makeMask = function () {
        return me.cfg.format
            .replace('d', me.cfg.placeholder.repeat(2))
            .replace('m', me.cfg.placeholder.repeat(2))
            .replace('Y', me.cfg.placeholder.repeat(4))
            .replace('H', me.cfg.placeholder.repeat(2))
            .replace('i', me.cfg.placeholder.repeat(2))
            .replace('s', me.cfg.placeholder.repeat(2))
    }

    var makeComponentString = function() {
        return me.cfg.format
            .replace('d', 'dd')
            .replace('m', 'mm')
            .replace('Y', 'YYYY')
            .replace('H', 'HH')
            .replace('i', 'ii')
            .replace('s', 'ss');
    }

    var getCurrentComponent = function (pos) {
        var char = componentString[pos];
        if(!/[dmYHis]/.test(char) || typeof char === "undefined")
            char = componentString[pos-1];
        return /[dmYHis]/.test(char) ? char : "undefined";
    }

    var getComponentValue = function(component){
        var cs = componentString.split('');
        var condensed = [];
        cs.forEach(function(c) {
            if(/[dmYHis]/.test(c)){
                condensed.push(c);
            }    
        });
        condensed = condensed.join('');
        res = '';
        for(var i in inputString){
            if(condensed[i] === component)
                res+=inputString[i];
        }
        return res;
    }

    var formatter = function() {
        if(objValue === null) return false;
        return me.cfg.format
            .replace('d',   ('0' +  objValue.getDate()      ).slice(-2))
            .replace('m',   ('0' +  objValue.getMonth()     ).slice(-2))
            .replace('Y',           objValue.getFullYear()  )
            .replace('H',   ('0' +  objValue.getHours()     ).slice(-2))
            .replace('i',   ('0' +  objValue.getMinutes()   ).slice(-2))
            .replace('s',   ('0' +  objValue.getSeconds()   ).slice(-2));
    }
    
    var updateComponents = function (inputCaretPos) {
        var lastComponent = currentComponent;
        currentComponent = getCurrentComponent(inputCaretPos);
        Object.keys(dateComponents).forEach(function(k) {
            dateComponents[k] = getComponentValue(k);
        });
        if (lastComponent !== currentComponent)
            me.input.trigger('datecomponentchanged', lastComponent);
    }

    var validateComponentValue = function (component) {
        if(dateComponents[component] === '') return false;
        var value = +dateComponents[component];
        if (value === "NaN") return false;
        switch(component){
            case 'd':
                if(value < 0 || value > 31)
                    return false;
                break;
            case 'm':
                if(value < 1 || value > 12)
                    return false;
                break;
            case 'Y':
                if(value < 0 || value > 9999)
                    return false;
                break;
            case 'H':
                if(value < 0 || value > 24)
                    return false;
                break;
            case 'i':
            case 's':
                if(value < 0 || value > 59)
                    return false;
                break;
        }
        return true;
    }

    var setComponentDefault = function (component) {
        dateComponents[component] = ('000'+dateComponentsDefaults[component]).slice(component === 'Y' ? -4 : -2);
    }

    var syncFromDateComponents = function () {
        var str = me.cfg.format.split('');
        var res = '';
        for(var i in str){
            if(/[dmYHis]/.test(str[i]))
                res+=dateComponents[str[i]];
        }
        inputString = res;
        me.input.val(applyOnMask());
        setInputCaretPos(innerCaretPos);
    }

    var clearValue = function () {
        dateComponents = {
            'd':0,
            'm':0,
            'Y':0,
            'H':0,
            'i':0,
            's':0
        };
        inputString = initInputString(mask);
        objValue = null;
    }

    /** Inner state */
    var objValue = null, //DateTime object or null
        mask = makeMask(),
        inputString = initInputString(mask),
        componentString = makeComponentString(),

        inputStringLength = inputString.length,
        
        innerCaretPos = 0,
        
        currentComponent = me.cfg.format[me.cfg.format.search(/[dmYHis]/)],
        dateComponentsDefaults = {
            'd':0,
            'm':1,
            'Y':new Date().getFullYear(),
            'H':0,
            'i':0,
            's':0
        },
        dateComponents = {
            'd':0,
            'm':0,
            'Y':0,
            'H':0,
            'i':0,
            's':0
        };


            
    /* ------------------- html stuff */

    me.input = $('<input type="text" >')
        .appendTo(me.div)
        .val(applyOnMask());

    /* ------------------- public methods */
    me.getDateTime = function () {
        return objValue;
    }

    me.getValue = function () {
        //at final
        //return formatter(objValue);

        //testing
        return {
            str: inputString,
            pos: innerCaretPos,
            cur: currentComponent,
            comp: JSON.stringify(dateComponents),
            date: objValue
        };
    }





    /* ------------------- event listeners */

    me.input.on('keydown', function(e){
        var k = e.keyCode;
        if (!k === F5)
            e.preventDefault();

        var inputCaretPos = this.selectionStart;
        var selectionEnd = getInnerCaretPos(this.selectionEnd);

        if(k === ARROWLEFT || k === ARROWRIGHT || k === ARROWUP || k === ARROWDOWN){
            //TODO: inc/dec component value if ctrl-up, ctrl-down
            //TODO: switch components if ctrl-left, ctrl-right      
            switch(k){
                case ARROWLEFT:
                    if(innerCaretPos) inputCaretPos--;
                    break;
                case ARROWRIGHT:
                    if(innerCaretPos < inputStringLength) inputCaretPos++;
                    break;
            }
            updateComponents(inputCaretPos);
            innerCaretPos = getInnerCaretPos(inputCaretPos);
        }
        else if((k >= KEY0 && k <= KEY9) || (k >= _KEY0 && k <= _KEY9) || k === DEL || k === BACKSPACE){
            var str = inputString.split('');
            if(k >= KEY0 && k <= KEY9 || k >= _KEY0 && k <= _KEY9){
                if(innerCaretPos < inputStringLength){
                    str[innerCaretPos++] = e.key;
                    for(var i = innerCaretPos; i < selectionEnd && i < inputStringLength; i++)       
                        str[i] = me.cfg.placeholder;
                    inputString = str.join('');
                    updateComponents(inputCaretPos+1);
                }
            }
            else if(k===DEL){
                //TODO: del to component end if ctrl
                if(innerCaretPos < inputStringLength){
                    if(innerCaretPos !== selectionEnd)
                        for(innerCaretPos; innerCaretPos < selectionEnd; innerCaretPos++)
                            str[innerCaretPos] = me.cfg.placeholder;
                    else
                        str[innerCaretPos++] = me.cfg.placeholder;
                    inputString = str.join('');
                    updateComponents(inputCaretPos+1);
                }
            }
            else if(k===BACKSPACE){
                //TODO: del to component start if ctrl          
                if (innerCaretPos !== selectionEnd){
                    var i = innerCaretPos;
                    for(innerCaretPos; innerCaretPos < selectionEnd; innerCaretPos++){
                        str[innerCaretPos] = me.cfg.placeholder;
                    }
                    innerCaretPos = i;
                }
                else
                    if(innerCaretPos) str[--innerCaretPos] = me.cfg.placeholder;
                inputString = str.join('');
                var newPos = inputCaretPos > 1 ? inputCaretPos - 2 : inputCaretPos - 1;
                if(newPos < 0) newPos = 0;
                updateComponents(newPos);
            }  
        }
        inputString = inputString.substring(0, inputStringLength);
        if(!trimPlaceholders(inputString).length) clearValue();
    });

    me.input.on('click', function () {
        var inputCaretPos = this.selectionStart;
        innerCaretPos = getInnerCaretPos(inputCaretPos);
        updateComponents(inputCaretPos);
    });
    me.input.on('input', function () {
        me.input.val(applyOnMask());
        setInputCaretPos(innerCaretPos+1);
    });
    me.input.on('paste', function () {
        //TODO: try work with Date() object
        //TODO: work with no selection
        var clipboardData = event.clipboardData || event.originalEvent.clipboardData || window.clipboardData,
            pastedData = clipboardData.getData('text').split('');
        var selectionStart = getInnerCaretPos(this.selectionStart),
            selectionEnd = getInnerCaretPos(this.selectionEnd);
        str = inputString.split('');
        for(i in pastedData)
            if (/[0-9]/.test(pastedData[i]) && selectionStart < selectionEnd)
                str[selectionStart++] = pastedData[i];
        inputString = str.join('');
        innerCaretPos = selectionStart;
    });
    me.input.on('select', function() {
        innerCaretPos = getInnerCaretPos(this.selectionStart);
    });
    me.input.on('datecomponentchanged', function(e, comp){
        if(comp) {
            dateComponents[comp] = trimPlaceholders(dateComponents[comp]);
            if(!validateComponentValue(comp)){
                setComponentDefault(comp);
            }
        }
        updateDateObject();
        syncFromDateComponents();
    });
    me.input.on('blur', function () {
        if(!trimPlaceholders(inputString).length) clearValue();
        else {
            //full validation
        }
    });
}