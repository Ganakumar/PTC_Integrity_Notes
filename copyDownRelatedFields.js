//
// Integrity Manager sample script.
//
// This copies fields from a related Project Item down to the child.
// If the relatipnship is removed, the linked fields will be reset.
// If the relatipnship changes the linked fields will be updated.
//
//@param MultiString Fields to copy
// The fields to copy between. Form should be [fromField1]:[toField1],[fromField2]:[toField2],...,[fromFieldX]:[toFieldX]
//If one fields has to map to more than one target field, the target fields are separated using ~ symbol.
// eg:- [fromField1]:[toField1]~[toField2]~..[toFieldn],[fromField2]:[toFieldn+1],...,[fromFieldX]:[toFieldX]
//@param Field:relationship Relationship to source item
// From the triggering item, navigate this relationship (assumed to be single valued) to find
// the item where we will get the source values.
//

function print(s)
{
    Packages.mks.util.Logger.message("VELUX", 0,  eb.getScriptName() + ": " +s);                                
}

function debug(s)
{
    Packages.mks.util.Logger.message("VELUX", 10,  eb.getScriptName() + ": " +s);                                
}

function config(s)
{
  var report = eb.getScriptName() + ":  Configuration Error: " + s +
		"This is a configuration error made by your system administrator";
  print(report)
  eb.abortScript(report, true);
}

function userErr(s)
{
  var report = "Error: " + s; 
  print(report);
  eb.abortScript(report, true);
}
function log(s) {

    eb.setMessageCategory("GENERAL");
    eb.print("##"+eb.getScriptName() + "## - " + s, 10);
}

function verifyParams(delta)
{
  relationshipName = params.getStringParameter("Relationship to source item");
  if(relationshipName == null || relationshipName.length() == 0)
	  userErr("Configuration error. You must supply a relationship name.");
  
  var fieldMapStr = params.getStringParameter("Fields to copy");
  if(fieldMapStr == null)
    config("Fields to copy Not Set.");

  var fieldMap = new java.lang.String(fieldMapStr).split(",");  
  
  for(var i=0;i<fieldMap.length;i++)
  {
      var pairing =  new java.lang.String(fieldMap[i]).split(":");
      if(pairing.length == 2)
	  {
          fields.put(pairing[0], pairing[1]);
		  log("Config: copy field " + pairing[0] + " to " + pairing[1]);
	  }
      else
        config("Fields to copy not set correctly.");
  }
}

function resetLinkedFields(delta)
{
  var fromFields = fields.keySet().toArray();
  for(var i = 0;i<fromFields.length;i++)
  {
      try
	  { 
		  var deltaFieldName =  fields.get(fromFields[i]);
		  var arrDeltaFieldNames = new java.lang.String(deltaFieldName).split("~");
		  if(arrDeltaFieldNames.length > 0){
			  for(var len = 0; len < arrDeltaFieldNames.length ; len ++){
				  log("Resetting \"" + arrDeltaFieldNames[len] + "\" on  item " + delta.getID());
				  delta.setFieldValue(arrDeltaFieldNames[len], null); 
			  }
		  }
		  else{
		   log("Resetting \"" + deltaFieldName + "\" on  item " + delta.getID());
	       delta.setFieldValue(deltaFieldName, null);  
		  }
      	
      }
	  catch(e){
        print("Failed to reset " + fields.get(fromFields[i]) + " because: " + e);
      }
  }
	
}


function main()
{
  var delta = bsf.lookupBean("imIssueDeltaBean");
  verifyParams(delta);
  
  var relatedItems = delta.getNewRelatedIssues(relationshipName);
  debug("Found " + relatedItems.length + " items via " + relationshipName);
  if(relatedItems.length > 1)
	  userErr("The copy trigger may only be used with single-valued relationships. Configuration error.");
  if(relatedItems.length == 0)
  {
	  log("Zero related items. Resetting linked fields.");
	  resetLinkedFields(delta);
	  return;
  }
  var relatedItemBean = sb.getIssueBean(relatedItems[0]);
  log("Processing related item " + relatedItemBean.getID());
  
  var fromFields = fields.keySet().toArray();
  for(var i = 0;i<fromFields.length;i++)
  {
      var value = relatedItemBean.getFieldValue(fromFields[i]);
	  log("Got value " + value + " from related field " + fromFields[i]);
	
      try
	  { 
          var deltaFieldName =  fields.get(fromFields[i]);
		  var arrDeltaFieldNames = new java.lang.String(deltaFieldName).split("~");
		  if(arrDeltaFieldNames.length > 0){
			  for(var len = 0; len < arrDeltaFieldNames.length ; len ++){
				   log("Setting \"" + arrDeltaFieldNames[len] + "\" on  item " + delta.getID() + " to \"" + value + 
		         "\" taken from \"" + fromFields[i] + "\" on item " + relatedItemBean.getID());
				  delta.setFieldValue(arrDeltaFieldNames[len], value); 
			  }
		  }
		  else{
		    log("Setting \"" + deltaFieldName + "\" on  item " + delta.getID() + " to \"" + value + 
		         "\" taken from \"" + fromFields[i] + "\" on item " + relatedItemBean.getID());
				delta.setFieldValue(deltaFieldName, value);
		  }
      	
      }
	  catch(e){
        print("Failed to update " + fields.get(fromFields[i]) + " because: " + e.getMessage());
      }
  }
}

// Map of fields on the related item mapped to fields on the triggering item.
var fields = new java.util.HashMap();
var relationshipName;

var eb = bsf.lookupBean("siEnvironmentBean");
var sb = bsf.lookupBean("imServerBean");
var tb;
var params 	= bsf.lookupBean("parametersBean");
main();

