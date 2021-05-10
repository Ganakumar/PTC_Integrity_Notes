//
// Integrity Manager sample script.
//
// This copies fields from a related Project Item down to the childs.
// If the fields change target fields will be updated provided relationship exists.
//
//@param MultiString Fields to copy
// The fields to copy between. Form should be [fromField1]:[toField1],[fromField2]:[toField2],...,[fromFieldX]:[toFieldX]
// If one fields has to map to more than one target field, the target fields are separated using ~ symbol.
// eg:- [fromField1]:[toField1]~[toField2]~..[toFieldn],[fromField2]:[toFieldn+1],...,[fromFieldX]:[toFieldX]
//@param Field:relationship Relationship to target item
// From the triggering item, navigate this relationship  to find
// all the items where we will set the target values.
//
function print(s)
{
    Packages.mks.util.Logger.message("VELUX", 0,  eb.getScriptName() + ": " +s); 
	eb.abortScript(s, true);
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

function verifyParams(delta)
{
  relationshipName = params.getStringParameter("Relationship to target item");
  if(relationshipName == null || relationshipName.length() == 0)
	  config("Configuration error. You must supply a relationship name.");
  
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


function main()
{
  var delta = bsf.lookupBean("imIssueDeltaBean");
  verifyParams(delta);
  
  var arrRelatedItems = delta.getNewRelatedIssues(relationshipName);
  log("Found " + arrRelatedItems.length + " items via " + relationshipName);

  if( arrRelatedItems.length>0){
	  var arrFromFields = fields.keySet().toArray();
	  for(var i = 0;i<arrRelatedItems.length;i++){
			var relatedItemBean = sb.getIssueDeltaBean(arrRelatedItems[i]);
			log("Processing related item " + relatedItemBean.getID());
			for(var len=0;len<arrFromFields.length;len ++){
				var strFromFeildValue = delta.getNewFieldValue(arrFromFields[len]);
				var strToFields = fields.get(arrFromFields[len]);
				var arrToFields = new java.lang.String(strToFields).split("~");
				if(arrToFields.length >1){
					for(var j = 0; j < arrToFields.length ; j ++){
					log("Setting \"" + arrToFields[j] + "\" on  item " + relatedItemBean.getID() + " to \"" + strFromFeildValue + 
						"\" taken from \"" + arrFromFields[len] + "\" on item " + delta.getID());
					 relatedItemBean.setFieldValue(arrToFields[j], strFromFeildValue); 
					}
				}
				else{
					log("Setting \"" + strToFields + "\" on  item " + relatedItemBean.getID() + " to \"" + strFromFeildValue + 
		         "\" taken from \"" + arrFromFields[len] + "\" on item " + delta.getID());
					relatedItemBean.setFieldValue(strToFields,strFromFeildValue);
					
				}
			}
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

try {
	main();
	log("##Script Completed Successfully##");
}
catch(error) {
	log("##Script Completed with erros## : "+error);
	print("An unknown error occured. You must contact your system Administrator.")
	
}

