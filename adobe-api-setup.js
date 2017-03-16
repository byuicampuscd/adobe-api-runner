#!/usr/bin/env node

var read = require('read');
var fs = require('fs');
var path = require('path')
var settingsFile = path.join(__dirname, 'settings.json')
var run = require('npm-run')

function call(runMe) { return runMe(...[...arguments].slice(1)) }

function getIDs(settings){
    console.log("Missing some of the ids, please read the documentation on GitHub to get the following Ids\nYou should be able to paste into the command line by right-clicking")
    run.exec("start https://github.com/byuitechops/adobe-api-runner#how-to-find-the-adobe-connect-ids", () => {})
    // call, calls the function that is returned from getInput
    return call(getInput(settings,'coursesFolderID','Courses Folder ID (sco-id): '),settings)
                .then(getInput(settings,'templateID','Template ID (sco-id): '))
                .then(getInput(settings,'adminID','Admin Group ID (principal-id): '))
                .then(saveSettings)
}
function getFiles(settings){
    console.log("Please enter the path (or just name if you are in the same directory as them) to your csv lists:")
    return getCourseList(settings)
                .catch(console.error)
                .then(getSectionList)
                .then(saveSettings)
                .catch(console.error)
}

function hasIDs(settings) {
    return new Promise((resolve, reject) => {
        if (settings.coursesFolderID && settings.adminID && settings.templateID) {
            resolve(settings)
        } else {
            reject(settings)
        }
    })
}
function hasFiles(settings){
    return new Promise((resolve, reject) => {
        if (settings.courseList && settings.sectionList) {
            resolve(settings)
        } else {
            reject(settings)
        }
    })
}
function askIfUpdateFiles(settings){
    return new Promise((resolve, reject) => {
        read({
            prompt: 'Your current files are:\n\tCourse List: '+settings.courseList+'\n\tSection List: '+settings.sectionList+'\nwould you like to change them? (y/n)'
        }, (err, ID) => {
            if (err) { reject(err) }
            if(ID[0].toUpperCase() == 'Y'){
                reject(settings)
            } else {
                resolve(settings)
            }
        })
    })
}

function readSettings(settings){
    return new Promise((resolve,reject) => {
        fs.readFile(settingsFile, 'utf8',(err,data) => {
            if(err){ resolve(settings) }
            else { resolve(JSON.parse(data)) }
        })
    })
}
function saveSettings(settings) {
    return new Promise((resolve,reject) => {
        fs.writeFile(settingsFile, JSON.stringify(settings), err => {
            if (err) { reject(err) }
            resolve(settings)
        })
    })
}

function getSectionList(settings,isError=false){
    if(isError) {
        console.log("\nError reading that file")
    }
    return call(getInput(settings,'sectionList','Section List: ',true),settings)
                .then(sett => validateFilePath(sett,'sectionList'))
                .catch(sett => getSectionList(sett,true))
}
function getCourseList(settings,isError=false){
    if(isError) {
        console.log("\nError reading that file")
    }
    return call(getInput(settings,'courseList','Course List: ',true),settings)
                .then((sett) => validateFilePath(sett,'courseList'))
                .catch(sett => getCourseList(sett,true))
}

function format(input) {
	var rawObj = path.parse(path.resolve(input));
	rawObj.ext = '.csv'
	rawObj.base = ''
	return path.format(rawObj)
}
function validateFilePath(settings,setting){
    return new Promise((resolve,reject) => {
        fs.readFile(settings[setting], (err,data) => {
            if(err) { reject(settings) }
            resolve(settings)
        })
    })
}
function getInput(settings,setting,prompt,formatIt=false){
    return function(settings) { 
        return new Promise((resolve, reject) => {
            read({ prompt: prompt}, (err, response) => {
                if (err) { reject(err) }
                if (formatIt){ settings[setting] = format(response) }
                else { settings[setting] = response }
                resolve(settings)
            })
        })
    }
}

module.exports = {    
    main: function(callback) {
        var settings = {
            sectionList: '',
            courseList: '',
            loginInfo: {
                username: '',
                password: ''
            },
            domain: 'byui',
            coursesFolderID: 0,
            adminID: 0,
            templateID: 0
        }
        readSettings(settings)
            .then(hasIDs)
            .catch(getIDs)
            .then(hasFiles)
            .then(askIfUpdateFiles)
            .catch(getFiles)
            .catch(console.error)
            .then(callback)
    }
}

// If this is being run from the command line
if(require.main === module){
    module.exports.main()
}