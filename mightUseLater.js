//This goes in the session class

getMissingIdOptions(callback){
	var options = {};
	if(!this.settings.coursesFolderID){
		options.hasCourseFolder = false;
	}
	if(!this.settings.adminID){
		options.adminOptions = {};
		this.sendRequest("principal-list&filter-has-children=true",null, xml => {
			xml.childNamed("principal-list").children.forEach( elem => {
				options.adminOptions[elem.valueWithPath("name")] = elem.attr['principal-id']	
			})
			this.getTemplates(options,callback);
		})
	}

}
getTemplates(options,callback){
	if(!this.settings.templateID){
		options.templateOptions = {};
		this.sendRequest("report-bulk-objects&filter-like-name=templates",null, bulk => {
			bulk.childNamed("report-bulk-objects").children.forEach( elem => {
				if(elem.valueWithPath("name") == "Shared Templates"){
					this.sendRequest("sco-contents&sco-id="+elem.attr['sco-id'],null, templates => {
						templates.childNamed("scos").children.forEach( elem => {
							options.templateOptions[elem.valueWithPath("name")] = elem.attr['sco-id']
						})
						this.requestMissingIds(options,callback);
					})
				}
			})
		})
	}
}
requestMissingIds(options,callback){
	cli.getMissingIds(options);
}

//These go in the cli module

function getFolderId(options,missingData,callback){
	if(options.hasCourseFolder == false){
		console.log("\nI need the 'sco-id' of the folder that contains all the courses")
		console.log("To get it, I need you to login into adobe connect, and navigate to that folder")
		console.log("When you get there, look at the url, it should look something like this:")
		console.log("der/list?filter-rows=100&filter-start=0&sco-id=1018231140&tab-i")
		console.log("                                               ^^^^^^^^^^")
		read({ prompt: 'I need you to copy and paste that number to here: '}, (err, number) => {
			if(err) { callback(err); return }
			settings.coursesFolderID = number;
			missingData.coursesFolderID = number;
			getAdminId(options,missingData,callback)
		})
	}
//	getAdminId(options,missingData,callback)
//	return
}
function getAdminId(options,missingData,callback){
	if(options.adminOptions){
		var number = 1;
		console.log("I also need to know which group all the teachers are in")
		console.log("so that the teachers can be the host of the meetings")
		for(name in options.adminOptions){
			console.log(number+". "+name)
			number++
		}
		read({ prompt: 'Enter the number of the correct group'}, (err, number) => {
			if(err) { callback(err); return }
			console.log(number);
			return
		})
	}
}

// Instructor Class

class Instructor {
	constructor(firstName,lastName,email){
		this.firstName = firstName;
		this.lastName = lastName;
		this.email = email;
		// Checking to see if proffessor has already been created
		this.alreadyExists( err => {
			if(err) { console.error(err); return }

			// Create the Instructor
			this.createInstructor( err => {
				if(err) { console.error(err); return }

				// Add Instructor to Instructor Group
				this.joinGroup( err => { if(err) { console.error(err) } });


			})
		})
	}
	alreadyExists(callback){
		session.sendRequest("principal-list&filter-email="+this.email,"principal-list.principal@principal-id", id =>{
			if(id == undefined)
				callback(null);
			else
				callback(this.firstName+" "+this.lastName+" has already been created")
		})
	}
	createInstructor(callback){
		var queryString = "principal-update&first-name="+this.firstName+"&last-name="+this.lastName+"&login="+this.email+"&password=byuitemp123&type=user&send-email=true&has-children=0&email="+this.email;
		session.sendRequest(queryString,"principal@principal-id",id => {
			this.id = id;
			if(id == undefined)
				callback("Error creating "+this.firstName+" "+this.lastName);
			else
				callback(null);
		})
	}
	// TODO: somehow find where to get this id for the proffesor vvvv
	joinGroup(callback){
		var queryString = "group-membership-update&group-id="+1017936982+"&is-member=true&principal-id="+this.id;
		session.sendRequest(queryString,"status@code", ok => {
			if(ok == "ok")
				callback(null)
			else
				callback("Error adding "+this.firstName+" "+this.lastName+" to instructor group")
		})
	}
}
