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