# Adobe API Runner
A command line program, which creates adobe connect meetings which it reads from a csv file

### How To Install
- Install [Node.js](https://nodejs.org/en/)
- Open the Command line in the folder that you installed it on and run

### How to Find the Adobe Connect IDs
##### Courses Folder ID
- Log into Adobe Connect and navigate to the folder that contains all the course folders
- Look at the URL and find the part that says "sco-id"
`...&sco-id=1018231140&...`
- copy and paste that number into the settings
`"coursesFolderID":1018231140,`

##### Template ID
- Go find the template that you want all the meetings to be created from ( In our case the one that has the "Auto Promote Participants to Presenters" option on)
- Navigate to that meeting so you are looking at all of its Meeting Information
- Again look at its URL and find the part that says "sco-id"
`...&sco-id=1017911573&...`
- copy and paste that number into the settings
`"templateID":1017911573`


##### Admin Group ID
- While loggin to Adobe Connect go to Administration > Users and Groups
- Then select the group that all the teachers are under
- Press the "Information" button in the bottom right corner
- Once again look at the URL and find the part that says "principal-id" 
`...&principal-id=1017936982&...`
- copy and paste that number into the settings
`"adminID":1017936982,`
