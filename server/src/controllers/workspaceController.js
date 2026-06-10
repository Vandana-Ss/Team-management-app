const Workspace = require('../models/workspaceModel');
const Member = require('../models/memberModel')
const Task = require('../models/taskModel')
const Archive = require('../models/archiveModel')
const { nanoid } = require('nanoid')

const createWorkspace = async (req, res) => {
    try {
        const { name } = req.body
        const workspace = await Workspace.create({
            name,
            owner: req.user._id,
            inviteCode: nanoid(10)
        })

        // workspace creator is given owner role by default
        await Member.create({
            user: req.user._id,
            workspace: workspace._id,
            role: 'owner',
            status: 'active'
        })

        res.status(201).json(workspace)
    }
    catch (err) {
        res.status(500).json({ message: err.message })
    }
}

const joinWorkspace = async (req, res) => {
    const { inviteCode } = req.params
    const userId = req.user._id

    try {
        const workspace = await Workspace.findOne({ inviteCode })
        if (!workspace) {
            return res.status(404).json({ message: 'Invalid invite code' })
        }

        const alreadyMember = await Member.findOne({
            user: userId,
            workspace: workspace._id
        })

        if (alreadyMember) {
            return res.status(400).json({ message: 'You are already a member or have a pending request' })
        }

        await Member.create({
            user: userId,
            workspace: workspace._id,
            role: 'member',
            status: 'pending'
        })

        res.status(200).json({ message: 'Join request sent. Waiting for admin approval.' })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

const getInviteInfo = async (req, res) => {
    try {
        const { inviteCode } = req.params
        const workspace = await Workspace.findOne({ inviteCode }).select('name')

        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" })
        }

        res.json(workspace)
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

const getWorkspaceMembers = async (req, res) => {
    try {
        const { workspaceId } = req.params

        const members = await Member.find({ workspace: workspaceId })
            .populate('user', 'name email')

        res.status(201).json(members)
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

const getUserWorkspaces = async (req, res) => {
    try {
        const memberships = await Member.find({
            user: req.user._id,
            status: { $in: ['active', null, undefined] }
        }).populate({
            path: 'workspace',
            model: 'Workspace',
            match: { isArchived: { $ne: true } },
            populate: {
                path: 'owner',
                select: 'name'
            }
        })

        const activeMemberships = memberships.filter(m => m.workspace && m.workspace._id)

        const allWorkspaceIds = activeMemberships.map(m => m.workspace._id)
        const uniqueMembers = await Member.distinct('user', {
            workspace: { $in: allWorkspaceIds }
        })

        const workspaceStats = await Promise.all(activeMemberships.map(async (m) => {
            const workspace = typeof m.workspace.toObject() === 'function' ? m.workspace.toObject() : m.workspace

            // Count active members
            const totalCount = await Member.countDocuments({ workspace: workspace._id })

            const taskCount = await Task.countDocuments({
                workspace: m.workspace._id,
                isArchived: { $ne: true }
            })

            return {
                _id: m.workspace._id,
                name: m.workspace.name,
                inviteCode: m.workspace.inviteCode,
                isArchived: m.workspace.isArchived,
                totalCount: totalCount,
                taskCount: taskCount,
                createdAt: m.workspace.createdAt,
                updatedAt: m.workspace.updatedAt,
                owner: m.workspace.owner || { name: "System" },
                role: m.role
            }
        }))

        res.status(200).json({
            workspaces: workspaceStats,
            totalUniqueCollaborators: uniqueMembers.length
        })
    }
    catch (err) {
        console.log('Dashboard Fetch error: ', err)
        res.status(500).json({ message: err.message })
    }
}

const deleteWorkSpace = async (req, res) => {
    try {
        const { workspaceId } = req.params;

        const deletedWorkspace = await Workspace.findByIdAndDelete(workspaceId);

        if (!deletedWorkspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        await Member.deleteMany({ workspace: workspaceId });

        res.json({
            message: "Workspace and all associated members deleted successfully",
            id: workspaceId
        });
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

const updateWorkspace = async (req, res) => {
    try {
        const workSpace = await Workspace.findByIdAndUpdate(
            req.params.workspaceId,
            { name: req.body.name },
            { new: true }
        )
        res.json(workSpace)
    }
    catch (err) {
        res.status(500).json({ message: err.message })
    }
}

const updateMemberRole = async (req, res) => {
    try {
        const { workspaceId, memberId } = req.params
        const { newRole } = req.body

        const requester = await Member.findOne({
            workspace: workspaceId,
            user: req.user._id
        })

        const role = requester?.role?.toLowerCase()
        if (role !== 'admin' && role !== 'owner') {
            return res.status(403).json({ message: "Only Admins or Owners can change roles" })
        }

        const updatedMembership = await Member.findByIdAndUpdate(
            memberId,
            { role: newRole.toLowerCase() },
            { new: true }
        )

        if (!updatedMembership) {
            return res.status(404).json({ message: "Member record not found" })
        }

        res.status(200).json(updatedMembership)
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

const searchWorkspaceMembers = async (req, res) => {
    try {
        const { workspaceId } = req.params
        const { query } = req.query

        const members = await Member.find({ workspace: workspaceId })
            .populate({
                path: 'user',
                match: {
                    $or: [
                        { name: { $regex: query, $options: 'i' } },
                        { email: { $regex: query, $options: 'i' } }
                    ]
                },
                select: 'name email'
            })

        const filtered = members.filter(m => m.user !== null).map(m => m.user)

        res.status(200).json(filtered)
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

const updateMemberStatus = async (req, res) => {
    try {
        const { workspaceId, memberId } = req.params
        const { action } = req.body

        const requester = await Member.findOne({ workspace: workspaceId, user: req.user._id })
        if (!requester || (requester.role !== 'admin' && requester.role !== 'owner')) {
            return res.status(403).json({ message: "Only admins can approve members" })
        }

        if (action === 'reject') {
            await Member.findByIdAndDelete(memberId)
            return res.status(200).json({ message: "Request rejected" })
        }

        const updatedMember = await Member.findByIdAndUpdate(
            memberId,
            { status: 'active' },
            { new: true }
        ).populate('user', 'name email')

        res.status(200).json(updatedMember)
    }
    catch (err) {
        res.status(500).json({ message: err.message })
    }
}

const workspaceArchived = async (req, res) => {
    try {
        const { workspaceId } = req.params
        const { action } = req.body

        const requestor = await Member.findOne({ workspace: workspaceId, user: req.user._id })
        if (!requestor || (requestor.role !== 'admin' && requestor.role !== 'owner')) {
            return res.status(403).json({ message: "Only admins can archive a workspace" })
        }

        if (action === 'archive') {
            const archived = await Workspace.findByIdAndUpdate(
                workspaceId,
                { isArchived: true, wasRestored: false },
                { new: true }
            )

            if (!archived) {
                return res.status(404).json({ message: "Workspace not found" })
            }

            await Task.updateMany(
                { workspace: workspaceId },
                { isArchived: true }
            )

            const existing = await Archive.findOne({ workspace: workspaceId })

            if (!existing) {
                await Archive.create({
                    itemType: 'workspace',
                    workspace: workspaceId,
                    archivedBy: req.user._id
                })
            } else {
                return res.status(400).json({ message: 'Workspace already archived' })
            }

            return res.status(200).json({ message: 'Task archived successfully', workspace: archived })
        }

        if (action === 'restore') {
            await Workspace.findByIdAndUpdate(workspaceId, { isArchived: false, wasRestored: true })
            const individualTasksArchived = await Archive.find({ itemType: 'task' })
            const individuallyArchivedTasksId = individualTasksArchived.map(a => a.task)

            await Task.updateMany(
                {
                    workspace: workspaceId,
                    _id: { $nin: individuallyArchivedTasksId }
                },
                { isArchived: false, wasRestored: true }
            )

            await Archive.deleteOne({workspace: workspaceId})

            return res.status(200).json({ message: "Workspace restored successfully" })
        }

        return res.status(400).json({ message: "Invalid action provider" })

    }
    catch (err) {
        console.error("Archive Error:", err)
        res.status(500).json({ message: err.message })
    }
}

const leaveWorkspace = async (req, res) => {
    try {
        const { workspaceId } = req.params

        const membership = await Member.findOne({ user: req.user._id, workspace: workspaceId })

        if (!membership) {
            return res.status(404).json({ message: 'You are not a member of this workspace' })
        }

        if (membership.role === 'owner') {
            return res.status(403).json({ message: 'Owners cannot leave a workspace. Transfer ownership or delete it.' })
        }

        await Member.findByIdAndDelete(membership._id)

        res.json({ message: 'Left workspace successfully' })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

module.exports = {
    joinWorkspace,
    createWorkspace,
    getWorkspaceMembers,
    getUserWorkspaces,
    deleteWorkSpace,
    updateMemberRole,
    updateWorkspace,
    searchWorkspaceMembers,
    getInviteInfo,
    updateMemberStatus,
    workspaceArchived,
    leaveWorkspace
}