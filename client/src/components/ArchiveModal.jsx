import React from 'react'

const ArchiveModal = ({ isOpen, onClose, onConfirm, itemName, itemType }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md transition-all duration-300">
      
      <div className="w-full max-w-md p-6 mx-4 rounded-2xl border border-white/20 bg-white/10 dark:bg-zinc-900/40 shadow-2xl backdrop-blur-xl text-zinc-800 dark:text-zinc-100">
        <h3 className="text-xl font-semibold tracking-wide mb-2">
          Archive {itemType === 'workspace' ? 'Workspace' : 'Task'}?
        </h3>
        
        <p className="text-sm opacity-80 mb-6 leading-relaxed">
          Are you sure you want to move <span className="font-semibold text-sky-400">"{itemName}"</span> to the Archive Bin? 
          {itemType === 'workspace' && " This will also archive all tasks belonging to this workspace."} You can restore it later.
        </p>

        <div className="flex justify-end gap-3 font-medium text-sm">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/10 dark:hover:bg-zinc-800/50 transition-colors"
          >
            Cancel
          </button>
          
          <button
            onClick={onConfirm}
            className="px-4 py-2.5 rounded-xl bg-amber-600/80 hover:bg-amber-600 border border-amber-500/30 text-white transition-all shadow-lg shadow-amber-900/20"
          >
            Move to Archive
          </button>
        </div>
      </div>
    </div>
  )
}

export default ArchiveModal