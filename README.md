# Adobe API Runner
A command line program, which creates adobe connect meetings which it reads from a csv file

### How To Install
- Install [Node.js](https://nodejs.org/en/) and [Git](https://git-scm.com/downloads)
- Open up Command Prompt (preferably in the folder which contains your csvs if you know how)
- type or paste `npm install -g byuitechops/adobe-api-runner`
- There should be a funny loading bar and a bunch of stuff pop onto the screen
- next type in `adobe-api-setup`
- On the first run it will ask for your adobe IDs, which can be found with the instructions below
- next it will ask for your csv files
- If your command prompt in in the same folder as your csvs you can just type the name of the file else you might need to paste the full path to the files, such as `C:\Users\<me>\Documents\Adobe Connect Stuff\courseList.csv`
- to run the program, just type the command `adobe-api-runner`

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

### How to reset Adobe Connect IDs
- You are going to have to dig up the settings file and assassinate it
- It should be found in `C:\Users\<me>\AppData\Roaming\npm\node_modules\adobe-api-runner\settings.json`
- You can either edit it directly or just delete it, and the next time you run the program it will ask for the IDs again

### Command Line Stuff

Symbol | Description
-------|------------
`-d <domain>` | domain change from the default 'byui' ex. `node adobe-api-runner -d benjameep   => http://benjameep.adobeconnect.com/`
`-v`   | Verbose, Prints the queryString and XML when it errors, also prints out which courses are skipped
`-n`   | No operations, for tweaking with settings without running the actual program
`-p`   | Saves password and username as plaintext, and skips login. For debugging. Not reccomended for normal use
