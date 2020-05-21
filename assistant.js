'use strict';
var meta4 = meta4 || {};
meta4.pa = meta4.pa || {};
meta4.pa.employeeInformation = meta4.pa.employeeInformation || {};

/**
 * Este component facilitates the creation of assistant
 * @class
 * @private
 * @virtual
 */
meta4.pa.employeeInformation.Assistant = function () {
    var _idTab = null;
    var _utils = null;
    var _popUpWindow = null;
    var _popUpContent = null;
    var _leftContent = null;
    var _blockListTablesContent = null;
    var _blockListTables = null;
    var _blockActionsContent = null;
    var _blockActions = null;
    var _blockActionsTitle = null;
    var _rightContent = null;
    var _blockRegistersContent = null;
    var _blockRegisters = null;
    var _rightBlockActions = null;
    var _rightBlockActionsTitle = null;
    var _rightBlockActionsContent = null;
    var _blockRegistersTitle = null;
    var _sections = null;
    var _buttons = null;
    var _idTable = null;
    var _idClass = null;
    var _blockToUpdate = null;
    var _idAction = null;
    var _empModDef = null; // objeto paintForms de cada tab
    var _empModDefByTable = null; // objeto especifico del paintForms de cada tabla
    var BLOCK = 'block'; //Para poder definir que registros tienen n campos bloqueados en la modificación
    var LOADING = 'loading';
    var _separatorMultivalue = ';';
    var _listIdsResolution = null;
    var _assistantOptByTable = null;
    var _isAdding = false;
    var _showSelectReg = false;
    var _missingRequiredProcess = false;
    var _showMessageNotEditable = false;

    var _assistantOpt = {
        tabPersonal: {
            idClass: 'Personal'
        },
        tabCV: {
            idClass: 'Curriculum'
        },
        tabJob: {
            idClass: 'Job'
        },
        tabSalary: {
            idClass: 'Salary'
        }
    };

    var _transActions = {};
    var _transActions2 = {};

    var _activateLog = false;
    //Traza de tiempos
    function timesLog(functionName, init) {
        if (_activateLog) {
            if (init) {
                console.time(functionName);
            } else {
                console.timeEnd(functionName);
            }
        }
    }

    /**
     * Devuelve el formulario que permitira hacer los cambios
     * @param {String} idAction
     * @param {Number} position 
     * @returns {meta4.exports.widget.Form}
     */
    function getFormToUpdate(idAction, position) {
        var dataEmpMod = _utils.getDataEmpMod(_utils.activeTab);
        var showDates = _assistantOptByTable.showDates;
        _isAdding = false;
        if (position) {
            position = position.toInt();
        }
        var opt = {
            idTable: _idTable,
            showDates: false,
            readOnly: false,
            position: position,
            idAction: idAction,
            dataEmpMod: dataEmpMod
        };
        if (showDates) { //El mostrar o no las fechas solo depende de la configuracion. 
            opt.showDates = true;
        }
        if (idAction === _utils.DELETE || idAction === _utils.CLOSE) {
            opt.readOnly = true;
            _utils.enableActionButton(_popUpWindow._buttons[0]); //Si podemos usar la funcion mejor q esto--> _popUpWindow._buttons[0].m4Enabled();
        }

        positionNodeCopy(idAction, position);
        var form = meta4.pa.employeeInformation[_idClass].getForm(opt);
        if (form) {
            applyClassesByComponent(form.getChildrenList());
            form.setClassForm('m4-fullWidth');
            prepareNodeFormToUpdate(form, idAction, position);
        } else {
            //No hay ningun campo visible 
            //TODO meter un mensage
        }
    }

    function positionNodeCopy(idAction, position) {
        var idChannel = _empModDefByTable._channel;
        var idNode = _empModDefByTable._node;
        var nodeCopy = _utils.dataEmpMod[_utils.activeTab][idChannel][idNode].node;
        if (idAction === _utils.ADD) {    //TODO esto deberia de ir en canal por el tema de los permisos --> No, ya estan dados todos     
            //nodeCopy.addRecord(); lo hacemos ahora en canal para poder copiar los valores por defecto
        } else {
            nodeCopy.moveTo(position);
        }
    }

    /**
     * Añade las clases necesarias a cada componente del listado pasado como argumento
     * @param {Array} listObjs
     */
    function applyClassesByComponent(listObjs) {
        var numElems = 0;
        if (listObjs) {
            numElems = listObjs.length;
        }
        var i = 0;
        var obj = null;
        var list = new meta4.exports.widget.m4ListJS();
        var comment = new meta4.exports.widget.Comment();
        var radio = new meta4.exports.widget.m4RadioButton();
        var currency = new meta4.exports.widget.Currency();
        var input = new meta4.exports.widget.Input();
        var calendar = new meta4.exports.widget.calendar();
        var select = new meta4.exports.widget.M4Select();
        while (i < numElems) {
            obj = listObjs[i];
            if(!obj.keepClass){
                if (obj.constructor.prototype === input.constructor.prototype) {
                    obj.setClassWidth('m4-form-labelIput20');
                } else if (obj.constructor.prototype === currency.constructor.prototype) {
                    obj.setClassWidth('m4-form-labelIput15');
                } else if (obj.constructor.prototype === calendar.constructor.prototype) {
                    obj.setClassWidth('m4-form-labelIput15');
                } else if (obj.constructor.prototype === list.constructor.prototype) {
                    obj.setClassWidth('m4-form-labelIput20');
                }
            }
            i++;
        }
    }

    function prepareNodeFormToUpdate(form, idAction, position) {
        var idChannel = _empModDefByTable._channel;
        var idNode = _empModDefByTable._node;
        var params = {
            formUpdated: form,
            idAction: idAction,
            idChannelCopy: idChannel,
            idNodeCopy: idNode,
            position: position
        };
        callBackGetFormToUpdate(params);
    }

    /**
     * Carga el canal copy cada vez que se pulsa una accion distinta para que no queden datos 
     * de modificaciones anteriores
     * @param {String} idAction
     * @param {Number} position
     */
    function loadNodeCopy(idAction, position) {
        var data = {assistant: true};
        var idChannel = _empModDefByTable._channel;
        var idNode = _empModDefByTable._node;
        var dataEmpMod = _utils.getDataEmpMod(_utils.activeTab);
        var dataDef = meta4.pa.employeeInformation[_idClass].getData();
        data[idChannel] = {};
        data[idChannel].id = dataDef[idChannel].id;
        data[idChannel][idNode] = dataDef[idChannel][idNode];
        delete dataEmpMod[idChannel][idNode]; //Se borra para que se recargue??
        addExceptionDataDef(data, dataDef, dataEmpMod);
        timesLog('loadNodeCopy_loadDataOnDemand-->cloneConfigAndGetFormToUpdate', true);
        data.idAction = idAction;
        data.position = position;
        _utils.loadDataOnDemand(data, cloneConfigAndGetFormToUpdate.bind(this, idAction, position), 'simpleMod');
    }

    function addExceptionDataDef(newData, dataDef, dataEmpMod) {
        if (_idTable === 'SCO_HR_DOC') {
            var defToDoc = {};
            defToDoc.t3ManageDocsPersonal = dataDef.t3ManageDocsPersonal;
            defToDoc.t3Documents = dataDef.t3Documents;
            newData = Object.merge(newData, defToDoc);
        }
        if (_idTable === 'PLCO_H_HR_PAY_ELEM') {
            var defToDocPay = {};
            defToDocPay.t3ManageDocsSalary = dataDef.t3ManageDocsSalary;
            defToDocPay.t3PaymentElements = dataDef.t3PaymentElements;
            newData = Object.merge(newData, defToDocPay);
        }
    }

    /**
     * Lo primero que se hace es clonar la configuracion para el canal copia y luego ya generamos
     * el formulario con este canal
     * @param {String} idAction
     * @param {Number} position
     */
    function cloneConfigAndGetFormToUpdate(idAction, position) {
        timesLog('loadNodeCopy_loadDataOnDemand-->cloneConfigAndGetFormToUpdate', false);
        var idChannel = _empModDefByTable._channel;
        var idNode = _empModDefByTable._node;
        var nodeCopy = _utils.dataEmpMod[_utils.activeTab][idChannel][idNode].node;
        _utils.cloneConfig(nodeCopy);
        getFormToUpdate(idAction, position);
    }

    function callBackGetFormToUpdate(params) {
        var afterRun = function () {
            _popUpWindow._buttons[0].removeClass('hidden');
            if (params.idAction !== _utils.DELETE) {
                if (_utils.listForms.length > 0 && params.formUpdated.getAllowCheckForm()) {
                    addValidationButtonAssitant(_popUpWindow._buttons[0], _utils.listForms);
                    _popUpWindow._buttons[0].m4Disabled(); //Deshabilitamos hasta que se valide el formulario
                    if (params.formUpdated && params.formUpdated.inner) {
                        params.formUpdated.inner.hasFormErrors(false);
                    }
                    //Tras pintar el formulario a veces se realizan cambios en los datos y estos cambios se han de refrescar en los initialValue
                    //que usamos para saber si un formulario ha sido modificado o no. Tras el refresco hay que desRegistrarlo para que no siga refrescando
                    //cuando los valores se tocan a mano
                    setTimeout(function (form) {
                        form.unRegisterRefreshInitialValues();
                    }.bind(this, params.formUpdated), 1000);
                }
            }
            document.fireEvent('AfterRunAssistant');
        };
        var nodeCopy = _utils.dataEmpMod[_utils.activeTab][params.idChannelCopy][params.idNodeCopy].node;
        _assistantOptByTable.formUpdated = params.formUpdated;
        _assistantOptByTable.nodeCopy = nodeCopy;
        //Esto se hace para evitar acumular objetos con el mismo ID
        if (_blockToUpdate) {
            _blockToUpdate.remove();
        }
        _blockToUpdate = _utils.generateBlockAssistant(params.formUpdated);
        _utils.root.addChild(_blockToUpdate); //A pesar de ser temporal hay que meterlo en el root
        _blockToUpdate.run(_rightBlockActionsContent, afterRun);

    }

    function addValidationButtonAssitant(button, listForms) {
        if (_utils.infoMode === 1) {
            return false;
        }
        var numForms = listForms.length;
        var form = null;
        var existError = false;
        if (numForms > 0) {
            for (var i = 0; i < numForms; i++) {
                form = listForms[i].inner;
                if (form) {
                    form.addEvent('hasFormErrors', function (currentForm) {
                        existError = _utils.enableActionButton(button);
                        if (!existError) {
                            existError = validationFormModified(button, currentForm);
                        }
                        if (!existError) {
                            existError = validationAllFieldsAreEmpty(button, currentForm);
                        }
                    }.bind(this, listForms[i]));
                }
            }
        }
        _utils.enableActionButton(button);
    }

    /**
     * Habilita/deshabilita el boton pasado como parametro en funcion 
     * de las validaciones del listado de formularios de la funcionalidad
     * @param {Object} button
     * @param {object} form
     * @augments {boolean} existError 
     */
    function validationFormModified(button, form) {
        var existError = false;
        if (button) {
            if (form.inner && form.getIsModified() === false) {
                button.m4Disabled();
                existError = true;
            } else {
                button.m4Enabled();
            }
        }
        return existError;
    }

    /**
     * Habilita/deshabilita el boton pasado como parametro en funcion 
     * de las validaciones del listado de formularios de la funcionalidad
     * @param {Object} button
     * @param {object} form 
     * @arguments {boolean} existError 
     */
    function validationAllFieldsAreEmpty(button, form) {
        var existError = false;
        if (button) {
            //if (!form.inner) {
            if (form.inner && form.getAllFieldsAreEmpty()) {
                button.m4Disabled();
                existError = true;
            } else {
                button.m4Enabled();
            }
        }
        return existError;
    }

    /**
     * Rellena la propiedad AssistantOpt con las tablas y sus nombres.
     */
    function _fillAssistantOpt() {
        var _paintRequired = false;
        var idTabsRequired = [];
        if (_utils.nodeAssistant.count() > 0) {
            var _dataEmployeeInfo = meta4.data.utils.getItemsValues(_utils.nodeEmployeeInfo, ['PRP_MISSING_REQUIRED_PROCESSES']);
            if (_dataEmployeeInfo.PRP_MISSING_REQUIRED_PROCESSES === 1) {
                _missingRequiredProcess = true;
            } else {
                _missingRequiredProcess = false;
            }

            for (var i = 0; i < _utils.nodeAssistant.count(); i++) {
                _paintRequired = false;
                _utils.nodeAssistant.moveTo(i);
                var data = meta4.data.utils.getItemsValues(_utils.nodeAssistant, ['PLCO_ID_TAB', 'PLCO_ID_TABLE', 'PLCO_NM_TABLE', 'PRP_PROCESS_REQUIRED', 'PRP_PROCESS_COMPLETED']);
                if (data.PLCO_ID_TAB) {
                    // Si faltan procesos requeridos por completar evaluamos si el proceso es requerido y está o no completado para decidir si lo pintamos
                    if (_missingRequiredProcess) {
                        if (data.PRP_PROCESS_REQUIRED === 1) {
                            _paintRequired = true;
                            idTabsRequired.include(data.PLCO_ID_TAB);
                        }
                    }
                    if (!_assistantOpt[data.PLCO_ID_TAB]) {
                        _assistantOpt[data.PLCO_ID_TAB] = {};
                    }
                    _assistantOpt[data.PLCO_ID_TAB].active = true;                  
                    // Si tenemos que pintar el requerido o no hay procesos requeridos se trata la modificación
                    if (_paintRequired || !_missingRequiredProcess) {
                        if ((!_assistantOpt[data.PLCO_ID_TAB].listTables) || (_assistantOpt[data.PLCO_ID_TAB].listTables[data.PLCO_ID_TABLE])) {
                            _assistantOpt[data.PLCO_ID_TAB].listTables = {};
                        }
                        if (!_assistantOpt[data.PLCO_ID_TAB].listTables[data.PLCO_ID_TABLE]) {
                            _assistantOpt[data.PLCO_ID_TAB].listTables[data.PLCO_ID_TABLE] = {};
                        }
                        _assistantOpt[data.PLCO_ID_TAB].listTables[data.PLCO_ID_TABLE].nameTable = data.PLCO_NM_TABLE;
                    } else if (!_paintRequired && _assistantOpt[data.PLCO_ID_TAB] && _assistantOpt[data.PLCO_ID_TAB].listTables && _assistantOpt[data.PLCO_ID_TAB].listTables[data.PLCO_ID_TABLE]) {
                        delete _assistantOpt[data.PLCO_ID_TAB].listTables[data.PLCO_ID_TABLE];
                        if (Object.keys(_assistantOpt[data.PLCO_ID_TAB].listTables).length === 0) {
                            delete _assistantOpt[data.PLCO_ID_TAB].listTables;
                            _assistantOpt[data.PLCO_ID_TAB].active = false;
                            var btnAssistant = _utils.listBtnAssistant[_utils.btnAssistantID + data.PLCO_ID_TAB];
                            if (btnAssistant) {
                                btnAssistant.hide();
                            }
                        }
                    }
                }
            }
        }
        return idTabsRequired;
    }

    function _fillAssistantOpt_refactor() {
        if(_utils.nodeAssistant.count() === 0){
            return;
        }

        var _dataEmployeeInfo = meta4.data.utils.getItemsValues(_utils.nodeEmployeeInfo, ['PRP_MISSING_REQUIRED_PROCESSES']);
        if (_dataEmployeeInfo.PRP_MISSING_REQUIRED_PROCESSES === 1) {
            _missingRequiredProcess = true;
        } else {
            _missingRequiredProcess = false;
        }

        var idTabsRequired = [];

        for (var i = 0; i < _utils.nodeAssistant.count(); i++) {
            var _paintRequired = false;
            _utils.nodeAssistant.moveTo(i);
            var data = meta4.data.utils.getItemsValues(_utils.nodeAssistant, ['PLCO_ID_TAB', 'PLCO_ID_TABLE', 'PLCO_NM_TABLE', 'PRP_PROCESS_REQUIRED', 'PRP_PROCESS_COMPLETED']);
            
            if (!data.PLCO_ID_TAB){
                return;
            }

            // Si faltan procesos requeridos por completar evaluamos si el proceso es requerido y está o no completado para decidir si lo pintamos
            if (_missingRequiredProcess && data.PRP_PROCESS_REQUIRED === 1) {
                _paintRequired = true;
                idTabsRequired.include(data.PLCO_ID_TAB);
            }
            if (!_assistantOpt[data.PLCO_ID_TAB]) {
                _assistantOpt[data.PLCO_ID_TAB] = {};
            }
            _assistantOpt[data.PLCO_ID_TAB].active = true;

            // Si tenemos que pintar el requerido o no hay procesos requeridos se trata la modificación
            if (_paintRequired || !_missingRequiredProcess) {
                if (!_assistantOpt[data.PLCO_ID_TAB].listTables || _assistantOpt[data.PLCO_ID_TAB].listTables[data.PLCO_ID_TABLE]) {
                    _assistantOpt[data.PLCO_ID_TAB].listTables = {};
                }
                if (!_assistantOpt[data.PLCO_ID_TAB].listTables[data.PLCO_ID_TABLE]) {
                    _assistantOpt[data.PLCO_ID_TAB].listTables[data.PLCO_ID_TABLE] = {};
                }
                _assistantOpt[data.PLCO_ID_TAB].listTables[data.PLCO_ID_TABLE].nameTable = data.PLCO_NM_TABLE;
            } 
            
            if (!_paintRequired){
                if(!_assistantOpt[data.PLCO_ID_TAB] || !_assistantOpt[data.PLCO_ID_TAB].listTables || !_assistantOpt[data.PLCO_ID_TAB].listTables[data.PLCO_ID_TABLE]){
                    return;
                }
                delete _assistantOpt[data.PLCO_ID_TAB].listTables[data.PLCO_ID_TABLE];
                if (Object.keys(_assistantOpt[data.PLCO_ID_TAB].listTables).length === 0) {
                    delete _assistantOpt[data.PLCO_ID_TAB].listTables;
                    _assistantOpt[data.PLCO_ID_TAB].active = false;
                    var btnAssistant = _utils.listBtnAssistant[_utils.btnAssistantID + data.PLCO_ID_TAB];
                    if (btnAssistant) {
                        btnAssistant.hide();
                    }
                }
            }
        }
        return idTabsRequired;
    }

    /**
     * Genera los mensajes para añadir en las pestañas que se oculta el boton porque hay procesos obligatorios en otras pestañas
     * @param {Array} idTabsRequired
     */
    function _getTransProcessRequired(idTabsRequired) {
        var i = 0;
        var numTrans = idTabsRequired.length;
        var tabs = '';
        var trans = '';
        var idTab = '';
        if (numTrans > 0) {
            for (i = 0; i < numTrans; i++) {
                if (i > 0) {
                    tabs = tabs + ', ';
                }
                tabs = tabs + meta4.widget.translate.getTranslate('_' + idTabsRequired[i]);
            }
            trans = meta4.widget.translate.getTranslate('_infoTabsProcessRequired') + ' ' + tabs;
            for (idTab in _utils.classByTab) { //Utilizamos classByTab para tener el listado completo de tabs
                if (_assistantOpt[idTab].active) {
                    _assistantOpt[idTab].processRequired = trans;
                }
            }
        } else {
            for (idTab in _utils.classByTab) { //Utilizamos classByTab para tener el listado completo de tabs
                if (_assistantOpt[idTab] && _assistantOpt[idTab].processRequired) {
                    delete _assistantOpt[idTab].processRequired;
                }
            }
        }
    }

    /**
     * Carga la lista de tablas modificables y sus nombres. Solo se hace una vez y la primera tabla que entra carga todas
     */
    function _loadListAssistedTables() {
        let idTabsRequired = _fillAssistantOpt();
        _getTransProcessRequired(idTabsRequired)
    }

    /**
     * Comprueba si para el tab pasado existe almenos una modificacion activada
     * @param {String} idTab
     * @returns {Boolean}
     */
    function _existModified(idTab) {
        if (_assistantOpt[idTab].listTables) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * Crea un componente select con el listado de tablas que permitimos modificar
     * @param {Object} assistantOptByTab
     * @param {Object} container
     * @param {Object} processTable
     */
    function createListTables(assistantOptByTab, container, processTable) {
        var listTables = assistantOptByTab.listTables;
        var selectOptions = [];
        _empModDef = meta4.pa.employeeInformation[assistantOptByTab.idClass].getPaintForms();
        for (var table in listTables) {
            if (_empModDef[table] && _utils.isEmpModVisible(_empModDef[table]._idExpander)) { //Si no hay expander no se pinta la opcion de cambio guiado
                var option = new Element('option', {
                    'value': table,
                    'text': listTables[table].nameTable
                });
                selectOptions.push(option);
            }
        }

        var options = {
            className: 'selectMin300 xs-m4-fullWidth', //Clase para la select
            'title': meta4.widget.translate.getTranslate('_selectAnOption'),
            'showDefaultValueWhenTitle': false,
            onRowClick: function (option) {
                processTable(option.get('value'), assistantOptByTab);
            },
            'optionsSelect': selectOptions
        };
        assistantOptByTab.selectTables = new meta4.widget.TRSelect(container, options);
        assistantOptByTab.selectTables.draw();
        if (meta4.widget.utils.getInternetExplorerVersion() !== -1) {
            assistantOptByTab.selectTables._select.value = -1;
        }
    }

    /**
     * Crea un componente RadioButtonList con el listado de acciones que permitimos para esa tabla
     * @param {Object} assistantOptByTable
     * @param {Object} container
     * @param {Object} createBlockRegisters
     */
    function createRadioActions(assistantOptByTable, container, createBlockRegisters) {
        var list = assistantOptByTable.listActions;
        var nameRadio = assistantOptByTable.nameRadio;
        var options = {
            id: 'radioActionsAssistant',
            onChange: function () {
                createBlockRegisters(this.get('value'));
            }
        };
        $('mainHelp').addClass('hidden');
        $('assistantLeftContent').addClass('m4-border1Right');
        var radioActions;
        //if (Object.keys(list).length === 1) { // Si sólo hay una opción, la marcamos y ejecutamos su acción
        if ((Object.keys(list).length === 1) || ((Object.keys(list).length === 2) && (list.block))) {
            var action = Object.keys(list)[0];
            radioActions = new meta4.widget.RadioButtonList(action, options);
            if (action !== BLOCK) {
                var radioLabel = list[action].trans + ' ' + nameRadio;
                if (list[action].trans2) {
                    radioLabel += ' ' + list[action].trans2;
                }
                radioActions.addItem(action, radioLabel);
            }

            createBlockRegisters(action);

        } else {

            radioActions = new meta4.widget.RadioButtonList(null, options);

            for (var table in list) {
                if (table !== BLOCK) {  //Este tipo solo es para bloquear objetos del formulario
                    var radioLabel = list[table].trans + ' ' + nameRadio;
                    if (list[table].trans2) {
                        radioLabel += ' ' + list[table].trans2;
                    }
                    radioActions.addItem(table, radioLabel);
                }
            }

        }

        container.grab(radioActions);
    }

    function createMessageNotEditableESS(argAction) {
        var flagNoEditableESS = _assistantOptByTable.flagNotEditESS;
        var textnoEditableESS = "";
        if (_showMessageNotEditable) {
            if ((flagNoEditableESS === 2) || (flagNoEditableESS === 4)) {
                if (argAction === "update") {
                    textnoEditableESS = meta4.widget.translate.getTranslate('_not_editable_value2');
                }

                if (argAction === "correct") {
                    textnoEditableESS = meta4.widget.translate.getTranslate('_not_editable_value4');
                }

                if (argAction === "change") {
                    textnoEditableESS = meta4.widget.translate.getTranslate('_not_editable_value6');
                }

                if ((argAction === "delete") || (argAction === "close")) {
                    textnoEditableESS = meta4.widget.translate.getTranslate('_not_editable_value2_del');
                }
            }

            if ((flagNoEditableESS === 3) || (flagNoEditableESS === 5)) {
                if (argAction === "update") {
                    textnoEditableESS = meta4.widget.translate.getTranslate('_not_editable_value3');
                }

                if (argAction === "correct") {
                    textnoEditableESS = meta4.widget.translate.getTranslate('_not_editable_value5');
                }

                if (argAction === "change") {
                    textnoEditableESS = meta4.widget.translate.getTranslate('_not_editable_value7');
                }

                if ((argAction === "delete") || (argAction === "close")) {
                    textnoEditableESS = meta4.widget.translate.getTranslate('_not_editable_value3_del');
                }
            }
        }

        var _blockmsgAllNotEditable = new Element('h1', {
            'id': 'textnoEditableESS',
            'class': 'm4-extraMarginBottom m4-extraMarginTop noWrap ellipsis bold',
            text: textnoEditableESS
        });

        return _blockmsgAllNotEditable
    }

    /**
     * Crea un componente select con el listado de registros de la tabla seleccionada que se permite modificar
     * @param {Object} idAction
     * @param {Object} container
     * @param {Object} createBlockFormToUpdate
     */
    function createListRegister(idAction, container, createBlockFormToUpdate) {
        //calculateRegister(_actionsByReg[idAction]);
        var selectOptions = _assistantOptByTable.listOptions;
        var checkElement = null;
        var drawList = function () {
            var options = {
                className: 'selectMin300',
                'title': meta4.widget.translate.getTranslate('_selectAnOption'),
                'showDefaultValueWhenTitle': false,
                onRowClick: function (option) {
                    createBlockFormToUpdate(idAction, option.get('value'));
                }.bind(this),
                'optionsSelect': selectOptions
            };

            _assistantOpt[_idTab].selectRegister = new meta4.widget.TRSelect(container, options);
            _assistantOpt[_idTab].selectRegister.draw();
            if (meta4.widget.utils.getInternetExplorerVersion() !== -1) {
                _assistantOpt[_idTab].selectRegister._select.value = -1;
            }
        };
        var checkStatus = function () {
            selectOptions = _assistantOptByTable.listOptions;
            if (selectOptions && selectOptions !== LOADING) {
                $clear(checkElement);
                drawList();
            }
        };
        if (selectOptions === LOADING) {
            checkElement = checkStatus.periodical(100);
        } else {
            container.empty();
            drawList();
        }
    }

    /**
     * Organiza el listado de resoluciones obtenidas con el campo al que pertenecen 
     * @param {Array} resolutions
     */
    function prepareResolution(resolutions) {
        var k = 0;
        var listItems = null;
        for (var item in _listIdsResolution.itemsResolution) {
            listItems = _listIdsResolution.itemsResolution[item];
            listItems.values = [];
            for (var i = 0; i < listItems.ids.length; i++) {
                listItems.values.push(resolutions[k]);
                k++;
            }
        }
    }

    /**
     * Genera el listado de options que podran seleccionarse para modificar
     * @param {Object} createBlockFormToUpdate
     * @param {Array} resolutions
     */
    function createOptionsRegister(createBlockFormToUpdate, resolutions) {
        var numResolution = 0;
        var value = '';
        var mask = '';
        var selectOptions = [];
        var j = 0;
        var h = 0;
        var itemResolution;
        var itemValues;
        var args = null;
        if (resolutions) {
            numResolution = resolutions.length;
            prepareResolution(resolutions);
        }
        _assistantOptByTable.listOptions = null;
        processException();
        for (var i = 0; i < _listIdsResolution.numReg; i++) {
            var valueOption = _listIdsResolution.maskRegisterValues;
            if (numResolution > 0) {
                j = 0;
                for (itemResolution in _listIdsResolution.itemsResolution) {
                    mask = '%' + j.toString();
                    value = _listIdsResolution.itemsResolution[itemResolution].values[i];
                    if (value === undefined || value === null) {
                        value = '';
                    }
                    if (value || value.length >= 0) {
                        args = processExceptionMask(mask, value);
                        valueOption = valueOption.replace(args.mask, args.value);
                    }
                    j++;
                }
            }

            if (_listIdsResolution.resolutionValuesConditioned) {
                h = 0;
                var groupWithVal = false;
                var groupClean = false;
                var groupWithValSeparator = false;
                for (itemValues in _listIdsResolution.resolutionValuesConditioned) {
                    mask = '*' + h.toString();
                    value = _listIdsResolution.resolutionValuesConditioned[itemValues].values[i];
                    switch (_idTable) {
                        case 'SCO_CR_PREFERENC':
                            //Mobilidad no definida
                            if (itemValues === 'SCO_CK_NAT_INT') {
                                if (value === '2') {
                                    value = '';
                                    groupClean = true;
                                } else if (value === '0' || value === '1') {
                                    switch (value) {
                                        case '0':
                                            value = meta4.widget.translate.getTranslate('_international');
                                            break;
                                        case '1':
                                            value = meta4.widget.translate.getTranslate('_national');
                                            break;
                                    }
                                    if (_listIdsResolution.itemsResolution.STD_ID_COUNTRY.values[i].length > 0) {
                                        value = value + ' -';
                                    }
                                }
                                if (value && value.length > 0) {
                                    groupWithValSeparator = true;
                                } else {
                                    var valueOptionTmp = valueOption;
                                    valueOptionTmp = valueOptionTmp.replace('*0 ', '');
                                    valueOptionTmp = valueOptionTmp.replace(' *1*2*3 ', '');
                                    valueOptionTmp = valueOptionTmp.replace('(#0)', '');
                                    if (valueOptionTmp.length > 0) {
                                        groupWithValSeparator = true;
                                    }
                                }
                            }
                            if (itemValues === 'STD_ID_WORK_UNIT' || itemValues === 'STD_ID_JOB_CODE' || itemValues === 'STD_ID_WORK_LOCATION') {
                                groupClean = false;
                                value = _listIdsResolution.itemsResolution[itemValues].values[i];
                                if (_listIdsResolution.itemsResolution[itemValues].values[i].length > 0 && !groupWithVal) {
                                    groupWithVal = true;
                                    if (groupWithValSeparator) {
                                        value = ', ' + value;
                                    }
                                } else {
                                    value = '';
                                    groupClean = true;
                                }
                            }
                            break;
                    }
                    if (value || groupWithVal || groupClean) {
                        valueOption = valueOption.replace(mask, value);
                    }
                    h++;
                }
            }

            if (_listIdsResolution.itemsValues) {
                h = 0;
                for (itemValues in _listIdsResolution.itemsValues) {
                    mask = '#' + h.toString();
                    value = _listIdsResolution.itemsValues[itemValues].values[i];
                    //No se hace en el canal porque se tocaria el valor original y ademas al seleccionarlo se debe ver el valor completo
                    if (itemValues === 'SCO_GB_IBAN') {
                        if (value.length > 3) {
                            value = '***' + value.substr(value.length - 3, 3);
                        }
                    }
                    valueOption = valueOption.replace(mask, value);
                    h++;
                }
            }
            if (_listIdsResolution.itemsValuesConditioned) {
                h = 0;
                var withValue = false;
                for (itemValues in _listIdsResolution.itemsValuesConditioned) {
                    mask = '&' + h.toString();
                    value = '';
                    if (!withValue) {
                        value = _listIdsResolution.itemsValuesConditioned[itemValues].values[i];
                        if (value !== undefined && value !== null && value.length > 0) {
                            withValue = true;
                        }
                    }
                    valueOption = valueOption.replace(mask, value);
                    h++;
                }
            }
            var option = new Element('option', {
                'value': _listIdsResolution.listPositions[i],
                'text': valueOption
            });
            selectOptions.push(option);
        }
        if (selectOptions.length > 1) {
            _assistantOptByTable.listOptions = selectOptions;
            createListRegister(_idAction, _blockRegistersContent, createBlockFormToUpdate);
        }
    }

    /**
     * Procesa las etablas que tienen alguna excepcion
     */
    function processException() {
        if (_idTable === 'SCO_PERSON_BANK') {
            var gbIban = '';
            var gbBank = '';
            var listBank = [];
            for (var i = 0; i < _listIdsResolution.numReg; i++) {
                gbIban = (_listIdsResolution.itemsValues) ? _listIdsResolution.itemsValues.SCO_GB_IBAN.values[i] : '';
                if (!gbIban || gbIban === '') {
                    gbBank = (_listIdsResolution.itemsValues) ? _listIdsResolution.itemsValues.SCO_GB_BANK.values[i] : '';
                    listBank.push(gbBank);
                } else {
                    listBank.push(gbIban);
                }
            }
            if (_listIdsResolution.itemsValues) {
                delete _listIdsResolution.itemsValues.SCO_GB_BANK; //Borro uno de los dos, da igual
                _listIdsResolution.itemsValues.SCO_GB_IBAN.values = listBank;
            }
        }
    }

    /**
     * Procesa las excepciones para la mascara o valores
     * @param {String} mask
     * @param {String} value
     * @returns {Object}
     */
    function processExceptionMask(mask, value) {
        var params = {mask: mask, value: value};
        if (_idTable === 'STD_PHONE_FAX') {
            if (mask === '%1' && value === '') {
                params.mask = ' (%1)';
            }
        }
        return params;
    }

    /**
     * Descompone y organiza los identificadores de los items que han de calcular sus resoluciones, 
     * asi como aquellos que van a obtener sus informacion del nodo
     * @param {Array} listPositions 
     * @returns {Object} Object
     */
    function getValidIds(listPositions) {
        var listIds = {};
        var vChannel = _empModDefByTable._channel;
        var vNode = _empModDefByTable._node;
        var listItemsResolution = _assistantOptByTable.resolutionValues;
        var listItemsValues = _assistantOptByTable.itemsValues;
        var listItemsValuesConditioned = _assistantOptByTable.itemsValuesConditioned;
        var listResolutionValuesConditioned = _assistantOptByTable.resolutionValuesConditioned;
        var maskRegisterValues = _assistantOptByTable.maskRegisterValues;
        var idDtStart = _assistantOptByTable.idDtStart;
        var listItemsToRead = [];
        var listAllValues = [];
        var itemsResolution = null;
        var itemsValues = null;
        var itemsValuesConditioned = null;
        var resolutionValuesConditioned = null;
        var numReg = 0;
        var pos = 0;
        var count = 0;
        var k = 0;
        var item = null;
        var node = _utils.data[vChannel][vNode].node;
        numReg = listPositions.length;
        count = node.count();
        if (idDtStart) {
            listItemsToRead = [idDtStart];
            _assistantOptByTable.dtStart = {};
        }
        if (listItemsValues) {
            itemsValues = {};
            listItemsValues = listItemsValues.split(_separatorMultivalue);
            listItemsToRead = listItemsToRead.concat(listItemsValues);
        }
        if (listItemsValuesConditioned) {
            itemsValuesConditioned = {};
            listItemsValuesConditioned = listItemsValuesConditioned.split(_separatorMultivalue);
            listItemsToRead = listItemsToRead.concat(listItemsValuesConditioned);
        }
        if (listItemsResolution) {
            itemsResolution = {};
            listItemsResolution = listItemsResolution.split(_separatorMultivalue);
            listItemsToRead = listItemsToRead.concat(listItemsResolution);
        }
        if (listResolutionValuesConditioned) {
            resolutionValuesConditioned = {};
            listResolutionValuesConditioned = listResolutionValuesConditioned.split(_separatorMultivalue);
            listItemsToRead = listItemsToRead.concat(listResolutionValuesConditioned);
        }

        for (var i = 0; i < numReg; i++) {
            pos = parseInt(listPositions[i]); //Contiene las posiciones de los registros que se permite modificar
            if (count > pos) {
                node.moveTo(pos);
                listAllValues = meta4.data.utils.getItemsValues(node, listItemsToRead);
                if (idDtStart) {
                    _assistantOptByTable.dtStart[pos] = listAllValues[idDtStart];
                }
                if (listItemsResolution) {
                    for (k = 0; k < listItemsResolution.length; k++) { // las agrupamos todas por id de campo para optimizar carga en el reolutions.js
                        item = listItemsResolution[k];
                        if (!itemsResolution[listItemsResolution[k]]) {
                            itemsResolution[listItemsResolution[k]] = {};
                            itemsResolution[listItemsResolution[k]].ids = [];
                        }
                        itemsResolution[listItemsResolution[k]].ids.push(listAllValues[item]);
                    }
                }
                if (listResolutionValuesConditioned) {
                    for (k = 0; k < listResolutionValuesConditioned.length; k++) { // las agrupamos todas por id de campo
                        item = listResolutionValuesConditioned[k];
                        if (!resolutionValuesConditioned[listResolutionValuesConditioned[k]]) {
                            resolutionValuesConditioned[listResolutionValuesConditioned[k]] = {};
                            resolutionValuesConditioned[listResolutionValuesConditioned[k]].values = [];
                        }
                        resolutionValuesConditioned[listResolutionValuesConditioned[k]].values.push(listAllValues[item]);
                    }
                }


                if (listItemsValues) {
                    for (k = 0; k < listItemsValues.length; k++) { // las agrupamos todas por id de campo
                        item = listItemsValues[k];
                        if (!itemsValues[listItemsValues[k]]) {
                            itemsValues[listItemsValues[k]] = {};
                            itemsValues[listItemsValues[k]].values = [];
                        }
                        itemsValues[listItemsValues[k]].values.push(listAllValues[item]);
                    }
                }
                if (listItemsValuesConditioned) {
                    for (k = 0; k < listItemsValuesConditioned.length; k++) { // las agrupamos todas por id de campo
                        item = listItemsValuesConditioned[k];
                        if (!itemsValuesConditioned[listItemsValuesConditioned[k]]) {
                            itemsValuesConditioned[listItemsValuesConditioned[k]] = {};
                            itemsValuesConditioned[listItemsValuesConditioned[k]].values = [];
                        }
                        itemsValuesConditioned[listItemsValuesConditioned[k]].values.push(listAllValues[item]);
                    }
                }
            }
        }
        listIds.itemsResolution = itemsResolution;
        listIds.itemsValues = itemsValues;
        listIds.itemsValuesConditioned = itemsValuesConditioned;
        listIds.resolutionValuesConditioned = resolutionValuesConditioned;
        listIds.maskRegisterValues = maskRegisterValues;
        listIds.listPositions = listPositions;
        listIds.numReg = numReg;
        return listIds;
    }

    /**
     * Genera los registros disponibles
     * @param {Object} listPositions
     * @param {Object} createBlockFormToUpdate
     */
    function calculateRegister(listPositions, createBlockFormToUpdate) {
        _showSelectReg = true;
        _showMessageNotEditable = true;
        _listIdsResolution = getValidIds(listPositions);
        if (_listIdsResolution.numReg > 1) { //Se debe gestionar igual que el resto. Se pinta siempre el listado mientras haya datos
            if (_listIdsResolution.itemsResolution) {
                for (var item in _listIdsResolution.itemsResolution) {
                    _utils.addDirectResolution(item, _listIdsResolution.itemsResolution[item].ids);
                }
                _utils.launchDirectResolution(createOptionsRegister.bind(this, createBlockFormToUpdate));
            } else {
                createOptionsRegister(createBlockFormToUpdate);
            }
        } else {
            _showSelectReg = false;
            createBlockFormToUpdate(_idAction, _listIdsResolution.listPositions[0]);
        }
    }

    /**
     * Se procesa y separa las acciones y los registros sobre los que podemos actuar segun el tipo de accion
     * @param {type} actByReg
     * @returns {Boolean}
     */
    function processActionsByRegister(actByReg, idTable) {
        //ADD#CORRECT;0#UPDATE;1,3,5#DELETE;0#CHANGE;0,1
        var reg = [];
        var existActions = false;
        var action = null;
        if (actByReg) {
            //this.blockRequests(actByReg, idTable);
            var list = actByReg.split('#');
            for (var i = 0; i < list.length; i++) {
                var actReg = list[i].split(';');
                action = actReg[0];
                if (action) {
                    if (actReg[1]) {
                        reg = removeRequestedRegisters(idTable, actReg[1].split(','));
                    }
                    if (reg.length > 0 || action === _utils.ADD || action === _utils.BLOCK) {
                        if (action !== _utils.BLOCK) { //No es una accion solo es para bloquear campos
                            existActions = true;
                        }
                        _assistantOptByTable.listActions[action] = {};
                        _assistantOptByTable.listActions[action].trans = _transActions[action];
                        _assistantOptByTable.listActions[action].trans2 = _transActions2[action];
                        exceptionsAction(action, idTable);
                        if (reg.length > 0) {
                            _assistantOptByTable.listActions[action].reg = reg;
                        }
                    }
                }
            }
        }
        return existActions;
    }

    function removeRequestedRegisters(idTable, listPostions) {
        var index = 0;
        var listPositionsMod = getPositionsMod(idTable);

        listPositionsMod.forEach(function (position) {
            var sPosition = position.toString();
            index = listPostions.indexOf(sPosition);
            if (index > -1) {
                listPostions.splice(index, 1);
            }
        });

        /*for (var position in listPositionsMod) {
         index = listPostions.indexOf(position);
         if (index > -1) {
         listPostions.splice(index, 1);
         }
         }*/
        return listPostions;
    }

    function getPositionsMod(idTable) {
        var listPositions = [];
        _utils.fillListPosEmpMof();
        if (_utils.listPosEmpModByTable[idTable] !== undefined) {
            listPositions = _utils.listPosEmpModByTable[idTable].positions;
        }
        return listPositions;
    }

    /**
     * Procesa las excepciones de la traducciones para ciertas tablas. Solo se cambian los literales y no 
     * la accion en si para no afectar al funcionamiento
     * @param {String} action
     * @param {String} idTable
     */
    function exceptionsAction(action, idTable) {
        if (idTable === 'STD_PERSON' || idTable === 'PLCO_CLIENT_BUFFER_FIELDS' || idTable === 'PLCO_LOCAL_BUFFER_FIELDS') {
            _assistantOptByTable.listActions[action].trans = _transActions[_utils.UPDATE];
            delete _assistantOptByTable.listActions[action].trans2;
        }
    }

    function processTable(idTable, assistantOptByTab) {
        var existActions = false;
        _idTable = idTable;
        _assistantOptByTable = assistantOptByTab.listTables[_idTable];
        _assistantOptByTable.nameRadio = _assistantOptByTable.nameTable.toLowerCase();
        _empModDefByTable = _empModDef[_idTable];
        assistantOptByTab.dataDef = meta4.pa.employeeInformation[_idClass].getData();
        if (_empModDefByTable) {
            if (!_assistantOptByTable.listActions) { //Creamos las acciones permitidas por tabla
                var vChannel = _empModDefByTable._channel;
                var vNode = _empModDefByTable._node;
                var vCopyChannel = _utils.dataEmpMod[_utils.activeTab][vChannel];
                var idAlias = vCopyChannel.idAlias;
                var idChannel = vCopyChannel.id;
                var idNode = vCopyChannel[vNode].id;
                var dataDef = assistantOptByTab.dataDef;
                var currentChannel = _utils.data[vChannel].t3;
                var currentNode = _utils.data[vChannel][vNode].node;
                var arg = [_idTable, idChannel, idNode];
                _assistantOptByTable.listActions = {};
                _assistantOptByTable.listOptions = LOADING;
                _assistantOptByTable.idDtStart = dataDef[vChannel][vNode].dtStart;
                _assistantOptByTable.idDtEnd = dataDef[vChannel][vNode].dtEnd;
                _assistantOptByTable.currentNode = currentNode;
                var request = new meta4.M4Request(_utils.t3EmployeeInfo, _utils.idNodeAssistant, 'PLCO_AM_PROCESS_TABLE', arg);
                request.addReference(idAlias, vCopyChannel.t3);
                request.addReference(idChannel, currentChannel);
                meta4.data.execute(request, onSuccessProcessTable.bind(this, _assistantOptByTable, _idTable));
            } else {
                createBlockActions(_assistantOptByTable.availableActions, _assistantOptByTable);
            }
        }
    }

    function onSuccessProcessTable(assistantOptByTable, idTable) {
        var data = meta4.data.utils.getItemsValues(_utils.nodeAssistant, ['PLCO_ACTIONS_BY_REGISTER', 'PLCO_SHOW_DATES', 'PLCO_MULTIREG', 'PLCO_MULTIREG_VALUES', 'PLCO_MASK_REGISTER_VALUES', 'PLCO_RESOLUTION_VALUES', 'PLCO_ITEMS_VALUES', 'PLCO_POS_MODIFICATION', 'PLCO_ITEMS_VALUES_COND', 'PLCO_ITEMS_RESOLUTION_COND', 'PLCO_FLAG_NOT_EDIT_ESS']);
        var actions = processActionsByRegister(data.PLCO_ACTIONS_BY_REGISTER, idTable);
        assistantOptByTable.posModification = data.PLCO_POS_MODIFICATION;
        assistantOptByTable.showDates = data.PLCO_SHOW_DATES;
        assistantOptByTable.multireg = data.PLCO_MULTIREG;
        assistantOptByTable.multiregValue = data.PLCO_MULTIREG_VALUES;
        assistantOptByTable.maskRegisterValues = data.PLCO_MASK_REGISTER_VALUES;
        assistantOptByTable.resolutionValues = data.PLCO_RESOLUTION_VALUES;
        assistantOptByTable.itemsValues = data.PLCO_ITEMS_VALUES;
        assistantOptByTable.itemsValuesConditioned = data.PLCO_ITEMS_VALUES_COND;
        assistantOptByTable.resolutionValuesConditioned = data.PLCO_ITEMS_RESOLUTION_COND;
        assistantOptByTable.flagNotEditESS = data.PLCO_FLAG_NOT_EDIT_ESS;
        assistantOptByTable.availableActions = actions;
        createBlockActions(actions, assistantOptByTable);
    }

    function createBlockListTables(assistantOptByTab) {
        _blockListTables = new Element('div', {
            'class': 'm4-xsMarginLeft'
        });

        if (meta4.widget.utils.isMobile()) {
            _blockListTables.addClass('m4-extraMarginBottom');
        } else {
            _blockListTables.addClass('m4-xxlMarginBottom');
        }

        var blockListTablesTitle = new Element('h3', {
            'class': 'm4-minMarginBottom noWrap ellipsis',
            text: meta4.widget.translate.getTranslate('_chooseDataToUpdate')
        });
        _blockListTables.adopt(blockListTablesTitle);

        if (_missingRequiredProcess) {
            var blockRequiredTitle = new Element('p', {
                'class': 'm4-minMarginBottom',
                text: meta4.widget.translate.getTranslate('_requiredAssistedChange')
            });
            _blockListTables.adopt(blockRequiredTitle);
        }

        _blockListTablesContent = new Element('div', {});
        createListTables(assistantOptByTab, _blockListTablesContent, processTable);
        _blockListTables.adopt(_blockListTablesContent);

        _leftContent.adopt(_blockListTables);
        _popUpContent.adopt(_leftContent);
    }

    function resetBlockActions() {
        if (_blockActions) {
            _blockActions.destroy();
        }
        if (_rightContent) {
            _rightContent.destroy();
        }
        _popUpWindow._buttons[0].addClass('hidden');
    }

    function createBlockActions(existActions, assistantOptByTable) {

        var msg = _blockListTables.getElementById('textnoEditableESS');
        if (msg) {
            msg.destroy();
        }
        var flagNoEditableESS = assistantOptByTable.flagNotEditESS;
        var textnoEditableESS = "";
        if (flagNoEditableESS === 1) {
            textnoEditableESS = meta4.widget.translate.getTranslate('_not_editable_value1');
        }

        if ((flagNoEditableESS === 4) || (flagNoEditableESS === 5)) {
            textnoEditableESS = meta4.widget.translate.getTranslate('_not_editable_value8');
        }

        var _blockmsgAllNotEditable = new Element('h1', {
            'id': 'textnoEditableESS',
            'class': 'm4-extraMarginBottom m4-extraMarginTop noWrap ellipsis bold',
            text: textnoEditableESS
        });
        _blockListTables.adopt(_blockmsgAllNotEditable);

        var text = meta4.widget.translate.getTranslate('_whatDo');
        if (!existActions) {
            text = meta4.widget.translate.getTranslate('_noActions');
            $('mainHelp').removeClass('hidden');
            $('assistantLeftContent').removeClass('m4-border1Right');
        }
        resetBlockActions();
        _blockActions = new Element('div', {
            'class': 'm4-xsMarginLeft'
        });

        if (meta4.widget.utils.isMobile()) {
            _blockActions.addClass('m4-extraMarginBottom');
        }

        _blockActionsTitle = new Element('h3', {
            'class': 'm4-minMarginBottom noWrap ellipsis',
            text: text
        });
        _blockActionsContent = new Element('div', {id: '_blockActionsContent'});
        if (existActions) {
            createRadioActions(assistantOptByTable, _blockActionsContent, createBlockRegisters);
        }
        _blockActions.adopt(_blockActionsTitle, _blockActionsContent);
        _leftContent.adopt(_blockActions);
    }

    function resetBlockRegisters() {
        if (_rightContent) {
            _rightContent.destroy();
            _popUpWindow._buttons[0].addClass('hidden');
            if (_assistantOptByTable.formUpdated) {
                if (_blockToUpdate) {
                    _blockToUpdate.remove();
                }
                _blockToUpdate = null;
                _assistantOptByTable.formUpdated = null;
            }
        }
    }

    function createBlockRegisters(idAction) {
        var selectRegister = meta4.widget.translate.getTranslate('_selectRegister');
        _idAction = idAction;
        resetBlockRegisters();
        _rightContent = new Element('div', {
            'class': 'xs-100'
        });
        if (idAction !== _utils.ADD) {
            _blockRegisters = new Element('div', {
                'class': 'm4-xsMarginLeft'
            });

            if (meta4.widget.utils.isMobile()) {
                _blockRegisters.addClass('m4-extraMarginBottom');
            } else {
                _blockRegisters.addClass('m4-xxlMarginBottom');
            }
            _blockRegistersTitle = new Element('h3', {
                'class': 'm4-minMarginBottom noWrap ellipsis',
                text: selectRegister + ' ' + _transActions[_idAction] + ' ' + _assistantOptByTable.nameRadio
            });
            _blockRegistersContent = new Element('div', {});
            var listPositions = _assistantOptByTable.listActions[idAction].reg;
            calculateRegister(listPositions, createBlockFormToUpdate);

            if (_showSelectReg) {
                var containerNotEditableESS = createMessageNotEditableESS(idAction);
                _blockRegisters.adopt(_blockRegistersTitle, containerNotEditableESS, _blockRegistersContent);
                _showMessageNotEditable = false;
            }

            _rightContent.adopt(_blockRegisters);
            _rightContent.addClass('noAaddAction');
        } else {
            _rightContent.addClass('addAction');
            _isAdding = false;
            createBlockFormToUpdate(idAction);
        }
        _popUpContent.adopt(_rightContent);
    }

    function resetBlockFormToUpdate() {
        if (_rightBlockActions) {
            _rightBlockActions.destroy();
        }
    }

    function prepareForm(idAccion, position) {
        _utils.posModification = _assistantOptByTable.posModification;
        _utils.posRequest = 0; //No hay solicitudes pendientes
        _utils.idModificationToLoad = _idTable;
        _utils.idAddendum = _idTab;
        _utils.data.t3EmployeeInfo.nodeConfProcess.node.moveTo(_utils.posModification);
        loadNodeCopy(idAccion, position);
    }

    function createBlockFormToUpdate(idAccion, position) {
        resetBlockFormToUpdate();
        _rightBlockActions = new Element('div', {
            'class': 'm4-xsMarginLeft assistantForm'
        });
        // Si añadimos un registro nuevo o simplemente no hay combo para seleccionar registro ocupamos el total de la altura
        if (idAccion === 'add' || _showSelectReg === false) {
            _rightBlockActions.addClass('m4-fullHeight');
        }
        _rightBlockActionsTitle = new Element('h3', {
            'class': 'm4-minMarginBottom noWrap ellipsis',
            text: meta4.widget.translate.getTranslate('_doIt')
        });

        _rightBlockActionsContent = new Element('div', {
            'class': 'assistantFormContent'
        });

        var containerNotEditableESS = createMessageNotEditableESS(idAccion);

        _rightBlockActions.adopt(_rightBlockActionsTitle, containerNotEditableESS, _rightBlockActionsContent);
        _rightContent.adopt(_rightBlockActions);
        prepareForm(idAccion, position);
    }

    /**
     * Genera la ventana popUp que sera el asistente de modificaciones
     * @param {Object} assistantOptByTab
     */
    function createPopUpContent(assistantOptByTab) {
        _idTable = null;
        _popUpContent = new Element('div');

        if (!meta4.widget.utils.isMobile()) {
            _popUpContent.addClass('m4-flex two noOverflow');
        }

        _leftContent = new Element('div', {
            'id': 'assistantLeftContent',
            'class': 'solid grey-border m4-maxPaddingRight m4-maxMarginRight xs-100 xs-no-border xs-no-padding xs-no-margin'
        });
        _leftContent.grab(addHelpLayer());

        function addHelpLayer() {
            var divHelpAssistant = new Element('div', {
                'id': 'mainHelp',
                'class': 'm4-textCenter mainHelpAssistant s-hidden'
            });
            var arrow = new Element('img', {
                'id': 'helpImg',
                'class': 'm4-rotate deg250',
                'src': meta4.widget.icons.arrow_bg
            });

            var divText = new Element('div');

            var helpTitle = new Element('h3', {
                'class': 'helpTitle',
                'text': meta4.widget.translate.getTranslate('_chooseDataToUpdate')
            });

            divText.grab(helpTitle);
            divHelpAssistant.adopt(arrow, divText);

            return divHelpAssistant;
        }

        createBlockListTables(assistantOptByTab);
        _sections = [{
                text: meta4.widget.translate.getTranslate('_whatWantToDo'),
                mainElement: _popUpContent
            }];
        _buttons = [{
                type: 'button',
                typeButton: 'primary',
                id: 'btnRequestChangeAssist',
                text: meta4.widget.translate.getTranslate('_requestChange'),
                classButton: 'hidden',
                onClick: function (onClose) {
                    if (!_assistantOptByTable.formUpdated.stopRequest) { //TODO solucion temporal hasta que las validaciones funcionen bien
                        if (_assistantOptByTable.formUpdated.plcoIdDocIsVisible !== undefined && _assistantOptByTable.formUpdated.plcoIdDocIsVisible === 0) {
                            //Si no esta visible es que se ha seleccionado un elemento de pago o .. que no permite doc
                            //Quitamos la orden de grabar el doc.
                            meta4.data.utils.setValue(_assistantOptByTable.formUpdated.getChannel().getNode('PLCO_PA_MT_H_HR_PAY_ELEMENT'), 'PLCO_ID_DOC', null);
                        }
                        if (_idAction === _utils.DELETE) {
                            _assistantOptByTable.nodeCopy.setToDelete();
                        } else if (_idAction === _utils.CLOSE) {
                            if (_assistantOptByTable.idDtStart && _assistantOptByTable.idDtEnd) { //como tiene campos fecha es un historico
                                if (_assistantOptByTable.showDates) { //Si muestro fechas siempre es un delete
                                    _assistantOptByTable.nodeCopy.setToDelete();
                                } else {
                                    var dtStart = meta4.data.utils.getValue(_assistantOptByTable.nodeCopy, _assistantOptByTable.idDtStart);
                                    if (dtStart === meta4.data.utils.getDateValue(_utils.TODAY)) { //la accion real es un delete
                                        _assistantOptByTable.nodeCopy.setToDelete();
                                    } else {
                                        var dtEnd = new Date().decrement('day', 1);
                                        meta4.data.utils.setValue(_assistantOptByTable.nodeCopy, _assistantOptByTable.idDtEnd, dtEnd);
                                    }
                                }
                            } else { //si no es un historico la accion real siempre es un delete
                                _assistantOptByTable.nodeCopy.setToDelete();
                            }
                        }
                        var persistOrWf = meta4.data.utils.getValue(_utils.data.t3EmployeeInfo.nodeConfProcess.node, 'PLCO_PERSIST_OR_WF');
                        if (persistOrWf !== 0) { //lleva grabacion directa y hay que recargar todo
                            var data = meta4.pa.employeeInformation[_idClass].getData();
                            var vChannel = _empModDefByTable._channel;
                            var vNode = _empModDefByTable._node;

                            delete _utils.data[vChannel][vNode];
                            delete _utils.dataEmpMod[_utils.activeTab][vChannel][vNode];

                            _utils.firstTabLoaded = null;
                            _utils.dynamicLoadByStates.setState('PLCO_AM_SAVE_RELOAD');
                            _utils.loadDataOnDemand(data, onFinishApplyRequest.bind(this, onClose), _utils.activeTab);
                        } else {
                            var requestModification = new meta4.M4Request(_utils.t3EmployeeInfo, _utils.idNodeEmployeeInfo, 'PLCO_APPLY_REQUEST', null);
                            requestModification = _utils.addReferencesToRequestAssistant(requestModification);
                            meta4.data.execute(requestModification, onFinishApplyRequest.bind(this, onClose, requestModification, persistOrWf));
                        }
                    } else { //No se puede enviar la solicitud
                        meta4.data.log.addErrorMessage(_assistantOptByTable.formUpdated.msgError);
                        meta4.widget.log.showErrors(meta4.data.log);
                    }
                }
            }, {
                type: 'button',
                typeButton: 'secondary',
                id: '_buttCancel',
                text: meta4.widget.translate.getTranslate('_buttCancel'),
                onClick: function (onClose) {
                    onClose();
                    if (_assistantOptByTable && _assistantOptByTable.formUpdated) {
                        _blockToUpdate.remove();
                        _blockToUpdate = null;
                        _assistantOptByTable.formUpdated = null;
                        if (_assistantOptByTable.cleanedFormOnClose && _assistantOptByTable.cleanedFormOnClose === true) {
                            var requestCloseAssistant = new meta4.M4Request(_utils.t3EmployeeInfo, _utils.idNodeEmployeeInfo, 'PLCO_AM_CLOSE_ASSISTANT', null);
                            requestCloseAssistant = _utils.addReferencesToRequestAssistant(requestCloseAssistant);
                            meta4.data.execute(requestCloseAssistant, onSuccessCleanRequest.bind(this, requestCloseAssistant));
                        }
                    }

                }
            }];

        var options = {
            id: 'popUpAssistant',
            title: meta4.widget.translate.getTranslate('_updatePersonalInfo'),
            sections: _sections,
            buttons: _buttons,
            classname: 'm4-popUpSize75 m4-popUpSize75h'
        };
        _popUpWindow = new meta4.widget.popUpWindow(options);
    }

    /**
     * La grabacion de la modificacion ha ido bien, ahora hay que recargar si hace falta y repintar
     * @param {Function} onClose
     * @param {Object} request
     * @param {number} persistOrWf 
     */
    function onFinishApplyRequest(onClose, request, persistOrWf) {
        var result = parseInt(request.getResult());
        var idTranslation = '_data_save_ok';
        if (result !== -1) { //Si ninguna validacion ha fallado
            onClose();
            _utils.listPosEmpModByTable = null;
            _utils.listEmpModByTabLoaded[_utils.activeTab] = null;
            _blockToUpdate.remove();
            _blockToUpdate = null;
            _assistantOptByTable.formUpdated = null;
            if (persistOrWf === 0) {
                idTranslation = '_data_request_ok';
            }
            meta4.data.showPopUpWrapData(meta4.widget.translate.getTranslate(idTranslation));
            delete _assistantOptByTable.listActions;
            _loadListAssistedTables();//Regeneremos las acciones
            meta4.pa.employeeInformation.Tabs.repaintTabs();
        } else {
            //se deja la ventana abierta y salta un mensaje de error
            _assistantOptByTable.cleanedFormOnClose = true;
        }
        var nodeDocRequest = _utils.t3EmployeeInfo.getNode(_utils.data.t3EmployeeInfo.nodeDocsRequest.id);
        nodeDocRequest.unRegisterById(meta4.M4EventTypes.getNodeRecordsChanged(), 'SCO_ID_DOC');
    }

    /**
     * Se cierra el formulario tras haber intentado grabar con error
     * @param {Object} request
     */
    function onSuccessCleanRequest(request) {
        var result = parseInt(request.getResult());
        if (result !== -1) { //Si ninguna validacion ha fallado
            _assistantOptByTable.cleanedFormOnClose = false;
        }
    }

    /**
     * Crea el popUp de modificaciones
     */
    function _createPopUp() {
        _idTab = _utils.activeTab;
        var assistantOptByTab = _assistantOpt[_idTab];
        _idClass = assistantOptByTab.idClass;
        createPopUpContent(assistantOptByTab);
    }

    /**
     * Devuelve si la accion actual es añadir
     * @returns {Boolean}
     */
    function _isActionAdd() {
        return _isAdding && $('_blockActionsContent');
    }

    /**
     * Devuelve las opciones disponibles del asistente
     * @returns {Boolean}
     */
    function _getAssistantOpt() {
        return _assistantOpt;
    }

    /**
     * Carga las traducciones estaticas 
     */
    function _fillTranslation() {
        _transActions.change = meta4.widget.translate.getTranslate('_accChange'); // 'Cambiar',
        _transActions2.change = meta4.widget.translate.getTranslate('_accChange2'); //'porque ahora es diferente'
        _transActions.correct = meta4.widget.translate.getTranslate('_accCorrect'); //'Corregir',
        _transActions2.correct = meta4.widget.translate.getTranslate('_accCorrect2'); //'porque tiene un error'
        _transActions.delete = meta4.widget.translate.getTranslate('_accDelete'); //'Borrar',
        _transActions.close = meta4.widget.translate.getTranslate('_accClose'); //'Borrar - Cerrar',
        _transActions.add = meta4.widget.translate.getTranslate('_accAdd'); //'Añadir',
        _transActions.update = meta4.widget.translate.getTranslate('_accUpdate'); //'Modificar'
    }

    /**
     * Elimina las acciones del asistente para una tabla de un tab especifico
     * @param {String} idTable
     * @param {String} idTab
     */
    function _removeActions(idTable, idTab) {
        if (idTab) {
            _idTab = idTab;
        }
        delete _assistantOpt[_idTab].listTables[idTable].listActions;
    }

    /**
     * Constructor
     * @param {Object} utils
     */
    function _init(utils) {
        _utils = utils;
        _utils.data.t3EmployeeInfo.nodeConfProcess.node = _utils.data.t3EmployeeInfo.t3.getNode(_utils.data.t3EmployeeInfo.nodeConfProcess.id);
        _utils.nodeAssistant = _utils.data.t3EmployeeInfo.t3.getNode(_utils.idNodeAssistant);
        _fillTranslation();
        _loadListAssistedTables();
    }

    function _setNodeAssistant(node) {
        _utils.nodeAssistant = node;
    }

    function _getNodeAssistant() {
        return _utils.nodeAssistant;
    }

    function _setM4ObjectEmployeeInfo(m4object){
        _utils.data.t3EmployeeInfo.t3 = m4object;
    }

    function _getM4ObjectEmployeeInfo() {
        return _utils.data.t3EmployeeInfo.t3;
    }

    function _mock_utils(mock){
        _utils = mock;
    }

    function _setAssistantOpt(value) {
        _assistantOpt = value;
    }

    var __test__only__ = {};
    __test__only__._mock_utils = _mock_utils;
    __test__only__._setNodeAssistant = _setNodeAssistant;
    __test__only__._setM4ObjectEmployeeInfo = _setM4ObjectEmployeeInfo;
    __test__only__._getM4ObjectEmployeeInfo = _getM4ObjectEmployeeInfo;
    __test__only__._getTransProcessRequired = _getTransProcessRequired;
    __test__only__._setAssistantOpt = _setAssistantOpt;
    //__test__only__._fillAssistantOpt = _fillAssistantOpt;
    __test__only__._fillAssistantOpt = _fillAssistantOpt_refactor;

    return {
        init: _init,
        createPopUp: _createPopUp,
        existModified: _existModified,
        isActionAdd: _isActionAdd,
        getAssistantOpt: _getAssistantOpt,
        removeActions: _removeActions,
        loadListAssistedTables: _loadListAssistedTables,
        __test__only__: __test__only__
    };
}();