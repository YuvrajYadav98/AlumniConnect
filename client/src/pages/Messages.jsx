import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { listConversations } from "../services/messageService";
import { getProfileByUserId } from "../services/alumniService";
import { getErrorMessage } from "../utils/getErrorMessage";
import ConversationList from "../components/ConversationList";
import ChatWindow from "../components/ChatWindow";

export default function Messages() {
  const { userId } = useParams();

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [peer, setPeer] = useState(null);
  const [peerLoading, setPeerLoading] = useState(false);

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listConversations();
      setConversations(data.conversations);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Re-fetch the conversation list whenever the open thread changes, so
  // unread badges / last-message previews stay current without a poll.
  useEffect(() => {
    if (userId) fetchConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Resolve who the open thread is with. If they're already in the
  // conversation list, reuse that (no extra request); otherwise this is
  // a brand-new thread (e.g. arrived via a "Message" button on a
  // profile page) - fetch their basic info directly.
  useEffect(() => {
    if (!userId) {
      setPeer(null);
      return;
    }

    const fromList = conversations.find((c) => c.user._id === userId);
    if (fromList) {
      setPeer(fromList.user);
      return;
    }

    let isMounted = true;
    setPeerLoading(true);
    (async () => {
      try {
        const data = await getProfileByUserId(userId);
        if (isMounted) {
          setPeer({
            _id: data.profile.user._id,
            name: data.profile.user.name,
            profileImage: data.profile.user.profileImage,
          });
        }
      } catch (err) {
        if (isMounted) setError(getErrorMessage(err));
      } finally {
        if (isMounted) setPeerLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, conversations.length]);

  return (
    <section className="h-[calc(100vh-160px)] min-h-[500px] bg-white border border-slate-200 rounded-lg overflow-hidden flex">
      <div className="w-full sm:w-80 shrink-0 border-r border-slate-200 flex flex-col">
        <div className="px-4 py-3 border-b border-slate-200">
          <h1 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <MessageCircle size={18} /> Messages
          </h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <p className="text-sm text-slate-400 text-center py-10">Loading...</p>
          ) : error && conversations.length === 0 ? (
            <p className="text-sm text-red-600 text-center py-10 px-4">{error}</p>
          ) : (
            <ConversationList conversations={conversations} activeUserId={userId} />
          )}
        </div>
      </div>

      <div className={`flex-1 ${userId ? "flex" : "hidden sm:flex"} flex-col`}>
        {!userId ? (
          <div className="flex-1 flex items-center justify-center text-sm text-slate-400">
            Select a conversation to start chatting
          </div>
        ) : peerLoading ? (
          <div className="flex-1 flex items-center justify-center text-sm text-slate-400">
            Loading conversation...
          </div>
        ) : peer ? (
          <ChatWindow peer={peer} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-red-600 px-4 text-center">
            {error || "This conversation isn't available."}
          </div>
        )}
      </div>
    </section>
  );
}
