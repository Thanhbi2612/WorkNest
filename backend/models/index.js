const UserAdmin = require('./UserAdmin');
const User = require('./User');
const RefreshToken = require('./RefreshToken');
const Project = require('./Project');
const Task = require('./Task');
const Notification = require('./Notification');
const TaskFile = require('./TaskFile');
const TaskReport = require('./TaskReport');
const BaseModel = require('./BaseModel');

// Initialize model instances
const userAdminModel = new UserAdmin();
const userModel = new User();
const refreshTokenModel = new RefreshToken();
const projectModel = new Project();
const taskModel = new Task();
const notificationModel = Notification; // Already an instance
const taskReportModel = new TaskReport();

module.exports = {
    UserAdmin: userAdminModel,
    User: userModel,
    RefreshToken: refreshTokenModel,
    Project: projectModel,
    Task: taskModel,
    Notification: notificationModel,
    TaskFile: TaskFile,
    TaskReport: taskReportModel,
    BaseModel
};