const Archive = require('../models/archiveModel')
const Member = require('../models/memberModel')

const getArchiveBin = async (req, res) => {
    try {
        const { workspaceId } = req.params

        const requestor = await Member.findOne({ workspace: workspaceId, user: req.user._id })
        if (!requestor || (!requestor.role === 'admin' || !requestor.role === 'owner')) {
            return res.status(403).json({ message: 'Only admins can view the archive bin.' })
        }

        const archivedItems = await Archive.find()
            .populate({
                path: 'workspace',
                match: { _id: workspaceId }
            })
            .populate({
                path: 'task',
                populate: { path: 'primaryAssignee', select: 'name email' }
            })
            .sort({ archivedAt: -1 })

        const filteredItems = archivedItems.filter(item => {
            if (item.itemType === 'workspace' && item.workspace !== null) return true
            if (item.itemType === 'task' && item.task && item.task.workspace.toString() === workspaceId) return true
            return false
        })

        res.status(200).json(filteredItems)
    }
    catch (err) {
        console.error("Fetch Archive Bin Error:", err)
        res.status(500).json({ message: err.message })
    }
}

const getGlobalArchiveBin = async (req, res) => {
  try {
    // Finds everything archived by the currently logged-in user
    const archivedItems = await Archive.find({ archivedBy: req.user._id })
      .populate('workspace', 'name')
      .populate({
        path: 'task',
        populate: { path: 'primaryAssignee', select: 'name email' }
      })
      .sort({ archivedAt: -1 })

    res.status(200).json(archivedItems)
  } catch (err) {
    console.error("Fetch Global Archive Error:", err)
    res.status(500).json({ message: err.message })
  }
}

module.exports = { getArchiveBin, getGlobalArchiveBin }