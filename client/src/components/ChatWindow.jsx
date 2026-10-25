import { useEffect, useRef, useState, useCallback } from "react";
import { Send } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { getMessageThread, sendMessageRest } from "../services/messageService";
import { getErrorMessage } from "../utils/getErrorMessage";

const TYPING_STOP_DELAY_MS = 2000;

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ChatWindow({ peer }) {
  const { user } = useAuth();
  const { socket, isConnected, isUserOnline, isUserTyping } = useSocket();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const bottomRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const peerId = peer._id;
  const peerIsTyping = isUserTyping(peerId);

  const scrollToBottom = useCallback((behavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior });
  }, []);

  // Load history + mark the thread read whenever the open conversation changes.
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError("");

    (async () => {
      try {
        const data = await getMessageThread(peerId);
        if (isMounted) {
          setMessages(data.messages);
          setLoading(false);
          setTimeout(() => scrollToBottom("auto"), 0);
        }
      } catch (err) {
        if (isMounted) {
          setError(getErrorMessage(err));
          setLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [peerId, scrollToBottom]);

  // Mark read via socket (falls back to nothing if not connected - the
  // REST page load already fetched history; a slightly stale unread
  // badge elsewhere is not worth a second network path here).
  useEffect(() => {
    if (socket && isConnected) {
      socket.emit("mark_read", { peerId });
    }
  }, [socket, isConnected, peerId, messages.length]);

  // Listen for incoming real-time messages relevant to this thread.
  useEffect(() => {
    if (!socket) return;

    const handleReceive = (message) => {
      const isThisThread =
        (message.sender === peerId && message.recipient === user.id) ||
        (message.sender === user.id && message.recipient === peerId);
      if (!isThisThread) return;

      setMessages((prev) => [...prev, message]);

      // If the incoming message is from the peer and this thread is open,
      // immediately tell the server we've read it too.
      if (message.sender === peerId) {
        socket.emit("mark_read", { peerId });
      }
      setTimeout(() => scrollToBottom(), 0);
    };

    const handleMessagesRead = ({ readBy }) => {
      if (readBy !== peerId) return;
      // The peer just read our messages - flip our sent messages to read.
      setMessages((prev) =>
        prev.map((m) => (m.sender === user.id ? { ...m, isRead: true } : m))
      );
    };

    socket.on("receive_message", handleReceive);
    socket.on("messages_read", handleMessagesRead);

    return () => {
      socket.off("receive_message", handleReceive);
      socket.off("messages_read", handleMessagesRead);
    };
  }, [socket, peerId, user.id, scrollToBottom]);

  const handleDraftChange = (e) => {
    setDraft(e.target.value);

    if (!socket || !isConnected) return;
    socket.emit("typing", { recipientId: peerId });

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop_typing", { recipientId: peerId });
    }, TYPING_STOP_DELAY_MS);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const content = draft.trim();
    if (!content || sending) return;

    setSending(true);
    setError("");
    clearTimeout(typingTimeoutRef.current);
    socket?.emit("stop_typing", { recipientId: peerId });

    try {
      if (socket && isConnected) {
        const ack = await new Promise((resolve) => {
          socket.emit("send_message", { recipientId: peerId, content }, resolve);
        });
        if (!ack?.success) {
          throw new Error(ack?.message || "Failed to send message");
        }
        setMessages((prev) => [...prev, ack.message]);
      } else {
        // Socket not connected - fall back to REST so the message still sends.
        const data = await sendMessageRest(peerId, content);
        setMessages((prev) => [...prev, data.message]);
      }
      setDraft("");
      setTimeout(() => scrollToBottom(), 0);
    } catch (err) {
      setError(err.message || getErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200">
        <div className="relative shrink-0">
          <div className="w-9 h-9 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center">
            {peer.profileImage ? (
              <img loading="lazy" decoding="async" src={peer.profileImage} alt={peer.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-semibold text-slate-500">
                {peer.name?.[0]?.toUpperCase()}
              </span>
            )}
          </div>
          {isUserOnline(peerId) && (
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 ring-2 ring-white" />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-800 truncate">{peer.name}</p>
          <p className="text-xs text-slate-400">
            {peerIsTyping ? "typing..." : isUserOnline(peerId) ? "Online" : "Offline"}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {loading ? (
          <p className="text-center text-sm text-slate-400 py-10">Loading messages...</p>
        ) : error ? (
          <p className="text-center text-sm text-red-600 py-10">{error}</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-10">
            Say hello to {peer.name.split(" ")[0]}!
          </p>
        ) : (
          messages.map((m) => {
            const isMine = m.sender === user.id;
            return (
              <div key={m._id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                    isMine
                      ? "bg-slate-800 text-white rounded-br-sm"
                      : "bg-slate-100 text-slate-800 rounded-bl-sm"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.content}</p>
                  <p
                    className={`text-[10px] mt-1 flex items-center gap-1 justify-end ${
                      isMine ? "text-slate-300" : "text-slate-400"
                    }`}
                  >
                    {formatTime(m.createdAt)}
                    {isMine && <span>{m.isRead ? "· Read" : "· Sent"}</span>}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex items-center gap-2 px-4 py-3 border-t border-slate-200">
        <input
          value={draft}
          onChange={handleDraftChange}
          placeholder="Type a message..."
          className="flex-1 rounded-full border border-slate-300 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-400"
        />
        <button
          type="submit"
          disabled={!draft.trim() || sending}
          className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-40"
          aria-label="Send message"
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}
