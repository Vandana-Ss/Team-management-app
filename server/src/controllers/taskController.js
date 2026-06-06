const Task = require('../models/taskModel')
const Member = require('../models/memberModel')
const Archive = require('../models/archiveModel')

const createTask = async (req, res) => {
    try {
        // Updated to use primaryAssignee and secondaryAssignee from req.body
        const { title, description, priority, dueDate, primaryAssignee, secondaryAssignee } = req.body
        const { workspaceId } = req.params

        const task = await Task.create({
            title,
            description,
            priority,
            dueDate,
            primaryAssignee,
            secondaryAssignee,
            workspace: workspaceId,
            createdBy: req.user._id
        })

        res.status(201).json(task)
    }
    catch (err) {
        res.status(500).json({ message: err.message })
    }
}

const getTaskById = async (req, res) => {
    try {
        const { taskId } = req.params
        const task = await Task.findById(taskId)
            .populate('primaryAssignee', 'name email')
            .populate('secondaryAssignee', 'name email')
            .populate('createdBy', 'name')

        if (!task) {
            return res.status(404).json({ message: 'Task not found' })
        }

        res.status(200).json(task)
    }
    catch (err) {
        res.status(500).json({ message: err.message })
    }
}

const getWorkspaceTasks = async (req, res) => {
    try {
        const { workspaceId } = req.params;

        const {
            devStatus,
            unitTestStatus,
            sitStatus,
            uatStatus,
            priority,
            primaryAssignee
        } = req.query;

        let query = { workspace: workspaceId, isArchived: { $ne: true } };

        if (devStatus) query.devStatus = devStatus;
        if (unitTestStatus) query.unitTestStatus = unitTestStatus;
        if (sitStatus) query.sitStatus = sitStatus;
        if (uatStatus) query.uatStatus = uatStatus;
        if (priority) query.priority = priority;
        if (primaryAssignee) query.primaryAssignee = primaryAssignee;

        const tasks = await Task.find(query)
            .populate('primaryAssignee', 'name email')
            .populate('secondaryAssignee', 'name email')
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

const deleteTask = async (req, res) => {
    try {
        const { taskId } = req.params
        const delTask = await Task.findByIdAndDelete(taskId)

        if (!delTask) {
            return res.status(404).json({ message: 'Task not found' })
        }

        res.json({
            message: 'Task deleted',
            id: taskId
        })
    }
    catch (err) {
        res.status(500).json({ message: err.message })
    }
}

const updateTask = async (req, res) => {
    try {
        const { taskId } = req.params

        const task = await Task.findByIdAndUpdate(taskId, req.body, {
            new: true,
            runValidators: true
        })

        if (!task) {
            return res.status(404).json({ message: "Task not found" })
        }

        res.status(200).json(task)
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

const taskArchived = async (req, res) => {
    try {
        const { workspaceId, taskId } = req.params
        const { action } = req.body

        const targetTask = await Task.findById(taskId)
        if (!targetTask) {
            return res.status(404).json({ message: 'Task not found' })
        }

        const requestor = await Member.findOne({ workspace: targetTask.workspace, user: req.user._id })
        if (!requestor || (requestor.role !== 'admin' && requestor.role !== 'owner')) {
            return res.status(403).json({ message: "Only admins can archive a task" })
        }

        if (action === 'archive') {
            const archived = await Task.findByIdAndUpdate(
                taskId,
                { isArchived: true, wasRestored: false },
                { new: true }
            )

            if (!archived) {
                return res.status(404).json({ message: 'Task not found' })
            }

            const existing = await Archive.findOne({ task: taskId })

            if (!existing) {
                await Archive.create({
                    itemType: 'task',
                    task: taskId,
                    archivedBy: req.user._id
                })
            }else{
                return res.status(500).json({message: 'Task already archived'})
            }

            return res.status(200).json({ message: 'Task archived successfully', task: archived })
        }

        if (action === 'restore') {
            const restored = await Task.findByIdAndUpdate(
                taskId,
                { isArchived: false, wasRestored: true },
                { new: true }
            )

            await Task.findByIdAndUpdate(taskId, { isArchived: false, wasRestored: true })
            await Archive.deleteOne({ task: taskId })

            return res.status(200).json({ message: 'Task restored successfully', task: restored })
        }

        return res.status(400).json({ message: "Invalid request" })
    }
    catch (err) {
        console.log('Task archive error: ', err)
        res.status(500).json({ message: err.message })
    }
}

module.exports = { createTask, getWorkspaceTasks, deleteTask, updateTask, getTaskById, taskArchived }