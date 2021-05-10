// Trigger to set configuration fields in Action type.
// This will tell via the configuration fields that whether the relationship field contains an object or not.
// Later these configuration fields are used in constrains.
// 
// @param Field:logical Field 1
// @param Field:logical Field 2
// @param Field:relationship Relationship Field
// 
// @author Gana
// copyright:LTTS

function print(s)
{
    Packages.mks.util.Logger.message("VELUX", 0,  eb.getScriptName() + ": " +s);                                
}

function config(s)
{
  var report = eb.getScriptName() + ":  Configuration Error: " + s +
		"This is a configuration error made by your system administrator";
  print(report)
  eb.abortScript(report, true);
}

function log(s) {

    eb.setMessageCategory("GENERAL");
    eb.print("##"+eb.getScriptName() + "## - " + s, 10);
}

function checkAndGetParameter(parameterName) {
    var parameter = params.getParameter(parameterName);
    if( parameter === null) {
        config("You must specify a "+parameterName);
    }
    return parameter;
}

function main(){
	var issueId = delta.getID();
	var length = 0 ;
	log("Issue Id:"+issueId);
	var DFMEAStatus = false;
	var PFMEAStatus = false;
	var arrRelatedItems = delta.getNewRelatedIssues(relationshipName);
	if( arrRelatedItems !== null)
		length = arrRelatedItems.length;
	log("Related Items size:"+length);
	if(length >0){
		  for(var i = 0;i<length;i++){
			var relatedItemBean = sb.getIssueBean(arrRelatedItems[i]);
			var strType = relatedItemBean.getType();  
			if(strType == "DFMEA Risk"){
				DFMEAStatus = true;
				}
			if(strType == "PFMEA Risk"){
				PFMEAStatus = true;
				}
		  }	
	}
	log("DFMEA Status:"+DFMEAStatus);	  
	log("PFMEA Status:"+PFMEAStatus);	  
	delta.setFieldValue(field1, DFMEAStatus);	
	delta.setFieldValue(field2, PFMEAStatus);	
	
}

//SCRIPT BEANS
var eb = bsf.lookupBean("siEnvironmentBean");
var params = bsf.lookupBean("parametersBean");
var delta = bsf.lookupBean("imIssueDeltaBean");
var sb = bsf.lookupBean("imServerBean");  

log("##Script Initiated##");

//SCRIPT PARAMS
var field1 = checkAndGetParameter("Field 1");
var field2 = checkAndGetParameter("Field 2");
var relationshipName = checkAndGetParameter("Relationship Field");

try {
	main();
	log("##Script Completed Successfully##");
}
catch(error) {
	log("##Script Completed with erros## : "+error);
	print("An unknown error occured. You must contact your system Administrator.")
	
}