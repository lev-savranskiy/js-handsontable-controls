/*
 * jQuery handsontable Controls Widget 0.1
 *
 * Widget creates
 * - multiselect  for add show/hide columns
 * - export to CSV button (Chrome/FF/Opera only)
 *
 * Depends:
 *   - jQuery 1.4.2+
 *   - jQuery UI 1.8+
 *   - erichynds multiselect
 *   - handsontable
 *
 *
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 *
 * Copyright (c) 2014 Lev Savranskiy
 * Doc and demo http://wap7.ru/folio/handsontable-controls/
 *
 */


$(document).ready(function () {

  jQuery.widget("custom.handsontableControls", {

    options: {
      targetEl: null,
      fileNamePrefix: "Table",
      selectAll: false
    },

    availableControls: ["selector", "export"],
    initiallyVisibleIndexes: {},
    hiddenOptions: {},
    csvSep: "sep=;\n",
    /***
     * @constructor
     * @returns {boolean}
     */
    // the constructor
    _create: function () {
      // console.log("[handsontableControls _create]", this, arguments);
      var me = this;
      var i;
      this.hotEl = $(this.element[0]);

      if (!this.hotEl.attr("id")) {
        this.hotEl.uniqueId();
      }

      var check = this.checkDependencies();
      if (this.checkDependencies() === true) {
        this.createControls();
      } else {
        alert(check + " required for handsontableControls");
        return false;
      }

    },
    // the deconstructor
    _destroy: function () {
      //console.log("[handsontableControls _destroy]", this, arguments);

      if (this.options.targetEl) {
        this.options.targetEl.html("");
      } else {
        this.getContainer().html("");
      }


    },
    pluralize: function (count, word) {

      var singles = [1, 21, 31, 41, 51, 61, 71, 81, 91];
      if (singles.indexOf(parseInt(count)) > -1) {
        return word;
      }

      return word + "s";
    },
    /***
     * @function checkDependencies
     * @returns {true} or {string}
     */
    checkDependencies: function () {

      if (typeof jQuery.ui != "object") {
        return "jQuery.ui";
      }

      if (typeof $.fn.handsontable != "function") {
        return "Handsontable widget";
      }

      if (!$.ech || typeof  $.ech.multiselect != "function") {
        return "Multiselect widget";
      }

      this.table = this.hotEl.handsontable('getInstance');

      if (!this.table) {
        return "Handsontable Instance";
      }

      return true;

    },

    /***
     * @function get handsontable Table instance
     * @return {Object}
     */
    getTable: function () {
      return this.table;
    },
    /***
     * @function getHiddenOptions
     * @return {Array}
     */
    getHiddenOptions: function () {

      if (!this.hiddenOptions[this.getId()]) {
        this.hiddenOptions[this.getId()] = [];
      }
      // console.log(this.getId(), "me.hiddenOptions" , this.hiddenOptions[this.getId()]);
      return this.hiddenOptions[this.getId()];
    },
    /***
     * @function InitiallyVisibleIndexes
     * @return {Array}
     */
    getInitiallyVisibleIndexes: function () {

      if (!this.initiallyVisibleIndexes[this.getId()]) {
        this.initiallyVisibleIndexes[this.getId()] = [];
      }
      return this.initiallyVisibleIndexes[this.getId()];
    },
    /***
     * @function onChange
     */
    onChange: function (silent) {

      var opts = this.recreateSettings(this.getSelected());
      //console.log("[HOT CONTROLS] onChange", opts);

      this.getTable().updateSettings(opts);
      this.updateControls();
      if (silent !== true) {
        this._trigger('afterUpdate');
      }


    },

    /***
     * @function getId
     * @return {string}
     */
    getId: function () {
      return this.hotEl.attr("id");
    },

    /***
     * @function getContainer
     * @return {Object}
     */
    getContainer: function () {
      return $('#' + this.getId() + '-controls');
    },


    /***
     * @function getSelector
     * @return {Object}
     */
    getSelector: function () {
      return $('#' + this.getId() + '-controls-selector');
    },

    /***
     * @function getExportSelector
     * @return {Object}
     */
    getExportSelector: function () {
      return $('#' + this.getId() + '-controls-export-selector');
    },

    /***
     * @function getExportBtn
     * @return {Object}
     */
    getExportBtn: function () {
      return $('#' + this.getId() + '-controls-export');
    },

    /***
     * @function getExportBtnAll
     * @return {Object}
     */
    getExportBtnAll: function () {
      return $('#' + this.getId() + '-controls-export-all');
    },

    /***
     * @function getSelected
     * @return {Array} Selected Columns
     */
    getSelected: function () {

      if (this.getSelector()) {
        return this.getSelector().multiselect("getChecked").map(function () {
          return this.value;
        }).get();
      } else {
        console.error("getSelector can not be used without selector");
        return [];
      }

    },

    /***
     * @function getOptions
     * @return {Object}
     */
    getOptions: function () {
      return this.options;
    },

    /***
     * @function getData
     * @return {Array}
     */
    getData: function () {
      return this.getOptions().data;
    },

    /***
     * @function getColumns
     * @return {Array}
     */
    getColumns: function () {
      return this.getOptions().columns;
    },

    /***
     * @function getControls
     * @return {Array}
     */
    getControls: function () {
      //if no controls passed
      return this.getOptions().controls || this.availableControls;
    },

    /***
     * @function useControl
     * @return {Boolean}
     */
    useControl: function (control) {
      return this.getControls().indexOf(control) > -1;
    },

    /***
     * @function getColHeaders
     * @return {Array}
     */
    getColHeaders: function () {
      return this.getOptions().colHeaders;
    },


    /***
     * @function updateControls
     * @return void
     */
    updateControls: function () {
      if (this.useControl("selector")) {
        if (this.getExportBtn()) {
          this.getExportBtn().prop("disabled", this.toCSV() == this.csvSep);
        }
      }
    },

    /***
     * @function createControls
     * @return void
     */
    createControls: function () {
      var i;
      var id = this.getId() + '-controls';
      var me = this;
      var hideFromToggle;
      var disabled;
      var selected;
      var hidden;
      var value;
      var html = "<div class='hot-controls' id='" + id + "'>";
      var columns = this.getColumns();
      var colHeaders = this.getColHeaders();
      var controls = this.getControls();
      var InitiallyVisibleIndexes = me.getInitiallyVisibleIndexes();


      if (me.options.selectAll === true) {
        $.each(columns, function (index, column) {
          column.visible = true;
        });
      }

      //push once!
      if(InitiallyVisibleIndexes.length === 0 ){
        //console.log('push!');
        $.each(columns, function (index, column) {
          if (columns[index] && columns[index].visible === true) {
            InitiallyVisibleIndexes.push(index);
          }
        });
      }


      $.each(controls, function (index, value) {

        if (value == "selector") {
          html += '<select id="' + id + '-selector"  multiple="multiple">';
          for (i in columns) {
            //console.log(columns[i] , colHeaders[i] , );

            hideFromToggle = columns[i].hideFromToggle == true;

            if (hideFromToggle) {
              me.getHiddenOptions().push(i);
            }


            selected = hideFromToggle || columns[i].visible === true ? ' selected="selected" ' : '';
            hidden = hideFromToggle ? ' disabled="disabled" ' : "";
            value = ' value="' + i + '"';
            html += '<option ' + hidden + selected + value + '>' + colHeaders[i] + '</option>';


          }

          html += '</select>';
        }

        else if (value == "export") {



          html += '<div>';
          //html += '<button  ></button>';
          html += '<button id="' + id + '-export-selector" class="hot-controls-excel">Export</button>';
          html += '</div>';
          html += '<ul>';
          html += '<li id="' + id + '-export-all">All columns</li>';
          html += '<li id="' + id + '-export">Visible columns</li>';
          html += '</ul>';



        } else {
          html += value;
        }


      });

      html += '</div>';

      if (this.options.targetEl) {
        this.options.targetEl.append(html);
      } else {
        this.hotEl.before(html);
      }


      if (this.useControl("selector")) {
        me.onChange.bind(me);
        me.getSelector().multiselect({
          resetColumns: function (event, ui) {
            me.resetColumns();
          },
          minWidth: 250,
          noneSelectedText: "No columns selected",
          selectedText: function (numChecked, numTotal, checkedItems) {
            var txt = me.pluralize(numChecked, "column");
            return 'Shown ' + numChecked + ' ' + txt + ' out of ' + numTotal;
          },
          click: function () {
            //console.log('click');
            me.onChange();
          },
          checkAll: function () {
            //console.log('checkAll');
            me.onChange();
          },
          uncheckAll: function () {
            //console.log('uncheckAll', arguments);
            me.onChange();
          }
        });
        //apply initial config
        me.onChange();
      }


      if (this.useControl("export")) {

        me.exportCSV.bind(me);
        me.getExportBtn().click(function (event) {
          me.exportCSV('PARTIAL');
        });

        me.getExportBtnAll().click(function (event) {
          me.exportCSV('ALL');
        });


        me.getExportSelector()
          .button({
            icons: {
              primary: "ui-icon-triangle-1-s"
            }
          }).click(function () {
            var menu = $(this).parent().next().show().position({
              my: "left top",
              at: "left bottom",
              of: this
            });
            $(document).one("click", function () {
              menu.hide();
            });
            return false;
          }).parent().buttonset().next().hide().menu();

      }


      this._trigger('afterRender');


    },

    /***
     * @function resetColumns to initial state
     * @return
     */
    resetColumns: function () {

      var columns = this.getColumns();
      var me = this;
      var len = me.getInitiallyVisibleIndexes().length;
      //console.log("[HOT CONTROLS] resetColumns");
      this.getSelector().multiselect("uncheckAllSilent");
      //debugger;
      this.getSelector().multiselect("widget").find(":checkbox").each(function (index) {
        if (me.getInitiallyVisibleIndexes().indexOf(parseInt(index)) > -1) {
          len--;

          if (len > 0) {
            //check all  options
            //console.log('check');
            $(this).prop('checked', true);
          } else {
            //console.log('click');
            //click last option to rebuild DOM
            $(this).click()
          }

        }
      });
      this._trigger('afterResetColumns');
    },

    /***
     * @function recreateSettings
     * @return {Object}
     */
    recreateSettings: function (selected) {
      var i = 0;
      var colHeadersMod = [];
      var columnsMod = [];
      var optionsMod;
      var columns = this.getColumns();
      var colWidthsMod = [];
      var colWidths = this.getOptions().colWidths;
      var len = selected.length;
      var index;

      $.each(columns, function (index, column) {
        column.visible = false;
      });

      //set selected as visible

      // console.warn('[recreateSettings]' , columns, selected );


      for (; i < len; i++) {
        index = selected[i];
        try {
          colHeadersMod.push(this.getColHeaders()[index]);
          columns[index].visible = true;
          columnsMod.push(columns[index]);
          colWidthsMod.push(colWidths[index]);
        } catch (e) {
          // console.error('[recreateSettings error]' , index );
        }
      }


      optionsMod = $.extend({}, this.getOptions(), {colWidths: colWidthsMod, colHeaders: colHeadersMod, columns: columnsMod});
      // console.log('optionsMod' , optionsMod);
      return optionsMod;
    },

    /***
     * @function getFilename
     * @return {string}
     */
    getFilename: function () {
      var d = new Date();
      var curr_date = d.getDate();
      var curr_month = d.getMonth();
      curr_month++;
      var curr_year = d.getFullYear();
      var curr_Hours = d.getHours();
      var curr_Minutes = d.getMinutes();

      if (curr_date < 10) {
        curr_date = "0".concat(curr_date);
      }
      if (curr_month < 10) {
        curr_month = "0".concat(curr_month);
      }
      if (curr_Hours < 10) {
        curr_Hours = "0".concat(curr_Hours);
      }
      if (curr_Minutes < 10) {
        curr_Minutes = "0".concat(curr_Minutes);
      }
      var formattedDate = curr_month + "-" + curr_date + "-" + curr_year + "_" + curr_Hours + "-" + curr_Minutes;
      return this.options.fileNamePrefix + "__" + formattedDate;
    },


    /***
     * @function propByString
     * converts data index to data value
     * @param o
     * @param s
     * @return  {String}
     */

    propByString: function (o, s) {
      s = "" + s;
      s = typeof s == 'string' ? s : "";
      s = s.replace(/\[(\w+)\]/g, '.$1');
      s = s.replace(/^\./, '');
      var a = s.split('.');
      while (a.length) {
        var n = a.shift();
        if (n in o) {
          o = o[n];
        } else {
          return;
        }
      }
      return o;
    },
    /***
     * @function stripTags
     * @return {String}
     */

    stripTags: function(str){
      return str.replace(/(<([^>]+)>)/mig, "");
    },

    /***
     * @function toCSVALL
     * @return {String}
     */
    toCSVALL: function () {
      var headers = this.getColHeaders();
      //backbone support
      var data = typeof this.getData().toJSON == 'function' ? this.getData().toJSON() : this.getData();
      var csv = this.csvSep;
      var columns = this.getColumns();
      var j;
      var i;
      var row;
      var headersArr = [];
      var skipped = [];
      var colText;
      var col;

      for (col in headers) {
        colText = this.stripTags(headers[col]);
        // console.log(i, this.stripTags(headers[i]));
        if(colText.length > 0){
          headersArr.push(headers[col]);
        }else{
          skipped.push(col);
        }

      }

      //console.log('toCSVALL', data);
      //console.log('columns', columns);
      //console.log('headers', headers);
      //console.log(skipped);

      for (i = 0; i < data.length; i++) {
        row = [];
//        console.log(data[i]);
//        console.log('---------------');
        for (j = 0; j < headers.length; j++) {


          if(skipped.indexOf(String(j)) === -1){

            // console.log(columns[j]);
            if (typeof  columns[j].data == 'function' && columns[j].xmlcol) {
              row.push(data[i][columns[j].xmlcol]);
            } else if (typeof  columns[j].data == 'string') {
              //   console.log(headers[j], columns[j].data , data[i][columns[j].data], this.propByString(data[i] ,  columns[j].data));
              row.push(this.propByString(data[i], columns[j].data));
            } else {
              console.error("wrong columns data ", columns[j]);
            }

          }
        }
        if (i === 0) {
          csv += headersArr.join(";") + "\n";
        }
        csv += row.join(";");
        csv += "\n";
      }


      return csv;

    },

    /***
     * @function toCSV
     * @return {String}
     */

    toCSV: function () {
      var headers = this.getTable().getColHeader();
      var csv = this.csvSep;
      var row;
      var col;
      var i;
      var prop;
      var value;
      var headersArr = [];
      var skipped = [];
      var colText;


      /***
       * LS
       we remove unwanted columns by detecting if it contains any visible  text
       if not - we exclude it from export
       it works fine for icon columns (checkbox/sort/etc)
       if such column eventually would have extra text  - new flag [hideFromExport] should be created
       we can not use [hideFromToggle] flag, because any column can be hidden from toggle
       */

      for (col in headers) {
        colText = this.stripTags(headers[col]);
        // console.log(i, this.stripTags(headers[i]));
        if(colText.length > 0){
          headersArr.push(headers[col]);
        }else{
          skipped.push(col);
        }

      }

      if (headersArr.length > 0) {
        csv += headersArr.join(";") + "\n";

        for (i = 0; i < this.getTable().countRows(); i++) {
          row = [];
          for (col in headers) {

            if(skipped.indexOf(String(col)) === -1){
              prop = this.getTable().colToProp(col);
              value = this.getTable().getDataAtRowProp(i, prop);
              row.push(value)
            }

          }

          csv += row.join(";");
          csv += "\n";
        }
      }

      //console.log("[csv length]" , csv.length);


      return csv;
    },



    /***
     * @function exportCSV
     * @return {File}
     */
    exportCSV: function (type) {

      var csv = type == "ALL" ? this.toCSVALL() : this.toCSV();
      csv = this.stripTags(csv);
      //   console.log("csv", csv);
      // return true;
      var link = document.createElement("a");

      link.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(csv));
      link.setAttribute("download", this.getFilename() + '_' + type + ".csv");

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

  });


});