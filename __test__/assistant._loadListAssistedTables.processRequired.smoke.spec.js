if(window.require){
    require("./__lib__/jasmine-3.5.0/jasmine");
    require("../assistant");
}

describe("Personnel Administration - Employee Information - ListAssistedTables where PRP_PROCESS_REQUIRED is 1 smoke (Suite)", function() {

    var mock_nodeAssistant = null;
    var mock_utils = null;

    beforeEach(function() {

        mock_nodeAssistant = jasmine.createSpyObj('mock_nodeAssistant', {
            count: 1,
            moveTo: jasmine.createSpy()
        });

        //mock _utils
        mock_utils = jasmine.createSpyObj('mock_utils', {
            nodeAssistant : mock_nodeAssistant
        });

        meta4.pa.employeeInformation.Assistant.__test__only__._mock_utils(mock_utils);
        meta4.pa.employeeInformation.Assistant.__test__only__._setNodeAssistant(mock_nodeAssistant);
        
        var mock_dataEmployeeInfo = {
            'PRP_MISSING_REQUIRED_PROCESSES' : 1
        };

        var mock_dataAssistant = {
            'PLCO_ID_TAB' : 'Personal',
            'PLCO_ID_TABLE' : 'idTable',
            'PLCO_NM_TABLE' : 'nameTable',
            'PRP_PROCESS_REQUIRED' : 1
        }

        // Mock meta4.data.getItemsValues
        function mock_dataGetItemsValues(node,items) {
            if (items.includes("PRP_MISSING_REQUIRED_PROCESSES")) {
                return mock_dataEmployeeInfo;
            }
            if (items.includes('PLCO_ID_TAB', 'PLCO_ID_TABLE', 'PLCO_NM_TABLE', 'PRP_PROCESS_REQUIRED', 'PRP_PROCESS_COMPLETED')) {
                return mock_dataAssistant;
            }
        }

        meta4.data = {}
        meta4.data.utils = {}
        meta4.data.utils.getItemsValues = jasmine.createSpy('mock_data.utils.getItemsValues').and.callFake(mock_dataGetItemsValues);

        meta4.pa.employeeInformation.Assistant.__test__only__._setAssistantOpt({});
    });

    it('should not throws an exception', function () {
        var fillAssistantOpt = meta4.pa.employeeInformation.Assistant.__test__only__._fillAssistantOpt;
        expect(fillAssistantOpt).not.toThrow();
    });

    it('should not call to getItemsValues', function() {

        mock_nodeAssistant = jasmine.createSpyObj('mock_nodeAssistant', {
            'count': 0
        });

        mock_utils = jasmine.createSpyObj('mock_utils', {
            'nodeAssistant' : mock_nodeAssistant
        });

        meta4.pa.employeeInformation.Assistant.__test__only__._mock_utils(mock_utils);
        meta4.pa.employeeInformation.Assistant.__test__only__._setNodeAssistant(mock_nodeAssistant);

        meta4.pa.employeeInformation.Assistant.__test__only__._fillAssistantOpt();

        expect(meta4.data.utils.getItemsValues).toHaveBeenCalledTimes(0);
    });

    it('should call to getItemsValues two times', function() {
        meta4.pa.employeeInformation.Assistant.__test__only__._fillAssistantOpt();

        expect(meta4.data.utils.getItemsValues).toHaveBeenCalledTimes(2);
        expect(meta4.data.utils.getItemsValues).toHaveBeenCalledWith(mock_nodeAssistant,jasmine.any(Array));
    });

    it('should have a new tab Personal active with a table and its name', function() {
        meta4.pa.employeeInformation.Assistant.__test__only__._fillAssistantOpt();
        var options = meta4.pa.employeeInformation.Assistant.getAssistantOpt();

        expect(options.Personal).toBeTruthy();
        expect(options.Personal).toEqual(jasmine.objectContaining({active: true}));
        expect(options.Personal.active).toBeTrue();
        expect(options.Personal.listTables.idTable).toEqual(jasmine.objectContaining({nameTable: "nameTable"}));
    });

    it('Should not duplicate list tables in the assistantOpt list if it was call 2 times', function() {
        meta4.pa.employeeInformation.Assistant.__test__only__._fillAssistantOpt();
        var mock_dataAssistant = {
            'PLCO_ID_TAB' : 'Personal',
            'PLCO_ID_TABLE' : 'idTable',
            'PLCO_NM_TABLE' : 'nameTable1',
            'PRP_PROCESS_REQUIRED' : 1
        }
        var mock_dataEmployeeInfo = {
            'PRP_MISSING_REQUIRED_PROCESSES' : 1
        };
        function mock_dataGetItemsValues(node,items) {
            if (items.includes("PRP_MISSING_REQUIRED_PROCESSES")) {
                return mock_dataEmployeeInfo;
            }
            if (items.includes('PLCO_ID_TAB', 'PLCO_ID_TABLE', 'PLCO_NM_TABLE', 'PRP_PROCESS_REQUIRED', 'PRP_PROCESS_COMPLETED')) {
                return mock_dataAssistant;
            }
        }
        meta4.data.utils.getItemsValues = jasmine.createSpy('mock_data.utils.getItemsValues').and.callFake(mock_dataGetItemsValues);
        meta4.pa.employeeInformation.Assistant.__test__only__._fillAssistantOpt();
        var options = meta4.pa.employeeInformation.Assistant.getAssistantOpt();

        expect(options).toBeTruthy();
        expect(options.Personal.listTables).toEqual(jasmine.objectContaining({idTable:{nameTable:'nameTable1'}}));
    });
});
