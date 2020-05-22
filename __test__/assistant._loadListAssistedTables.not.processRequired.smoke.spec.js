if(window.require){
    require("./__lib__/jasmine-3.5.0/jasmine");
    require("../assistant");
}

describe("Personnel Administration - Employee Information - _fillAssistantOpt where PRP_PROCESS_REQUIRED is 0 smoke (Suite)", function() {

    var mock_dataGetItemsValues = null;
    var mock_nodeAssistant = null;
    var mock_utils = null;

    beforeEach(function() {

        mock_nodeAssistant = jasmine.createSpyObj('mock_nodeAssistant', {
            'count': 1,
            'moveTo': jasmine.createSpy()
        });

        //mock _utils
        mock_utils = jasmine.createSpyObj('mock_utils', {
            btnAssistantID : jasmine.createSpyObj('btnAssistantID', { btnAssistantID : 'btnAssistant_'}),
            listBtnAssistant : jasmine.createSpyObj('listBtnAssistant', {listBtnAssistant : []}),
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
            'PRP_PROCESS_REQUIRED' : 0
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

    it('should not have a new tab Personal active without listTables', function() {
        meta4.pa.employeeInformation.Assistant.__test__only__._fillAssistantOpt();
        var options = meta4.pa.employeeInformation.Assistant.getAssistantOpt();

        expect(options.Personal).toBeTruthy();
        expect(options.Personal).toEqual(jasmine.objectContaining({active: true}));
        expect(options.Personal.active).toBeTrue();
        expect(options.Personal).not.toEqual(jasmine.objectContaining({listTables:{}}));
    });
});