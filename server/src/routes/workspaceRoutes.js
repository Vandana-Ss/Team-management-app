const express = require('express')
const router = express.Router()
const { protect, checkRole } = require('../middleware/authMiddleware')
const Workspace = require('../models/workspaceModel')
const { joinWorkspace,
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
    leaveWorkspace } = require('../controllers/workspaceController')


router.post('/', protect, createWorkspace)
router.post('/join/:inviteCode', protect, joinWorkspace)

router.get('/', protect, getUserWorkspaces)
router.get('/:workspaceId/members', protect, getWorkspaceMembers)
router.get('/:workspaceId/search-members', protect, searchWorkspaceMembers)
router.get('/invite-info/:inviteCode', protect, getInviteInfo)

router.delete('/:workspaceId/leave', protect, leaveWorkspace)
router.delete('/:workspaceId', protect, checkRole(['admin', 'owner']), deleteWorkSpace)
/* 
router.patch('/:workspaceId/members/:memberId', protect, checkRole(['owner']), updateMemberRole)

router.patch('/:workspaceId', protect, checkRole(['owner']), updateWorkspace)

router.patch('/:workspaceId/members/:memberId/role', ensureAuth, workspaceController.updateMemberRole); */

router.patch('/:workspaceId/members/:memberId/role', protect, updateMemberRole)
router.patch('/:workspaceId/members/:memberId/status', protect, updateMemberStatus)
router.patch('/:workspaceId/archive', protect, workspaceArchived)

module.exports = router