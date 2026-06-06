import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import { MentionsInput, Mention } from 'react-mentions';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const CommentSection = ({ taskId, workspaceMembers }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  const fetchComments = async () => {
    try {
      const res = await API.get(`/comments/${taskId}`);
      setComments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Fetch error:", err);
      setComments([]);
    }
  };

  useEffect(() => { fetchComments(); }, [taskId]);

  const formatCommentDate = (date) => {
    const diffInHours = dayjs().diff(dayjs(date), 'hour');
    return diffInHours < 24 ? dayjs(date).format('hh:mm A') : dayjs(date).fromNow(true) + " ago";
  };

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    const mentionRegex = /@\[.*?\]\((.*?)\)/g;
    const mentions = [...newComment.matchAll(mentionRegex)].map(m => m[1]);

    try {
      const res = await API.post(`/comments/${taskId}`, { content: newComment, mentions });
      setComments([...comments, res.data]);
      setNewComment("");
    } catch (err) {
      console.error("Post error:", err);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-3 p-3">
      <div className="relative bg-[#F8FAFC] p-1 rounded-lg border border-gray-200 focus-within:bg-white focus-within:border-green-200 focus-within:ring-1 focus-within:ring-green-800 transition-all flex items-center shadow-inner">
        <div className="flex-1">
          <MentionsInput
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Initialize communication..."
            className="syncnode-mentions text-[11px] font-medium text-[#001E2B]"
            allowSuggestionsAboveCursor={true}
          >
            <Mention
              trigger="@"
              data={workspaceMembers.map(member => {
                const user = member.user || member;
                return { id: user._id, display: user.name };
              })}
              markup="@[__display__](__id__)"
              displayTransform={(id, display) => `@${display}`}
              className="bg-[#001E2B] text-[#00ED64] font-bold rounded-sm px-1 py-0.5 text-[11px] shadow-sm"
            />
          </MentionsInput>
        </div>

        <button
          onClick={handlePostComment}
          className="ml-1 mr-0.5 bg-[#001E2B] text-[#00ED64] p-2 rounded hover:bg-black transition-all active:scale-95 shadow-md shrink-0 cursor-pointer"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
        {comments.map(c => (
          <div key={c._id} className="bg-[#F8FAFC] p-3 rounded-lg border border-transparent hover:border-gray-200 transition-colors">
            
            <div className='flex justify-between items-center mb-1'>
              <span className="text-[9px] font-bold uppercase text-[#001E2B] tracking-[0.2em]">
                {c.user?.name || "Member"}
              </span>
              <span className="text-[8px] font-mono font-medium text-gray-400 uppercase tracking-widest">
                {formatCommentDate(c.createdAt)}
              </span>
            </div>
            
            <div className="text-[12px] text-[#001E2B] leading-snug">
              {c.content.split(/(@\[.*?\]\(.*?\))/g).map((part, index) => {
                const mentionMatch = part.match(/@\[(.*?)\]\(.*?\)/);
                return mentionMatch ? (
                  <span key={index} className="text-blue-800 px-1 py-0.5 rounded-[3px] font-bold text-[10px] ">
                    @{mentionMatch[1]}
                  </span>
                ) : part;
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommentSection;