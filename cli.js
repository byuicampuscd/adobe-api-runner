var setup = require('./adobe-api-setup')
var read = require('read');
var argv = require('yargs').argv;
var fs = require('fs');
var path = require('path')
var settingsFile = path.join(__dirname,'settings.json')

var settings;

function getLoginInfo(callback){
	if(settings.loginInfo.username && settings.loginInfo.password){
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

function saveSettings(){
	// use '-p' to save your password in the settings file, and not have to keep typing it
	var cloneSettings = JSON.parse(JSON.stringify(settings))
	if(!argv.p){
		cloneSettings.loginInfo = { username: '', password: '' };
	}
	fs.writeFile(settingsFile,JSON.stringify(cloneSettings), err => {
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

module.exports = {
	getSettings: function(callback){
        setup.main(sett => {
            settings = sett;
            getLoginInfo( err => {
                if(err) { console.error(err); callback(null); return }
                checkForIds( err => {
                    if(err) { console.error(err); callback(null); return }
                    checkForNewDomain();
                    saveSettings();
                    console.log(settings)
                })
            })
        })
	}
}
