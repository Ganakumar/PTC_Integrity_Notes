// <b>Integrity Manager PRE-Event Trigger For Multi-User Fields</b>
// <p>
// This trigger is designed to be run when a flag for 'I am signing' is changed
// on an item.  Generally this is a picklist called 'Do you approve?' with Yes/No
// in it.</p>
// <p>
// Two multi-user picklists are needed: one for the signers required, and a
// non-editable one that stores who has already signed.  When they are equal
// (everyone signed) the script will automatically advanced the state to that
// specified in the parameters (or leave the state alone if none specified).
// </p>
// @param Field:User Approvers Required
// MANDATORY: This is the field from where all approvers will come
//
// @param Field:User Approvals Noted 
// MANDATORY: This is the field where approvals are stored
//
// @param State All approved state
// OPTIONAL: When the two user fields above are equal, the issue will be auto-advanced to this state.
//
// @param State One rejected state
//
// @param Field:Longtext Comments Log
// OPTIONAL: Log field where comments from signature box are to be stored
//
// @param Field:date Most Recent Approval Date 
// OPTIONAL: Date field where most recent approval date will be stored
//
// @param Field:Pick Approval Decision
// OPTIONAL: pick that represents yes/no options
//
// @param Field:Longtext Approval Results
// OPTIONAL: Long Text field (rich) to build an approval matrix
//
//
// Modified by: Marcus Russell Mar 12, 2008 to log signature comments and dates
// Based on similar by: JP Gaconnier - Novus Solutions
function print(s)
{
    Packages.mks.util.Logger.message("DEBUG", 1, s);
}

// pre-empt the script
function abort(s) {
	eb.abortScript( s, true );
}

function getParameters() {
	appRequiredField = params.getParameter("Approvers Required");
	if( ( appRequiredField == null ) || ( appRequiredField.length() == 0 ) ) {
		abort( "Approvers Required parameter is null or zero length." );
	}

	appGivenField = params.getParameter("Approvals Noted");
	if( ( appGivenField == null ) || ( appGivenField.length() == 0 ) ) {
		abort( "Approvals Noted parameter is null or zero length." );
	}
	
	appCommentField = params.getParameter("Comments Log");
	
	appDateField = params.getParameter("Most Recent Approval Date");
	
	approvalResultsField = params.getParameter("Approval Results");
	
	approvalDecisionField = params.getParameter("Approval Decision");

}

function getUserSet( s ) {
	var response;
	var users = idb.getNewFieldValue( s );
	
	if( users == null ) {
		response = new java.util.HashSet();
	} else {
		if( users.getClass().getName().equals( "java.lang.String" ) ) {
			response = new java.util.HashSet();
			response.add(users);
		} else {
			response = users;
		}
	}
	return response;
}

function setUserSet( field, value ) {
	var userString = new java.lang.String();
	var userIterator = value.iterator();
	while( userIterator.hasNext() ) {
		var nextUser = userIterator.next();
		if( userIterator.hasNext() ) {
			userString += nextUser + ",";
		} else {
			userString += nextUser;
		}
	}
	idb.setFieldValue( field, userString );
}

function deletePendingRows() {
	var table = new String(idb.getNewFieldValue(approvalResultsField));
	var regEx = new RegExp("<tr id='(.+?)' class='pending'>\\W<td id='\\1'(.+?)<\/tr>", "g");
	table = table.replace(regEx, "");
	idb.setFieldValue(approvalResultsField, table);
}

function autoAdvance() {
	var autoAdvanceState = params.getParameter("All approved state");
	var rejectedState = params.getParameter("One rejected state");

	if( ( autoAdvanceState == null ) || ( autoAdvanceState.length() == 0 ) ) {
		// print( "Not auto-advancing - the state wasn't filled in." );
	} else {
		if (idb.getNewFieldValue(approvalDecisionField).toLowerCase() == "no") {
			idb.setFieldValue("State", rejectedState);
			deletePendingRows();
			idb.setFieldValue(appGivenField, null);
			return;
		}

		var allApprovalsGiven = true;
		
		var approversRequired = getUserSet( appRequiredField );
		var approvalsGiven = getUserSet( appGivenField );
		
		var approversRequiredIterator = approversRequired.iterator();
		while( approversRequiredIterator.hasNext() && allApprovalsGiven ) {
			if( !approvalsGiven.contains( approversRequiredIterator.next() ) ) {
				allApprovalsGiven = false;
			}
		}
		
		if( allApprovalsGiven ) {
			idb.setFieldValue("State",autoAdvanceState);
		}
	}

}

