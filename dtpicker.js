/**
 * Creates DateTimePicker instance with selected options and places input inside selected div
 * 
 * @class DateTimePicker
 * @classdesc instance of DateTimePicker
 * @param {*} div - selected div
 * @param {*} options - selected options
 */
function DateTimePicker(div, options){

    var KEY0 = 48,
        KEY9 = 57,
        _KEY0 = 96,
        _KEY9 = 105,
        DEL = 46,
        ESC = 27,
        ENTER = 13,
        BACKSPACE = 8,
        ARROWLEFT = 37,
        ARROWUP = 38,
        ARROWRIGHT = 39,
        ARROWDOWN = 40,
        CTRL = 17,
        VKEY = 86,
        CKEY = 67,
        AKEY = 65,
        XKEY = 88,
        TAB = 9,
        END = 35,
        HOME = 36,
        F5 = 116;
    
    var i18n = {
        ru: {
            monthsFull: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
            monthsShort: ['ЯНВ', 'ФЕВ', 'МАР', 'АПР', 'МАЙ', 'ИЮН', 'ИЮЛ', 'АВГ', 'СЕН', 'ОКТ', 'НОЯ', 'ДЕК'],
            apply: 'Применить',
            clear: 'Очистить'
        },        
        en: {
            monthsFull: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
            monthsShort: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'],
            apply: 'Apply',
            clear: 'Clear'
        }
    };

    var me = this;
    me.div = $(div[0]);

    me.datecomponentchanged = new CustomEvent('datecomponentchanged');

    me.cfg = $.extend(
        {
            format: 'Y-m-d H:i:s',
            placeholder: '_',
            className: '',
            value: null,
            defaultYear: new Date().getFullYear(),
            defaultMonth: 1,
            defaultDate: 1,
            defaultHours: 0,
            defaultMinutes: 0,
            defaultSeconds: 0,
            invalidClass: 'invalid',
            datePicker: false,
            togglePickerOnBlur: true,
            externalTrigger: null,
            externalTriggerClass: 'active',
            closeOnDateSelect: true,
            footer: false,
            lang: 'ru'
        }, 
        options);


    /* ------------------- util methods */

    $.fn.showFlex = function () {
        $(this).css('display', 'flex');
    }

    /**
     * Removes placeholders from beginning and ending of input string
     * 
     * @param {string} string - input string
     * @returns {string} - trimmed string
     */
    var trimPlaceholders = function (string){
        //no regexp 'cause potential special chars
        var str = (string+'').split('');
        var i = 0;
        while(str[i] === me.cfg.placeholder) str[i++] = '';
        i = str.length - 1;
        while(str[i] === me.cfg.placeholder) str[i--] = '';
        return str.join('');
    };

    /**
     * Places cursor in input considering inner cursor value
     */
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
    };
   
    /**
     * Initializes input string whose value based on Date() obj
     * 
     * @param {string} mask - this.cfg.mask
     */
    var objValueToInputString = function () {
        var res = '', i;
        if (!objValue){
            var _mask = mask.split('');
            for(i in _mask){
                if (_mask[i] === me.cfg.placeholder)
                    res+=_mask[i];
            }
        }
        else {
            var str = me.cfg.format.split('');
            for (i in str){
                if (/[dmYHis]/.test(str[i])){
                    switch(str[i]){
                        case 'd':
                            res += ('0' + objValue.getDate()).slice(-2); break;
                        case 'm':
                            res += ('0' + (objValue.getMonth()+1)).slice(-2); break;
                        case 'Y':
                            res += objValue.getFullYear(); break;
                        case 'H':
                            res += ('0' + objValue.getHours()).slice(-2); break;
                        case 'i':
                            res += ('0' + objValue.getMinutes()).slice(-2); break;
                        case 's':
                            res += ('0' + objValue.getSeconds()).slice(-2); break;
                    }
                }
            }
        }
        return res;
    };
   
    /**
     * Returns position of cursor in inner representation
     * 
     * @param {number} pos - position of cursor in input
     * @returns {number} position of cursor in inner representation
     */
    var getInnerCaretPos = function(pos) {
        var txt = me.input.val().split('');
        var iPos = 0;
        while(pos--){
            if(txt[pos] >= '0' && txt[pos] <= '9' || txt[pos] === me.cfg.placeholder)
                iPos++;
        }
        return iPos;
    };
   
    /**
     * Applies string on mask
     * 
     * @returns input string applied on mask
     */
    var getInputString = function () {
        var res = makeMask().split('');
        var str = inputString.split('');
        var i = 0, j = 0;
        while(i < str.length && j < res.length){
            if(res[j] === me.cfg.placeholder)
                res[j++] = str[i++];
            else j++;
        }
        return res.join('');
    };

    /**
     * Writes Date() object using date components
     */
    var updateDateObject = function () {
        objValue = new Date(
            +dateComponents['Y'],
            +dateComponents['m'] - 1,
            +dateComponents['d'],
            +dateComponents['H'],
            +dateComponents['i'],
            +dateComponents['s']
        );
    };

    /**
     * i.e. d.m.Y => __.__.____
     * 
     * @returns mask considering format
     */
    var makeMask = function () {
        return me.cfg.format
            .replace('d', me.cfg.placeholder.repeat(2))
            .replace('m', me.cfg.placeholder.repeat(2))
            .replace('Y', me.cfg.placeholder.repeat(4))
            .replace('H', me.cfg.placeholder.repeat(2))
            .replace('i', me.cfg.placeholder.repeat(2))
            .replace('s', me.cfg.placeholder.repeat(2))
    };

    /**
     * Returns mask filled with date components positions
     * 
     * @returns mask filled with date components positions
     */
    var makeComponentString = function() {
        return me.cfg.format
            .replace('d', 'dd')
            .replace('m', 'mm')
            .replace('Y', 'YYYY')
            .replace('H', 'HH')
            .replace('i', 'ii')
            .replace('s', 'ss');
    };

    /**
     * Returns active date component
     * 
     * @param {number} pos - position of cursor in input element
     * @returns active component
     */
    var getCurrentComponent = function (pos) {
        var char = componentString[pos];
        if(!/[dmYHis]/.test(char) || typeof char === 'undefined')
            char = componentString[pos-1];
        return /[dmYHis]/.test(char) ? char : undefined;
    };

    /**
     * Returns value of selected date component
     * 
     * @param {string} component - date component
     * @returns value of selected date component
     */
    var getComponentValue = function(component){
        var cs = componentString.split('');
        var condensed = [];
        cs.forEach(function(c) {
            if(/[dmYHis]/.test(c)){
                condensed.push(c);
            }    
        });
        condensed = condensed.join('');
        var res = '';
        for(var i in inputString){
            if(condensed[i] === component)
                res+=inputString[i];
        }
        return res;
    };

    /**
     * Returns string of selected format using Date() object value
     * 
     * @param {string} format - this.cfg.format
     * @returns string of selected format using Date() object value
     */
    var formatter = function(format) {
        if(objValue === null) return '';
        return format
            .replace('d',   ('0' +  objValue.getDate()      ).slice(-2))
            .replace('m',   ('0' + (objValue.getMonth() + 1)).slice(-2))
            .replace('Y',           objValue.getFullYear()  )
            .replace('H',   ('0' +  objValue.getHours()     ).slice(-2))
            .replace('i',   ('0' +  objValue.getMinutes()   ).slice(-2))
            .replace('s',   ('0' +  objValue.getSeconds()   ).slice(-2));
    };

    /**
     * Writes values of input string into date components.
     * Triggers datecomponentchanged event, if cursor leaves active date component
     * 
     * @param {number} inputCaretPos - cursor position in input element 
     */
    var inputStringToDateComponents = function (inputCaretPos) {
        var lastComponent = currentComponent;
        currentComponent = getCurrentComponent(inputCaretPos);
        Object.keys(dateComponents).forEach(function(k) {
            dateComponents[k] = getComponentValue(k);
        });
        if (lastComponent !== currentComponent)
            me.input.trigger('datecomponentchanged', lastComponent);
    }

    /**
     * Returns true if value of selected component in valid format and range; false otherwise
     * @param {string} component - selected component 
     */
    var validateComponentValue = function (component) {
        if(dateComponents[component] === '') return false;
        var value = +dateComponents[component];
        if (isNaN(value)) return false;
        switch(component){
            case 'd':
                if(value < 1 || value > 31)
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

    /**
     * Resets value of selected component to its default
     * @param {string} component - selected component 
     */
    var setComponentDefault = function (component) {
        dateComponents[component] = ('000'+dateComponentsDefaults[component]).slice(component === 'Y' ? -4 : -2);
    }

    /**
     * Sets input string value of date components then displays it considering mask
     */
    var dateComponentsToInputString = function () {
        var str = me.cfg.format.split('');
        var res = '';
        for(var i in str){
            if(/[dmYHis]/.test(str[i]))
                res+=dateComponents[str[i]];
        }
        inputString = res;
    }

    var displayInputString = function() {
        me.input.val(getInputString());
        setInputCaretPos(innerCaretPos);
    }

    /**
     * You'll never know what it does
     */
    var clearValue = function () {
        objValue = null;
        dateComponents = {
            'd':0,
            'm':0,
            'Y':0,
            'H':0,
            'i':0,
            's':0
        };
        inputString = objValueToInputString(); 
    }

    /**
     * Toggles input class depending on all date components are in ranges
     */
    var checkValidity = function() {
        var flag = true,
            emptyVal = true;
        var c = me.cfg.format.split('').filter(function(el) {
            return /[dmYHis]/.test(el);
        });
        if (trimPlaceholders(inputString).length != 0){
            emptyVal = false;
            for (var i = 0; i < c.length; i++){
                if (!validateComponentValue(c[i])){
                    flag = false;
                    break;
                }
            }
        }
        me.input.toggleClass(me.cfg.invalidClass, !flag);
        if (me.cfg.datePicker && flag && !emptyVal) {
            navigateDatePicker('empty', new Date(dateComponents['Y'], Number(dateComponents['m'] - 1), dateComponents['d'], dateComponents['H'], dateComponents['i'], dateComponents['s']));
        }
    }

    /**
     * Returns letter of next component leaning on currentComponent value
     * 
     * @param {boolean} forward - direction of search: true if to right, false otherwise
     */
    var getNextComponent = function (forward) {
        var char = currentComponent;
        var str = me.cfg.format.split('');
        var i = str.indexOf(char);
        if (forward) {
            do {
                if (i < str.length - 1)
                    char = str[++i];
                if (/[dmYHis]/.test(char)) break;
            } while(i < str.length);
        }
        else {
            do {
                if (i)
                    char = str[--i];
                if(/[dmYHis]/.test(char)) break;
            } while(i);
        }
        return char;
    }

    /**
     * Returns position of first date component symbol in formatted string
     * 
     * @returns first symbol positions
     */
    var navigateComponent = function (component) {
        var str = componentString.split(''),
            sStart = str.indexOf(component);
        for (var sEnd = sStart; sEnd < str.length; sEnd++)
            if (str[sEnd] !== component) break;
        me.input[0].setSelectionRange(sStart, sEnd);  
        return sStart;
    }

    var incComponentValue = function () {
        if (!(objValue instanceof Date) || isNaN(objValue)){
            objValue = new Date();
        }
        var d = objValue.getDate(),
            m = objValue.getMonth(),
            y = objValue.getFullYear(),
            h = objValue.getHours(),
            i = objValue.getMinutes(),
            s = objValue.getSeconds();
        switch(currentComponent){
            case 'd': 
                objValue = new Date(y, m, d+1, h, i, s);
                break;
            case 'm': 
                objValue = new Date(y, m+1, d, h, i, s);
                break;
            case 'Y': 
                objValue = new Date(y+1, m, d, h, i, s);
                break;
            case 'H': 
                objValue = new Date(y, m, d, h+1, i, s);
                break;
            case 'i': 
                objValue = new Date(y, m, d, h, i+1, s);
                break;
            case 's': 
                objValue = new Date(y, m, d, h, i, s+1);
                break;
        }
        inputString = objValueToInputString();
        inputStringToDateComponents(me.input[0].selectionStart);
        displayInputString();
        navigateComponent(currentComponent);
        navigateDatePicker('empty', objValue);
    }

    var decComponentValue = function () {
        if (!(objValue instanceof Date) || isNaN(objValue)){
            objValue = new Date();
        }
        var d = objValue.getDate(),
            m = objValue.getMonth(),
            y = objValue.getFullYear(),
            h = objValue.getHours(),
            i = objValue.getMinutes(),
            s = objValue.getSeconds();
        switch(currentComponent){
            case 'd': 
                objValue = new Date(y, m, d-1, h, i, s);
                break;
            case 'm': 
                objValue = new Date(y, m-1, d, h, i, s);
                break;
            case 'Y': 
                objValue = new Date(y-1, m, d, h, i, s);
                break;
            case 'H': 
                objValue = new Date(y, m, d, h-1, i, s);
                break;
            case 'i': 
                objValue = new Date(y, m, d, h, i-1, s);
                break;
            case 's': 
                objValue = new Date(y, m, d, h, i, s-1);
                break;
        }
        inputString = objValueToInputString();
        inputStringToDateComponents(me.input[0].selectionStart);
        displayInputString();
        navigateComponent(currentComponent);
        navigateDatePicker('empty', objValue);
    }

//----------------- DATEPICKER SECTION -------------------------------------

    /**
     * Displays required grid and header
     * 
     * @param {string} state - empty, month, year, decade
     * @param {Date} date 
     */
    var navigateDatePicker = function (state, date) {
        if (me.cfg.datePicker !== true) return;
        me.datePicker.date = date;
        var d = date.getDate(),
            m = date.getMonth(),
            y = date.getFullYear(),
            h = date.getHours(),
            i = date.getMinutes(),
            s = date.getSeconds();
        me.datePicker.div.find('span').off('.dtpicker_header');
        me.datePicker.div.find('.dtpicker_grid').children().hide();
        me.datePicker.div.find('.today').on('click.dtpicker_header', function(){
            navigateDatePicker('month', new Date());
        })
        switch(state){
            case 'empty':
            case 'month':
                me.datePicker.div.find('.text')
                    .html(i18n[me.cfg.lang].monthsFull[date.getMonth()] + ' '+ y)
                    .removeClass('stop')
                    .on('click.dtpicker_header', function () {
                        navigateDatePicker('year', date);
                    });
                me.datePicker.div.find('.prev')
                    .on('click.dtpicker_header', function () {
                        navigateDatePicker('month', new Date(y, m-1, d, h, i, s));
                    });
                me.datePicker.div.find('.next')
                    .on('click.dtpicker_header', function () {
                        navigateDatePicker('month', new Date(y, m+1, d, h, i, s));
                    });
                displayDayGrid(date);
                break;
            case 'year':
                me.datePicker.div.find('.text')
                    .html(y)
                    .removeClass('stop')
                    .on('click.dtpicker_header', function () {
                        navigateDatePicker('decade', date);
                    });
                me.datePicker.div.find('.prev')
                    .on('click.dtpicker_header', function () {
                        navigateDatePicker('year', new Date(y-1, m, d, h, i, s));
                    });
                me.datePicker.div.find('.next')
                    .on('click.dtpicker_header', function () {
                        navigateDatePicker('year', new Date(y+1, m, d, h, i, s));
                    });
                displayMonthGrid(date);
                break;
            case 'decade':
                me.datePicker.div.find('.text')
                    .html(Math.floor(y/10)*10 + ' - ' + (Math.floor(y/10)*10+10))
                    .addClass('stop');
                me.datePicker.div.find('.prev')
                    .on('click.dtpicker_header', function () {
                        navigateDatePicker('decade', new Date(y-10, m, d, h, i, s));
                    });
                me.datePicker.div.find('.next')
                    .on('click.dtpicker_header', function () {
                        navigateDatePicker('decade', new Date(y+10, m, d, h, i, s));
                    });
                displayYearGrid(date);
                break;
        }
        if (state !== 'empty') setValue(date);
    }

    /**
     * Displays day grid
     * 
     * @param {Date} date - selected date 
     */
    var displayDayGrid = function(date){
        me.datePicker.div.find('.dtpicker_grid .day').off('.dtpicker_grid').removeClass('selected prevMonth nextMonth');
        me.datePicker.div.find('.day_grid').showFlex();
        var y = date.getFullYear(), 
            m = date.getMonth(),
            today = date.getDate(),
            h = date.getHours(),
            min = date.getMinutes(),
            s = date.getSeconds(),
            first = new Date(y, m, 1).getDay(),
            lastPrev = new Date(y, m, 0).getDate(),
            thisMonthDays = new Date(y, m + 1, 0).getDate();
            first = first ? first - 1 : 6;
        var prevMonthOffset = first ? 0 : 1;
        for(var i = 0; i < first + 7*prevMonthOffset; i++)
            me.datePicker.dayGrid[0][first + 7*prevMonthOffset - i - 1].html(lastPrev - i)
                .addClass('prevMonth')
                .on('click.dtpicker_grid', function () {
                    var date = new Date(y, m-1, Number($(this).html()), h, min, s);
                    navigateDatePicker('month', date);
                    if(me.cfg.closeOnDateSelect) me.datePicker.div.hide();
                });
        for(var d = 0; d < thisMonthDays; d++){
            me.datePicker.dayGrid[Math.floor((first + d)/7)+prevMonthOffset][(first+d)%7]
                .html(d+1)
                .toggleClass('selected', today === d + 1)
                .on('click.dtpicker_grid', function () {
                    var date = new Date(y, m, Number($(this).html()), h, min, s);
                    me.datePicker.date = date;
                    setValue(date);
                    if(me.cfg.closeOnDateSelect) {
                        me.datePicker.div.hide();
                        if (me.cfg.externalTrigger)
                            me.cfg.externalTrigger.toggleClass(me.cfg.externalTriggerClass, false);
                    }
                    else {
                        $('.dtpicker_grid .selected').removeClass('selected');
                        $(this).addClass('selected');
                    }
                }); 
        }
        for(d, i = 1; i < 43 - thisMonthDays - first - 7*prevMonthOffset; d++, i++){
            me.datePicker.dayGrid[Math.floor((first + d)/7)+prevMonthOffset][(first+d)%7]
                .html(i)
                .addClass('nextMonth')
                .on('click.dtpicker_grid', function () {
                    var date = new Date(y, m+1, $(this).html(), h, min, s);
                    navigateDatePicker('month', date);
                    if(me.cfg.closeOnDateSelect) me.datePicker.div.hide();
                });
        }
    }

    /**
     * Displays month grid
     * 
     * @param {Date} date - selected date 
     */
    var displayMonthGrid = function(date){
        var y = date.getFullYear(),
            m = date.getMonth(),
            d = date.getDate(),
            h = date.getHours(),
            i = date.getMinutes(),
            s = date.getSeconds();
        me.datePicker.div.find('.month_grid').show();
        for(var j = 0; j < 4; j++) {
            me.datePicker.monthGrid[0][j]
                .html(i18n[me.cfg.lang].monthsShort[j+8])
                .addClass('prevYear')
                .data('target-month', j+8)
                .on('click.dtpicker_grid', function () {
                    navigateDatePicker('month', new Date(y-1, $(this).data('target-month'), d, h, i, s));
                });
            me.datePicker.monthGrid[4][j]
                .html(i18n[me.cfg.lang].monthsShort[j])
                .addClass('nextYear')
                .data('target-month', j)
                .on('click.dtpicker_grid', function () {
                    navigateDatePicker('month', new Date(y+1, $(this).data('target-month'), d, h, i, s));
                });
        }
        for(j = 0; j < 12; j++)
            me.datePicker.monthGrid[1+Math.floor(j / 4)][j % 4]
                .html(i18n[me.cfg.lang].monthsShort[j])
                .toggleClass('selected', j === m)
                .data('target-month', j)
                .on('click.dtpicker_grid', function (){
                    navigateDatePicker('month', new Date(y, $(this).data('target-month'), d, h, i, s));
                });
    }

    /**
     * Displays year grid
     * 
     * @param {Date} date - selected date 
     */
    var displayYearGrid = function(date){
        var y = date.getFullYear(),
            m = date.getMonth(),
            d = date.getDate(),
            h = date.getHours(),
            i = date.getMinutes(),
            s = date.getSeconds();
        var decade = Math.floor(y/10)*10;
        me.datePicker.div.find('.year_grid').show();
        for(var j = 0; j < 3; j++){
            me.datePicker.yearGrid[0][j]
                .html(decade - (3 - j))
                .addClass('prevDecade')                
                .on('click.dtpicker_grid', function (){
                    navigateDatePicker('year', new Date(Number($(this).html()), m, d, h, i, s));
                });
            me.datePicker.yearGrid[3][j+1]
                .html(decade + 10 + j)
                .addClass('nextDecade')                
                .on('click.dtpicker_grid', function (){
                    navigateDatePicker('year', new Date(Number($(this).html()), m, d, h, i, s));
                });
        }
        for(j = 0; j < 10; j++){
            me.datePicker.yearGrid[Math.floor((j+3)/4)][(j+3)%4]
                .html(decade+j)
                .toggleClass('selected', decade + j === y)
                .on('click.dtpicker_grid', function (){
                    navigateDatePicker('year', new Date(Number($(this).html()), m, d, h, i, s));
                });
        }
    }

    /**
     * Append DOM object containing day controls for 'month' or 'empty' state 
     *  
     * @returns array 7 x 6 of Nodes
     */
    var initDayGrid = function(){
        var dayGrid = $('<div class="day_grid"></div>').appendTo(me.datePicker.div.find('.dtpicker_grid')[0]);
        var arr = [];
        for(var w = 0; w < 6; w++){
            arr[w] = [];
            for(var d = 0; d < 7; d++)
                arr[w][d] = $('<div class="day"></div>').appendTo(dayGrid);
        }
        return arr;
    }

    /**
     * Append DOM object containing month controls for 'year' state
     * 
     * @returns array 5 x 4 of Nodes
     */
    var initMonthGrid = function(){
        var monthGrid = $('<div class="month_grid"></div>').appendTo(me.datePicker.div.find('.dtpicker_grid')[0]);
        var arr = [];
        for(var i = 0; i < 5; i++){
            arr[i] = [];
            for(var j = 0; j < 4; j++)
                arr[i][j] = $('<div class="month"></div>').appendTo(monthGrid);
        }
        return arr;
    }

    /**
     * Append DOM object containing years controls for 'decade' state
     * 
     * @returns array 4 x 4 of Nodes
     */
    var initYearGrid = function(){
        var yearGrid = $('<div class="year_grid"></div>').appendTo(me.datePicker.div.find('.dtpicker_grid')[0]);
        var arr = [];
        for(var i = 0; i < 4; i++){
            arr[i] = [];
            for(var j = 0; j < 4; j++)
                arr[i][j] = $('<div class="year"></div>').appendTo(yearGrid);
        }
        return arr;
    }

    /**
     * Some DOM manipulations to append picker element
     */
    var appendDatePicker = function () {
        me.div.css('position', 'relative');
        me.datePicker = {};
        me.datePicker.div = $('<div class="dtpicker_datepicker"><header></header><div class="dtpicker_grid"></div></div>')
            .appendTo(me.div)
            .css('top', me.input.outerHeight(true)+'px')
            .css('left', me.input.position().left+'px');
        me.datePicker.header = $('<span class="prev"></span><span class="today"></span><span class="text"></span><span class="next"></span<span>')
            .appendTo(me.datePicker.div.find('header'));
        me.datePicker.dayGrid = initDayGrid();
        me.datePicker.monthGrid = initMonthGrid();
        me.datePicker.yearGrid = initYearGrid();
        if(me.cfg.footer){
            me.datePicker.footer = $('<footer></footer>').appendTo(me.datePicker.div);
            me.datePicker.applyBtn = $('<span class="apply"></span>').html(i18n[me.cfg.lang].apply).appendTo(me.datePicker.footer);
            me.datePicker.clearBtn = $('<span class="clear"></span>').html(i18n[me.cfg.lang].clear).appendTo(me.datePicker.footer);
        }
        if (me.cfg.value instanceof Date && !isNaN(me.cfg.value)) {
            var val = me.cfg.value;
            var state = 'month';
        }
        else { 
            val = new Date();
            state = 'empty';
        }
        navigateDatePicker(state, val);
    }

    /** Inner state */
    var objValue = me.cfg.value, //DateTime object or null
        mask = makeMask(),
        inputString = objValueToInputString(),
        componentString = makeComponentString(),

        inputStringLength = inputString.length,
        
        innerCaretPos = 0,
        
        currentComponent = me.cfg.format[me.cfg.format.search(/[dmYHis]/)],
        dateComponentsDefaults = {
            'd': me.cfg.defaultDate     >= 1 && me.cfg.defaultDate       <= 31      ? me.cfg.defaultDate :      1,
            'm': me.cfg.defaultMonth    >= 1 && me.cfg.defaultMonth      <= 12      ? me.cfg.defaultMonth :     1,
            'Y': me.cfg.defaultYear     >= 0 && me.cfg.defaultYear       <= 9999    ? me.cfg.defaultYear :      new Date().getFullYear(),
            'H': me.cfg.defaultHours    >= 0 && me.cfg.defaultHours      <= 23      ? me.cfg.defaultHours :     0,
            'i': me.cfg.defaultMinutes  >= 0 && me.cfg.defaultMinutes    <= 59      ? me.cfg.defaultMinutes :   0,
            's': me.cfg.defaultSeconds  >= 0 && me.cfg.defaultSeconds    <= 59      ? me.cfg.defaultSeconds :   0,
        },
        dateComponents = {
            'd':0,
            'm':0,
            'Y':0,
            'H':0,
            'i':0,
            's':0
        },

        gotClicked = false;

            
    /* ------------------- html stuff */

    me.input = $('<input type="text" >')
        .appendTo(me.div)
        .addClass(me.cfg.className)
        .val(getInputString());

    if (me.cfg.datePicker === true) {
        appendDatePicker();
    }

    inputStringToDateComponents(0);

    /* ------------------- public methods */

    function debug() {
        return {
            inputString: inputString,
            components: JSON.stringify(dateComponents),
            currentComponent: currentComponent,
            innerCaretPos: innerCaretPos,
            objValue: objValue
        };
    } 
    me.debug = debug;

    /**
     * Returns picker value with selected representation
     * @param {string} type - 'date' for Date() object; 'text' for string in selected format  
     */
    function getValue(type) {
        //at final
        type = type || 'text';
        switch(type) {
            case 'text':
                return formatter(me.cfg.format);
            case 'date':
                return objValue;
            default:
                return formatter(me.cfg.format);
        }
    }
    me.getValue = getValue;

    /**
     * Sets all inner representations up to selected date
     * @param {Date} date - selected date
     */
    function setValue(date) {
        if (date instanceof Date && !isNaN(date)){
            objValue = date;
            inputString = objValueToInputString();
            inputStringToDateComponents(0);
            me.input.val(getInputString());
        }
        else clearValue();    
    }
    me.setValue = setValue;

    /**
     * Returns date in selected representation
     * 
     * @param {string} format - selected representation
     * @returns date in selected representation
     */
    function getFormattedValue(format){
        return formatter(format);
    }
    me.getFormattedValue = getFormattedValue;

    function setPickerPosition(position){
        if(me.cfg.datePicker) {
            if (position.left !== undefined)
                me.datePicker.div.css('left', position.left);
            if (position.top !== undefined)
                me.datePicker.div.css('top', position.top);    
        }
    }
    me.setPickerPosition = setPickerPosition;

    me.showDatePicker = function() { me.datePicker.div.show(); }
    me.hideDatePicker = function() { me.datePicker.div.hide(); }
    /* ------------------- event listeners */

    if(me.cfg.datePicker){
        me.datePicker.div.on('mousedown.dtpicker', function (){
            gotClicked = true;
        });
        if(me.cfg.externalTrigger !== null)
            $(me.cfg.externalTrigger).on('click.dtpicker', function (){
                $(this).toggleClass(me.cfg.externalTriggerClass);
                if($(this).hasClass(me.cfg.externalTriggerClass))
                    me.datePicker.div.show();
                else
                    me.datePicker.div.hide();
            });
        if(me.cfg.footer){
            me.datePicker.clearBtn.on('click.dtpicker', function (){
                clearValue();
                me.input.val(mask);
            });
            me.datePicker.applyBtn.on('click.dtpicker', function(){
                setValue(me.datePicker.date);
                me.datePicker.div.hide();
                if (me.cfg.externalTrigger)
                    me.cfg.externalTrigger.toggleClass(me.cfg.externalTriggerClass, false);
            });
        }
    }
    me.input.on('keydown.dtpicker', function(e){
        var k = e.keyCode;
        if (k === F5 || k === TAB || k === CTRL || 
            (k === VKEY && e.ctrlKey) ||
            (k === CKEY && e.ctrlKey) ||
            (k === XKEY && e.ctrlKey) ||
            (k === AKEY && e.ctrlKey)
            )
            return;

        e.preventDefault();

        var inputCaretPos = this.selectionStart;
        var selectionEnd = getInnerCaretPos(this.selectionEnd);

        if(k === HOME) {
            innerCaretPos = 0;
            setInputCaretPos(innerCaretPos)
            inputStringToDateComponents(this.selectionStart);
        }
        else if (k === ESC){
            if(me.cfg.datePicker){
                if (me.datePicker.div.css('display') === 'none'){
                    me.datePicker.div.show();
                    if (me.cfg.externalTrigger !== null)
                        me.cfg.externalTrigger.toggleClass(me.cfg.externalTriggerClass, true);
                }
                else{
                    me.datePicker.div.hide();
                    if (me.cfg.externalTrigger !== null)
                        me.cfg.externalTrigger.toggleClass(me.cfg.externalTriggerClass, false);
                }
            }
        }
        else if (k === END) {
            innerCaretPos = inputStringLength;
            setInputCaretPos(innerCaretPos)
            inputStringToDateComponents(this.selectionStart);
        }
        else if(k === ARROWLEFT || k === ARROWRIGHT || k === ARROWUP || k === ARROWDOWN){
            switch(k){
                case ARROWLEFT:
                    if (e.ctrlKey)
                        inputCaretPos = navigateComponent(getNextComponent(false));
                    else
                        if(inputCaretPos !== this.selectionEnd)
                            this.setSelectionRange(inputCaretPos, inputCaretPos);
                        else
                            if(innerCaretPos){
                                inputCaretPos--;
                                this.setSelectionRange(inputCaretPos, inputCaretPos);
                            }
                    break;
                case ARROWRIGHT:
                    if (e.ctrlKey)
                        inputCaretPos = navigateComponent(getNextComponent(true));
                    else
                        if(inputCaretPos !== this.selectionEnd) 
                            this.setSelectionRange(this.selectionEnd, this.selectionEnd);
                        else
                            if(innerCaretPos < inputStringLength){
                                inputCaretPos++;
                                this.setSelectionRange(inputCaretPos, inputCaretPos);
                            } 
                    break;
                case ARROWUP:
                    incComponentValue();
                    break;
                case ARROWDOWN:
                    decComponentValue();
                    break;
            }
            inputStringToDateComponents(inputCaretPos);
            innerCaretPos = getInnerCaretPos(inputCaretPos);
        }
        else if (k === ENTER){
            var i = this.selectionStart;
            gotClicked = true;
            me.input.trigger('blur');
            me.input.focus();
            this.selectionStart = i;
        }
        else if((k >= KEY0 && k <= KEY9) || (k >= _KEY0 && k <= _KEY9) || k === DEL || k === BACKSPACE){
            var str = inputString.split('');
            if(k >= KEY0 && k <= KEY9 || k >= _KEY0 && k <= _KEY9){
                if(innerCaretPos < inputStringLength){
                    str[innerCaretPos++] = e.key;
                    for(var i = innerCaretPos; i < selectionEnd && i < inputStringLength; i++)       
                        str[i] = me.cfg.placeholder;
                    inputString = str.join('');
                    inputStringToDateComponents(inputCaretPos+1);
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
                    inputStringToDateComponents(inputCaretPos+1);
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
                inputStringToDateComponents(newPos);
            }  
            inputString = inputString.substring(0, inputStringLength);
            if(!trimPlaceholders(inputString).length) clearValue();
            me.input.val(getInputString());
            setInputCaretPos(innerCaretPos+1);
            checkValidity();
        }
    });
    me.input.on('focus.dtpicker', function(){
        if(me.cfg.datePicker && me.cfg.togglePickerOnBlur)
            me.datePicker.div.show();
    });
    me.input.on('click.dtpicker', function () {
        var inputCaretPos = this.selectionStart;
        innerCaretPos = getInnerCaretPos(inputCaretPos);
        inputStringToDateComponents(inputCaretPos);
    });
    me.input.on('paste.dtpicker', function () {
        //TODO: try work with Date() object
        var clipboardData = event.clipboardData || event.originalEvent.clipboardData || window.clipboardData,
            pastedData = clipboardData.getData('text').split('');
        var selectionStart = getInnerCaretPos(this.selectionStart),
            selectionEnd = getInnerCaretPos(this.selectionEnd);
        var str = inputString.split('');
        var approvedToPaste = [];
        for (var i in pastedData)
            if(/[0-9]/.test(pastedData[i]))
                approvedToPaste.push(pastedData[i])
        if(selectionStart === selectionEnd){
            var before = str.slice(0, selectionStart);
            var after = str.slice(selectionStart);
            str = before.concat(approvedToPaste, after).slice(0, inputStringLength);
        }
        else 
            for(var i in approvedToPaste)
                if (selectionStart < selectionEnd)
                    str[selectionStart++] = approvedToPaste[i];
        inputString = str.join('');
        inputStringToDateComponents();
        updateDateObject();
        innerCaretPos = selectionStart;
    });
    me.input.on('select.dtpicker', function() {
        innerCaretPos = getInnerCaretPos(this.selectionStart);
    });
    me.input.on('datecomponentchanged.dtpicker', function(e, comp){
        var comp_value = dateComponents[comp] + '';
        if(trimPlaceholders(comp_value).length)
            if(comp_value.includes(me.cfg.placeholder))
                dateComponents[comp] = ('000' + trimPlaceholders(comp_value)).slice(comp === 'Y' ? -4 : -2);
        updateDateObject();
        dateComponentsToInputString();
    });
    me.input.on('blur.dtpicker', function () {
        if(!trimPlaceholders(inputString).length) clearValue();
        else {
            $(this).trigger('datecomponentchanged.dtpicker', currentComponent);
            var comps = Object.keys(dateComponents);
            for(var c in comps){
                if(!validateComponentValue(comps[c])){
                    setComponentDefault(comps[c]);
                }
            }     
            dateComponentsToInputString();
            displayInputString();
            updateDateObject();
        }
        checkValidity();
        if(me.cfg.datePicker && me.cfg.togglePickerOnBlur) {
            setTimeout(function(){
                if(!gotClicked)
                    me.datePicker.div.hide();
                else
                    gotClicked = false;
            }, 20);
        }
    });
}