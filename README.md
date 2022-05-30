# Task Management System (TMS)
Made for assignment

<h2>Introduction</h2>
A app made with NodeJS and MySQL.

<h2>App Features</h2>

All users required to log in before accessing the features of the app.

<h3>Admin:</h3>
<ul>
    <li>Create a new user account</li>
    <li>Update other user account details (i.e. change email, password, and account status)</li>
    <li>Create a new group</li>
    <li>Assign group to other user</li>
</ul>

<h3>User:</h3>
<ul>
    <li>Change Password</li>
    <li>Update Email</li>
</ul>

<h3>Project Lead:</h3>
<ul>
    <li>Create a new application</li>
    <li>Create a new task for the specific application and specific plan</li>
    <li>Promote task to "close" state or Demote task to "doing" state</li>
</ul>

<h3>Project Manager:</h3>
<ul>
    <li>Create a new plan for the specific application</li>
    <li>Approve task once it is in "open" state</li>
</ul>

<h3>Team Member:</h3>
<ul>
    <li>Work on the task or return task to "to-do-list" state</li>
    <li>Send an email notification to project lead when promoted the task from "doing" to "done" state</li>
</ul>

<h2>Docker Commands</h2>

<h3>Build Docker Container:</h3>
docker build -t tmsys_img .

<h3>Run Docker Container with env file:</h3>
docker run --env-file ./sample.env --name tmsys -p 3000:3000 tmsys_img

<h3>Start/Stop Docker Container</h3>
docker ps -> find the container 
docker stop tmsys -> stop container
docker start tmsys -> start container