function getUserLink()
{
	var userBean = sb.getUserBean(sb.getCurrentUser());
	var displayName = (userBean.getFullName() != null)?userBean.getFullName() + " (" + sb.getCurrentUser()+ ")":sb.getCurrentUser();
	var email = userBean.getEmailAddress();
	if (email != null)
		return "<a href='mailto:" + email + "?subject=Approval of " + idb.getNewFieldValue("Type") + " " + idb.getID() + ": " + idb.getNewFieldValue("Summary") + "&body=URL: " + eb.getHostURL() + "/im/issues?selection=" + idb.getID() + "'>" + displayName + "</a>";
	else
		return displayName;
}

function getItemLink(bean)
{
	return "<a href='mks:///item?itemid=" + bean.getID() + "'>" + bean.getID() + "</a>"
}

function getApprovalImage(decision)
{
	if (decision == "yes")
		return "<img src='" + eb.getHostURL() + "/images/icons/Yes.png'>  Yes"
	else
		return "<img src='" + eb.getHostURL() + "/images/icons/No.png'>  No"
}

function main() {

	var currentUser = sb.getCurrentUser();
	
	getParameters();
	
	var approversRequired = getUserSet( appRequiredField );
	var approvalsGiven = getUserSet( appGivenField );
	
	if( !approversRequired.contains( currentUser ) ) {
		abort( "Since your approval is not required for this issue, you cannot sign it." );
	}
	
	if( approvalsGiven.contains( currentUser ) ) {
		abort( "Since your approval has already been given this issue, you cannot sign it." );
	}
	
	if( !sb.isSigned() || !sb.getSigner().equalsIgnoreCase(currentUser) ) { 
		sb.signatureRequired("Please sign this issue to note your approval." )
	}
	
	// if they are rejecting they must provide a comment
	if (idb.getNewFieldValue(approvalDecisionField).toLowerCase() == "no" && sb.getSignatureComment().length() <= 0)
	{
		sb.signatureRequired("You must provide comments when rejecting." )
	}

	if( sb.isSignatureFailure() ) {
		abort( "Your signature was invalid." );
	}
	
	approvalsGiven.add( currentUser );
	
	setUserSet( appGivenField, approvalsGiven );
	
	if (approvalResultsField != null && approvalDecisionField)
	{
		var table = new String(idb.getNewFieldValue(approvalResultsField));
		var user = sb.getCurrentUser();
		var decision = idb.getNewFieldValue(approvalDecisionField).toLowerCase();
		var newRow = "";
		if (decision == "yes")
			newRow = "<tr id='" + user + "' class='approval'>";
		else
			newRow = "<tr id='" + user + "' class='rejection'>";
		newRow += "	<td id='" + user + "' class='approval-user'>" + getUserLink() + "</td>";
		newRow += "	<td id='" + user + "' class='approval-decision'>" + getApprovalImage(decision) + "</td>";
		newRow += "	<td id='" + user + "' class='approval-date'>" + java.util.Date() + "</td>";
			
		if (sb.getSignatureComment())
			newRow += "	<td id='" + user + "' class='approval-comment'>" + sb.getSignatureComment() + "</td>";
		else
			newRow += "	<td id='" + user + "' class='approval-comment'><i>*** No Comments Provided ***</i></td>";	
		newRow += "</tr>";
		
		var regEx = new RegExp("<tr id='" + user + "'.*?</tr>", "");
		table = table.replace(regEx, newRow);

		idb.setFieldValue(approvalResultsField, table);
	}
	
	if ( sb.getSignatureComment() && sb.getSignatureComment().length() > 0 ) {
    if ( appCommentField && appCommentField.length() > 0 ) {
      idb.setFieldValue( appCommentField, sb.getSignatureComment() );
    }        
  }

  if ( appDateField.length() > 0 ) {
    idb.setDateFieldValue(appDateField, new java.util.Date());  
  }  
  autoAdvance();

}

var appRequiredField;
var appGivenField;
var allApprovedState;
var appCommentField;
var appDateField;

var approvalResultsField;
var approvalDecisionField;

var params = bsf.lookupBean("parametersBean");
var eb = bsf.lookupBean("siEnvironmentBean");
var sb = bsf.lookupBean("imServerBean");
var idb = bsf.lookupBean("imIssueDeltaBean");
main();
