const express = require("express");
const Group = require("../models/GroupModel");
const { protect, isAdmin } = require("../middleware/authMiddleware");

const groupRouter = express.Router();

groupRouter.post("/", protect, async (req, res) => {
  try {
    const { name, description } = req.body;
    const group = await Group.create({
      name,
      description,
      admin: req.user._id,
      members: [req.user._id],
    });
    const populatedGroup = await Group.findById(group._id)
      .populate("admin", "username email")
      .populate("members", "username email");
    res.status(201).json({ populatedGroup });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

groupRouter.get("/", protect, async (req, res) => {
  try {
    const groups = await Group.find()
      .populate("admin", "username email")
      .populate("members", "username email");
    res.json(groups);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

groupRouter.post("/:groupId/join", protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }
    if (group.members.includes(req.user._id)) {
      return res.status(400).json({ message: "Already a member of this group" });
    }
    group.members.push(req.user._id);
    await group.save();
    res.json({ message: "Successfully joined this group" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

groupRouter.post("/:groupId/leave", protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }
    if (!group.members.includes(req.user._id)) {
      return res.status(400).json({ message: "Not a member of this group" });
    }
    if (group.admin.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "Admin cannot leave the group" });
    }
    group.members = group.members.filter(
      (memberId) => memberId.toString() !== req.user._id.toString()
    );
    await group.save();
    res.json({ message: "Successfully left the group" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Edit group — sirf admin kar sakta hai
groupRouter.put("/:groupId", protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }
    if (group.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only admin can edit the group" });
    }
    const { name, description } = req.body;
    group.name = name || group.name;
    group.description = description || group.description;
    await group.save();
    const updatedGroup = await Group.findById(group._id)
      .populate("admin", "username email")
      .populate("members", "username email");
    res.json(updatedGroup);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete group — sirf admin kar sakta hai
groupRouter.delete("/:groupId", protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }
    if (group.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only admin can delete the group" });
    }
    await Group.findByIdAndDelete(req.params.groupId);
    res.json({ message: "Group deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = groupRouter;