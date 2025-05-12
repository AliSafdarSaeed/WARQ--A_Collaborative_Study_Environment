const Project = require("../models/projectModel");
const { notifyUserById } = require("../services/notificationService");

exports.createProject = async (req, res) => {
  try {
    const { title, description, subject, tags, isPublic } = req.body;
    const userId = req.user._id;

    const project = await Project.create({
      title,
      description,
      subject,
      tags,
      isPublic,
      createdBy: userId,
      members: [userId],
    });

    res.status(201).json({ success: true, data: project });
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({ success: false, message: "Failed to create project" });
  }
};

exports.getUserProjects = async (req, res) => {
  try {
    const userId = req.user._id;
    const projects = await Project.find({ members: userId }).populate("createdBy", "name email");
    res.json({ success: true, data: projects });
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ success: false, message: "Failed to fetch projects" });
  }
};

exports.joinProject = async (req, res) => {
  try {
    const { projectId } = req.body;
    const userId = req.user._id;
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });
    if (!project.members.includes(userId)) {
      project.members.push(userId);
      await project.save();
    }
    res.status(200).json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to join project" });
  }
};

exports.setRole = async (req, res) => {
  try {
    const { projectId, userId, role } = req.body;
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });
    // Only allow project creator to set roles
    if (!project.createdBy.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: "No permission" });
    }
    project.roles.set(userId, role);
    await project.save();
    res.status(200).json({ success: true, data: project.roles });
  } catch (e) {
    res.status(500).json({ success: false, message: "Failed to set role" });
  }
};

exports.inviteToProject = async (req, res) => {
  try {
    const { projectId, userId } = req.body;
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });
    if (!project.members.includes(userId)) {
      project.members.push(userId);
      await project.save();
    }
    await notifyUserById(userId, "Project Invitation", `You've been invited to join the project "${project.title}".`);
    res.status(200).json({ success: true, message: "User invited and notified." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to invite user" });
  }
};