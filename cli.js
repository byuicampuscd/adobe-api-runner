var read = require('read');
var argv = require('yargs').argv;
var fs = require('fs');



var settings = {
	sectionList: '',
	courseList: '',
	loginInfo: {
		username: '',
		password: ''
	},
	domain: 'byui',
	coursesFolderID : 0,
	adminID : 0,
	templateID : 0
}

function validateFilePath(string,callback){
	fs.readFile(string, (err,data) => {
		if(err || string.slice(-3) != "csv")
			callback("Invalid path")
		else
			callback(null)
	})
}

function getCSVs(callback){
	// Starting another chain of async functions :P
	getArgS(callback)
}
function getArgS(callback){
	if(argv.s){
		validateFilePath(argv.s, err => {
			if(err) {
				console.log("Invalid Path")
			} else
				settings.sectionList = argv.s;
			getArgC(callback);
		})
	} else
		getArgC(callback);
}
function getArgC(callback){
	if(argv.c){
		validateFilePath(argv.c, err => {
			if(err) {
				console.log("Invalid Path")
			} else
				settings.courseList = argv.c;
			askForSectionList(callback)
		})
	} else
		askForSectionList(callback)
}
function askForSectionList(callback){
	if(!settings.sectionList){
		read({prompt: "\nPlease enter the name of the section list CSV: "}, (err,answer) => {
			if(err) {callback(err); return}
			validateFilePath(answer, err => {
				if(err) { callback(err); return}
				settings.sectionList = answer;
				askForCourseList(callback)
			})
		})
	} else
		askForCourseList(callback)
}
function askForCourseList(callback){
	if(!settings.courseList){
		read({prompt: "\nPlease enter the name of the course list CSV: "}, (err,answer) => {
			if(err) {callback(err); return}
			validateFilePath(answer, err => {
				if(err) { callback(err); return}
				settings.courseList = answer;
				callback(null)
			})
		})
	} else
		callback(null)
}

function getLoginInfo(callback){
	if(argv.p && settings.loginInfo.username && settings.loginInfo.password){
		callback(null);
	} else {
		read({ prompt: '\nUsername/Email: '}, (err, username) => {
			if(err) { callback(err); return }
			settings.loginInfo.username = username;
			read({ prompt: 'Password: ', silent: true, replace: '*' }, (err, password) => {
				if(err) { callback(err); return }
				settings.loginInfo.password = password;
				callback(null);
			})
		})
	}
}

function checkForNewDomain(){
	if(argv.d){
		settings.domain = argv.d;
	}
}

function getPrevSettings(callback){
	fs.readFile('./settings.json', 'utf8',(err,data) => {
		if(!err){ 
			settings = JSON.parse(data);
		}
		callback();
	})
}

function saveSettings(){
	// use '-p' to save your password in the settings file, and not have to keep typing it
	if(!argv.p){
		settings.loginInfo = { username: '', password: '' };
	}
	fs.writeFile('./settings.json',JSON.stringify(settings), err => {
		if(err) {console.error(err)}
	})
}

function checkForIds(callback){
	if(!settings.coursesFolderID || !settings.adminID || !settings.templateID){
		console.log("Missing some of the ids, please read the documentation on GitHub to get the following Ids\n Here is the link to github > https://github.com/byuicampuscd/adobe-api-runner < If your on windows 10 I think you can paste by right clicking in the command prompt:\n")
		getCourseFolderID( getTemplateID, callback )
	} else {
		callback(null)
	}
}
function getCourseFolderID(nextFunc, callback){
	read({ prompt: 'Courses Folder ID (sco-id): '}, (err, ID) => {
		if(err) { callback(err); return }
		settings.coursesFolderID = ID;
		nextFunc(getAdminID, callback);
	})
}
function getTemplateID(nextFunc, callback){
	read({ prompt: 'Template ID (sco-id): '}, (err, ID) => {
		if(err) { callback(err); return }
		settings.templateID = ID;
		nextFunc(callback)
	})
}
function getAdminID(callback){
	read({ prompt: 'Admin Group ID (principal-id): '}, (err, ID) => {
		if(err) { callback(err); return }
		settings.adminID = ID;
		callback(null);
	})
}

module.exports = {

	getSettings: function(callback){
		getPrevSettings( () => {
			getCSVs( err => {
				if(err) { console.error(err); callback(null); return; }
				getLoginInfo( err => {
					if(err) { console.error(err); callback(null); return }
					checkForIds( err => {
						if(err) { console.error(err); callback(null); return }
						checkForNewDomain();
						callback(settings);
						saveSettings();
					})
				})
			})
		})
	},
}
