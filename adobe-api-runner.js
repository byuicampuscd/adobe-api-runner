var xmldoc = require('xmldoc');
var https = require('https');
var fs = require('fs');
var cli = require('./cli');

class Session {
	constructor(settings,callback){
		this.settings = settings;
		if(!settings.coursesFolderID || !settings.adminID || !settings.templateID){
			console.error("Missing some of the ids, please read the documentation, and add those IDs to the settings file");
			return
		}
		this.login(settings.loginInfo, ableToLogin => {
			if(ableToLogin){
				callback();
				return
			} else {
				console.log("Unable to login");
			}
		})
	}
	sendRequest(queryString,xmlPath,callback){
		
		var req = https.request({host:this.settings.domain+".adobeconnect.com",path: "/api/xml?action="+queryString, headers: { 'cookie' : this.cookie} }, res => {
			var body = '';
			res.on('data', chunk => { body += chunk})
			res.on('end', () => {
				if(xmlPath)
					callback(new xmldoc.XmlDocument(body).valueWithPath(xmlPath));
				else
					callback(new xmldoc.XmlDocument(body));
			})
		})
		req.on('error', console.error);
		req.end();
	}
	
	login(loginInfo,callback){
		var options = {
			host: this.settings.domain+".adobeconnect.com",
			path: "/api/xml",
			method: "POST",
			headers: { 'Content-Type' : 'application/xml' }
		}
		var postData = "<params><param name='action'>login</param><param name='login'>"+loginInfo.username+"</param><param name='password'>"+loginInfo.password+"</param></params>"

		var req = https.request(options, res => {
			this.cookie = res.headers['set-cookie'][0];
			res.on('data', body => {
				// checking to see if we were able to login
				if(new xmldoc.XmlDocument(body).valueWithPath("status@code") === "ok")
					callback(true);
				else
					callback(false);
			});
		})
		req.on('error', console.error);
		req.write(postData);
		req.end();
	}

	
}

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

class Class {
	constructor(courseName,sectionNum,numOfMeetings){
		// Conforming to Naming Conventions
		courseName = courseName.replace(" ","_").toUpperCase();
		sectionNum = ("00"+sectionNum).slice(-2);
		var meetingName = courseName.replace("_","") + "_G0" + sectionNum + "_";
		this.savedCourseIDs = {};

		// Creates the Course folder if not already created
		this.getFolderID(session.settings.coursesFolderID,courseName, id => {
			// I have a bug where when a new course folder is created,
			// the next calls to find that new folder fail, probably
			// because the search is just getting a cached result
			// so I am saving the ids of all the folders I create
			if(id == undefined){
				if(this.savedCourseIDs[courseName] != undefined)
					this.courseID = savedCourseIDs[courseName];
				else {
					console.error("Error creating the course folder for "+courseName)
					return;
				}
			}
			this.savedCourseIDs[courseName] = id;
			this.courseID = id;
			
			
			this.findFolderID(this.courseID,"SET_"+sectionNum, id => {
				// section already created, only need to proceed if 
				// they require more meetings than we already have
				if(id){
					this.sectionID = id;
					this.getNumOfMeetings(this.sectionID, actualNum => {
						if(actualNum == numOfMeetings){
							console.error(courseName+"-"+sectionNum+" has already been created with "+numOfMeetings+" meetings");
							return;
						} else if(numOfMeetings < actualNum){
							console.error(courseName+"-"+sectionNum+" has already been created with "+actualNum+" meetings, you only requested "+numOfMeetings);
							return;
						} else if(numOfMeetings > actualNum){
							console.log("Creating "+(numOfMeetings-actualNum)+" additional meetings for "+courseName+"-"+sectionNum)
							for(var i = actualNum+1; i <= numOfMeetings; i++){
								this.createMeeting(this.sectionID,meetingName+("000"+i).slice(-3));
							}
						}
					})
				}
				// section has not already been created, 
				// so feel free to create all meetings
				else {
					this.createFolder(this.courseID,"SET_"+sectionNum, id => { 
						if(id == undefined)
							console.error("Error creating "+courseName+"-"+sectionNum)
						else {
							this.sectionID = id;
							// Now we finally get to create the meetings!
//							console.log("Creating the meetings for "+courseName+"-"+sectionNum)
							for(var i = 1; i <= numOfMeetings; i++){
								this.createMeeting(this.sectionID,meetingName+("000"+i).slice(-3));
							}
						}
					})
				}
			})
		});
	}
	findFolderID(parentFolderID,folderName,callback){
		session.sendRequest("sco-contents&sco-id="+parentFolderID+"&filter-name="+folderName,"scos.sco@sco-id", callback)
	}
	createFolder(parentFolderID,folderName,callback){
		session.sendRequest("sco-update&folder-id="+parentFolderID+"&type=folder&name="+folderName,"sco@sco-id", callback)
	}
	// Creates the folder if not found
	getFolderID(parentFolderID,folderName,callback){
		this.findFolderID(parentFolderID,folderName, id => {
			if(id)
				callback(id);
			else {
				this.createFolder(parentFolderID,folderName, callback)
			}
		})
	}
	getNumOfMeetings(folderID,callback){
		session.sendRequest("sco-contents&sco-id="+folderID,null, xmlDoc => {
			callback(xmlDoc.childNamed("scos").childrenNamed("sco").length)
		})
	}
	createMeeting(parentFolderID,meetingName){
		// TODO: Need to insert template sco-id
		var queryString = "sco-update&folder-id="+this.sectionID+"&type=meeting&name="+meetingName+"&source-sco-id="+session.settings.templateID+"&url-path="+meetingName.toLowerCase();
		session.sendRequest(queryString,"sco@sco-id", id => {
			if(id == undefined)
				console.error("Error creating "+meetingName);
			else {
				// Make this meeting public
				var queryString = "permissions-update&acl-id="+id+"&principal-id=public-access&permission-id=view-hidden";
				session.sendRequest(queryString,"status@code", status => {
					if(status != "ok")
						console.error("Error making "+meetingName+" public");
					else {
						// Make the teachers the host of the meeting
						var queryString = "permissions-update&acl-id="+id+"&principal-id="+session.settings.adminID+"&permission-id=host";
						session.sendRequest(queryString,"status@code", status => {
							if(status != "ok")
								console.error("Error making the teachers the host of "+meetingName);
						})
					}
				})
			}
		})
	}
}

var session;

cli.getSettings(settings => {
	if(!settings) {return}
	session = new Session(settings,() => {
		fs.readFile(settings.csv,'utf8',(err,data) => {
			if(err) { console.error(err) }
			// Parsing the CSV in one line!
			var array = data.split('\r\n').slice(1,-1).map( x => x.split(','));
			for(var i = 0; i < array.length; i++){
				// checking for valid data
				if(array[i][0] && array[i][1]){
					// calling my ginourmous Class constructor for each element
					var myClass = new Class(array[i][0],array[i][1],(array[i][2]?(array[i][2]*1):10));
				} else {
					console.log("There was a problem with line "+(i+2)+" in the file");
				}
			}
		})
	})
})