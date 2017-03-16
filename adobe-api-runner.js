#!/usr/bin/env node

var xmldoc = require('xmldoc');
var https = require('https');
var fs = require('fs');
var cli = require('./cli');
var dsv = require('d3-dsv');
var asyn = require('async');
var argv = require('yargs').argv;
var ProgressBar = require('progress');
var skippedClassesFlag = false;
// number of meetings to be set if course not
// listed in courseList (used to be 10)
var defaultNumOfMeetings = 0;

class Main {
	constructor(settings,callback){
		this.settings = settings;

		this.login(settings.loginInfo, ableToLogin => {
			if(!ableToLogin){ console.error("Unable to login"); return; }

			if(!argv.n){
				this.parseFiles( err => {
					if(err){console.error(err); return}
					this.createEverything();
				});
			}
		})
	}

	sendRequest(queryString,xmlPath,callback){
		let req = https.request({host:this.settings.domain+".adobeconnect.com",path: "/api/xml?action="+queryString, headers: { 'cookie' : this.cookie} }, res => {
			let body = '';
			res.on('data', chunk => { body += chunk})
			res.on('end', () => {
				let doc;
				let failed = false;
				if(!body){
					callback(" Overwellmed Server",undefined)
				} else {
					doc = new xmldoc.XmlDocument(body);
					var status = doc.valueWithPath("status@code")
					if(status == "ok"){
						if(xmlPath)
							callback(null,doc.valueWithPath(xmlPath));
						else
							callback(null,doc);
					} else {
						callback(" Returned status:"+status+(argv.v ? "\nSent query string: "+queryString+"\n"+body : ""),undefined)
					}

				}
			})
		})
		req.on('error', callback);
		req.end();
	}
	
