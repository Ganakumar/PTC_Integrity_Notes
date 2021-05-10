// Trigger to compute field computations
//
//
// 
// @param Field:logical Field 1
// @param Field:logical Field 2
//
// 
// @author Gana
// copyright:LTTS

function checkAndGetParameter(parameterName, isOptional) {
    var parameter = bsf.lookupBean("parametersBean").getParameter(parameterName);
    if(!isOptional && !parameter) {
        this.abort("You must specify a "+parameterName+".  This is a Server-side configuration error, please contact your administrator.");
    }
    return parameter;
}

function isEmpty(str){
	 return ((str == null ) || ( str.length == 0 ));
}

function log(message) {

    eb.setMessageCategory("GENERAL");
    eb.print("##"+eb.getScriptName() + "## - " + message, 10);
}

function computeField(issueBean, fieldName){
	log("Initiating computiation for field : "+fieldName);
	
	if(!isEmpty(fieldName)){
		
		var fieldBean = sb.getFieldBean(fieldName)
		
		log("Computation Found : "+ fieldBean.getComputation())
		
		if(issueBean != null){
			log("Issue Found - Type: "+issueBean.getType()+", ID: "+issueBean.getID());
			log("Computing Field : "+ fieldName);
			issueBean.computeHistoryNow(fieldName);
			log(""+fieldName+" Computed Successfully for issue ID : "+issueBean.getID());
		}
		else{
			log("No Issue Specified! Computing Field on all issue types.");
			fieldBean.computeHistoryNow();
			log(""+fieldName+" Computed Successfully.");
		}
	}
	else{
		log("Field Name is Empty! Returning from computation logic.");
	}
	
	
}

function main(){
	
	
	
	
	
	computeField(null, field1);
	computeField(null, field2);
	
	
	log("All Computations Performed. Ending Script");
	
}

//SCRIPT BEANS
var eb = bsf.lookupBean("siEnvironmentBean");
var params = bsf.lookupBean("parametersBean");
var delta = bsf.lookupBean("imIssueDeltaBean");
var sb = bsf.lookupBean("imServerBean");  
var trArgsBean = bsf.lookupBean("imTestResultsArgs");

log("##Script Initiated##");

//SCRIPT PARAMS
var field1 = checkAndGetParameter("Field 1",false);
var field2 = checkAndGetParameter("Field 2",true);


try {
	main();
	log("##Script Completed Successfully##");
}
catch(error) {
	log("##Script Completed with erros## : "+error);
}