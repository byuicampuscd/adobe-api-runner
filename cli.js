var read = require('read');
var argv = require('yargs').argv;
var fs = require('fs');

var settings = {
	csv: '',
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

function askForCSV(callback){
	read({prompt: "\nPlease enter the path to the CSV file that contains the courses: "}, (err,answer) => {
		if(err) {callback(err); return}
		validateFilePath(answer, err => {
			if(err) { callback(err); return}
			settings.csv = answer;
			callback(null)
			return;
		})
	})
}

function getCSV(callback){
	
	// if they gave us a file name in the command line use it
	if(argv.f){
		validateFilePath(argv.f, err => {
			if(err) { callback(err); return}
			settings.csv = argv.f;
			callback(null);
			return;
		})
	// if it isn't already in the settings then ask for it
	} else if(!settings.csv) {
		askForCSV(callback);
	} else {
		callback(null)
	}
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
		if(err) { console.error(err); return; }
		settings = JSON.parse(data);
		callback();
	})
}

function saveSettings(){
	fs.writeFile('./settings.json',JSON.stringify(settings), err => {
		if(err) {console.error(err)}
	})
}

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

module.exports = {

	getSettings: function(callback){
		getPrevSettings( () => {
			getCSV( err => {
				if(err) { console.error(err); callback(null); return; }
				getLoginInfo( err => {
					if(err) { console.error(err); callback(null); return }
					checkForNewDomain();
					callback(settings);
					saveSettings();
				})
			})
		})
	},
	getMissingIds: function(options,callback){
		var missingData = {}
		getFolderId(options,missingData,callback);
	}
}