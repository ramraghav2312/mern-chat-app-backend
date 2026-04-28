const express = require("express");
const Message = require("../models/ChatModel");
const Group = require("../models/GroupModel");
const { protect } = require("../middleware/authMiddleware");

const messageRouter = express.Router();

messageRouter.post("/", protect, async (req, res) => {
  try {
    const { content, groupId } = req.body;

    // Check if user is a member of the group
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }
    if (!group.members.includes(req.user._id)) {
      return res.status(403).json({ message: "You are not a member of this group" });
    }

    const message = await Message.create({
      sender: req.user._id,
      content,
      group: groupId,
    });
    const populatedMessage = await Message.findById(message._id).populate(
      "sender",
      "username email"
    );
    res.json(populatedMessage);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

messageRouter.get("/:groupId", protect, async (req, res) => {
  try {
    const messages = await Message.find({ group: req.params.groupId })
      .populate("sender", "username email")
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = messageRouter;