	login(loginInfo,callback){
		let options = {
			host: this.settings.domain+".adobeconnect.com",
			path: "/api/xml",
			method: "POST",
			headers: { 'Content-Type' : 'application/xml' }
		}
		let postData = "<params><param name='action'>login</param><param name='login'>"+loginInfo.username+"</param><param name='password'>"+loginInfo.password+"</param></params>"

		let req = https.request(options, res => {
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
	
	parseFiles(callback){
		fs.readFile(this.settings.courseList,'utf8',(err,table) => {
			if(err) { callback(err) }

			// Check to see if they have my headers
			var numMeetLookUp =  dsv.csvParse(table)
			if(numMeetLookUp.columns.indexOf("Course Name") == -1 ||
			   numMeetLookUp.columns.indexOf("Number of Meetings") == -1){
				console.error("Error: Your Course List headings didn't have 'Course Name' and 'Number of Meetings'")
				return;
			}

			// create the look up object from the courseList
			numMeetLookUp = numMeetLookUp.reduce( (obj,row) => {
				obj[row["Course Name"].replace(" ","_").toUpperCase()] = row["Number of Meetings"]
				return obj
			} ,{})

			fs.readFile(this.settings.sectionList,'utf8',(err,table) => {
				if(err) { callback(err) }

				// Check to see if they have my headers
				var data =  dsv.csvParse(table)
				if(data.columns.indexOf("Course Name") == -1 ||
				   data.columns.indexOf("Section") == -1 ||
				   data.columns.indexOf("Number of Meetings") == -1){
					console.error("Error: Your Section List headings didn't have 'Course Name' , 'Section' and 'Number of Meetings'")
					return;
				}
				
				// parse the file and conform them to naming conventions
				data = data.map( (d,i) => {
					var cName = d["Course Name"].replace(" ","_").toUpperCase();
					return {
						course : cName,
						section : ("000"+d["Section"]).slice(-3),
						numMeet : +(d["Number of Meetings"] ? +d["Number of Meetings"] : (numMeetLookUp[cName] ? numMeetLookUp[cName] : defaultNumOfMeetings))
					}
				}).filter( x => x.course )
				
				this.createSkeleton(data)

				callback(null);
			})
		})
	}

	createSkeleton(data){

		this.courses = {}

		// creating objects for every single section
		data.forEach( row => {

			// check to see if we haven't come across this one already
			if(!this.courses[row.course])
				this.courses[row.course] = { ID:0, name:row.course, sections:{}, totalMeetings:0}

			// then create the section object (if it hasn't already been)
			if(!this.courses[row.course].sections[row.section])
				this.courses[row.course].sections[row.section] = { ID:0, name:row.section, numMeet:row.numMeet, meetings:{} }

			this.courses[row.course].totalMeetings += row.numMeet;
		})

		// check and delete courses that don't contain any meetings
		// also print out the courses which are getting skipped if -v is on
		for(var course in this.courses){
			if(this.courses[course].totalMeetings == 0){
				if(!skippedClassesFlag && argv.v){
					console.log("\n\
****************************************************\n\
The following courses have been skipped,\n\
because they weren't assigned any amount of meetings\n\
check to see if they were listed in the courseList file\n\
****************************************************")
					skippedClassesFlag = true
				}
				if(argv.v){
					console.log(course)
				}
				delete this.courses[course]
			}
		}
		if(skippedClassesFlag && argv.v){
			console.log("--------------------\n")
		}

	}

	createEverything(){

		// for each course
		asyn.mapLimit(this.courses,1, (course,courCallback) => {

			this.progBar = new ProgressBar(course.name+' :percent',{
				width:10,
				total: course.totalMeetings+Object.keys(course.sections).length+2,
				clear:true,
				callback: function(){
					console.log(course.name)
				}
			})
			this.progBar.tick()


			// Create the course folder
			new Folder(this.settings.coursesFolderID,course.name, (err,courseID) => {
				if(err) { courCallback(err,0); return; }
				// save the ID
				this.courses[course.name].ID = courseID;

				this.progBar.tick()
				// For each section in this course
				asyn.map(this.courses[course.name].sections,(section,sectCallback) => {
					// Create the section folder
					new Folder(this.courses[course.name].ID,section.name, (err,sectionID) => {
						if(err) { sectCallback(err,0); return; }
						// save the ID
						this.courses[course.name].sections[section.name].ID = sectionID;

						this.progBar.tick()

						// And then do everything else
						this.createMeetings(course.name,section,sectCallback)
					})
				}, (err, results) => {
					// Done with this Course
					// results is an array of arrays of errors
					if(err)
						console.error(err)
					courCallback(err,results.length);
				})
			})
		}, (err, results) => {
			if(!err)
				console.log("Success!")
		})
	}

	createMeetings(courseName,section,sectCallback){
		
		// get list of previous meeting names
		this.getContents(section.ID, (err,prevMeets) => {
			if(err) { sectCallback("Couldn't get prev meeting names of "+courseName+"-"+section.name+err,0) }

			// Create array of all needed meeting names
			var meetings = [];
			for(var i = 1; i <= section.numMeet; i++)
				meetings.push(courseName.replace("_","") + "_G" + section.name + "_"+("000"+i).slice(-3))

			// filter out the meetings that already exist
			meetings = meetings.filter( x => prevMeets.indexOf(x) < 0)
			this.progBar.tick(section.numMeet-meetings.length)

			// Creating each of the meetings
			asyn.map(meetings, (meetingName,callback) => {

				new Meeting(meetingName,section.ID, err => {
					this.progBar.tick()
					callback(err,err)
				})

			}, (err, results) => {
				sectCallback(err,results)
			})
		})
	}

	getContents(folderID,callback){
		main.sendRequest("sco-contents&sco-id="+folderID,null, (err,doc) => {
			callback(err,doc.lastChild.children.map( x => x.firstChild.val))
		})
	}

}

class Folder{
	constructor(parentFolderID, folderName, callback){
		this.findFolderID(parentFolderID,folderName, (err,id) => {
			if(err){ callback(err,0); return}
			if(id){
				callback(err,id)
			} else {
				this.createFolder(parentFolderID,folderName, (err, id) => {
					callback(err,id)
				})
			}
		})
	}
	findFolderID(parentFolderID,folderName,callback){
		main.sendRequest("sco-contents&sco-id="+parentFolderID+"&filter-name="+folderName,"scos.sco@sco-id", callback)
	}
	createFolder(parentFolderID,folderName,callback){
		main.sendRequest("sco-update&folder-id="+parentFolderID+"&type=folder&name="+folderName,"sco@sco-id", callback)
	}
}

class Meeting{
	constructor(meetingName,sectionID,callback){
		this.meetingName = meetingName;
		this.sectionID = sectionID;
		this.callback = callback;

		// starting the chain of functions :)
		this.makeMeeting()
	}
	makeMeeting(callback){
		var queryString = "sco-update&folder-id="+this.sectionID+"&type=meeting&name="+this.meetingName+"&source-sco-id="+main.settings.templateID+"&url-path="+this.meetingName.toLowerCase();
		main.sendRequest(queryString,"sco@sco-id", (err,id) => {
			if(err) { this.callback("Couldn't create "+this.meetingName+err); return }
			this.id = id;
			this.makePublic()
		})
	}
	makePublic(id,callback){
		var queryString = "permissions-update&acl-id="+this.id+"&principal-id=public-access&permission-id=view-hidden";
		main.sendRequest(queryString,"status@code", (err, status) => {
			if(err) { this.callback("Error making "+this.meetingName+" public"+err); return}
			this.setHost()
		})
	}
	setHost(callback){
		var queryString = "permissions-update&acl-id="+this.id+"&principal-id="+main.settings.adminID+"&permission-id=host";
		main.sendRequest(queryString,"status@code", (err, status) => {
			if(err) { this.callback("Coudn't set the host of "+this.meetingName+err); return }
			this.callback(null)
		})
	}
}

let main;

cli.getSettings(settings => {
	if(!settings) {return;}
    main = new Main(settings, () => {})
})
