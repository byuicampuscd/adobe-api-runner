# Adobe API Runner
A command line program, which creates adobe connect meetings which it reads from a csv file

### How To Install
- Install [Node.js](https://nodejs.org/en/)
- Download This repository
- Unzip this repository to where you want the file to sit
- Open File Explorer and navigate to this unzipped folder
- Take your list of courses, and save it as a CSV (comma delimited) to this folder
- Hold down shift and right click in the blank area of file explorer to get the option to open command prompt there
![Screen Shot](/Screen%20Shot.png)
- The black window should open up, type in `npm install`
- There should be a funny loading bar and a bunch of stuff pop onto the screen
- next type in `node adobe-api-runner`
- a prompt should pop up asking for the name of your CSV Course List
- next it will complain that it dosen't have any adobe IDs
- follow the instructions below to get those

### How to Find the Adobe Connect IDs
##### Courses Folder ID
- Log into Adobe Connect and navigate to the folder that contains all the course folders
- Look at the URL and find the part that says "sco-id"
`...&sco-id=1018231140&...`
- copy and paste that number into the settings or when prompted
`"coursesFolderID":1018231140,`

##### Template ID
- Go find the template that you want all the meetings to be created from ( In our case the one that has the "Auto Promote Participants to Presenters" option on)
- Navigate to that meeting so you are looking at all of its Meeting Information
- Again look at its URL and find the part that says "sco-id"
`...&sco-id=1017911573&...`
- copy and paste that number into the settings or when prompted
`"templateID":1017911573`


##### Admin Group ID
- While loggin to Adobe Connect go to Administration > Users and Groups
- Then select the group that all the teachers are under
- Press the "Information" button in the bottom right corner
- Once again look at the URL and find the part that says "principal-id" 
`...&principal-id=1017936982&...`
- copy and paste that number into the settings or when prompted
`"adminID":1017936982,`

### Command Line Stuff

Symbol | Description
-------|------------
`-c <courseList.csv>` |  Enter the name of the courseList as an argument
`-s <sectionList.csv>` |  Enter the name of the sectionList as an argument
`-d <domain>` | change the domain from the default 'byui' ex. `node adobe-api-runner -d benjameep   => http://benjameep.adobeconnect.com/`
`-v`   | Prints the queryString and XML when it errors, also prints out which courses are skipped
`-p`   | Saves credentials, and skips login. For debugging. Not reccomended for normal use