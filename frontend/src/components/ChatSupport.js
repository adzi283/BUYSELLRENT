import React, { useState, useEffect, useRef } from 'react';
import { Box, IconButton, Paper, TextField, Typography, Fab, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import API from '../api';
import { toast } from 'react-hot-toast';

const ChatContainer = styled(Paper)(({ theme, isopen }) => ({
  position: 'fixed',
  bottom: isopen === 'true' ? '20px' : '-600px',
  left: '20px',
  width: '350px',
  height: '500px',
  display: 'flex',
  flexDirection: 'column',
  transition: 'bottom 0.3s ease-in-out',
  zIndex: 1000,
  boxShadow: theme.shadows[10],
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`
}));

const ChatHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottom: `1px solid ${theme.palette.divider}`
}));

const MessagesContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  overflowY: 'auto',
  padding: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
  backgroundColor: theme.palette.background.default
}));

const Message = styled(Box)(({ theme, isuser }) => ({
  maxWidth: '80%',
  padding: theme.spacing(1, 2),
  borderRadius: theme.spacing(2),
  alignSelf: isuser === 'true' ? 'flex-end' : 'flex-start',
  backgroundColor: isuser === 'true' ? theme.palette.primary.main : theme.palette.background.paper,
  color: isuser === 'true' ? theme.palette.primary.contrastText : theme.palette.text.primary,
  wordBreak: 'break-word',
  border: isuser === 'true' ? 'none' : `1px solid ${theme.palette.divider}`
}));

const InputContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderTop: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  gap: theme.spacing(1),
  backgroundColor: theme.palette.background.paper
}));

const ChatButton = styled(Fab)(({ theme }) => ({
  position: 'fixed',
  bottom: '20px',
  left: '20px',
  zIndex: 1000,
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  '&:hover': {
    backgroundColor: theme.palette.primary.dark
  }
}));

const ChatSupport = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    let mounted = true;

    const initSession = async () => {
      if (isOpen && !session) {
        try {
          setInitializing(true);
          const response = await API.get('/chat/session');
          if (mounted) {
            setSession(response.data.data.session);
            // Only show the initial welcome message
            setMessages([{
              role: 'assistant',
              content: "Hi! I'm your IIITH Buy-Sell assistant. How can I help you today?"
            }]);
          }
        } catch (error) {
          console.error('Failed to initialize chat session:', error);
          toast.error('Failed to start chat session. Please try again.');
          // Set default welcome message even if session fails
          setMessages([{
            role: 'assistant',
            content: "Hi! I'm your IIITH Buy-Sell assistant. How can I help you today?"
          }]);
        } finally {
          if (mounted) {
            setInitializing(false);
          }
        }
      }
    };

    initSession();

    return () => {
      mounted = false;
    };
  }, [isOpen, session]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!message.trim() || !session || loading) return;

    const userMessage = message;
    setMessage('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await API.post('/chat/message', {
        sessionId: session._id,
        message: userMessage
      });

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.data.data.message
      }]);
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message. Please try again.');
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClose = async () => {
    if (session) {
      try {
        await API.patch(`/chat/session/${session._id}/close`);
      } catch (error) {
        console.error('Failed to close chat session:', error);
      }
    }
    setIsOpen(false);
    setSession(null);
    setMessages([]);
  };

  return (
    <>
      <ChatButton
        color="primary"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="chat support"
      >
        <ChatIcon />
      </ChatButton>

      <ChatContainer isopen={isOpen.toString()}>
        <ChatHeader>
          <Typography variant="h6">Support Chat</Typography>
          <IconButton
            size="small"
            onClick={handleClose}
            sx={{ color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </ChatHeader>

        <MessagesContainer>
          {initializing ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="100%">
              <CircularProgress />
            </Box>
          ) : (
            <>
              {messages.map((msg, index) => (
                <Message
                  key={index}
                  isuser={msg.role === 'user' ? 'true' : 'false'}
                >
                  <Typography variant="body2">{msg.content}</Typography>
                </Message>
              ))}
              {loading && (
                <Box display="flex" justifyContent="center" my={1}>
                  <CircularProgress size={20} />
                </Box>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </MessagesContainer>

        <InputContainer>
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            multiline
            maxRows={4}
            disabled={loading || initializing}
          />
          <IconButton
            color="primary"
            onClick={handleSendMessage}
            disabled={!message.trim() || loading || initializing}
          >
            {loading ? <CircularProgress size={24} /> : <SendIcon />}
          </IconButton>
        </InputContainer>
      </ChatContainer>
    </>
  );
};

export default ChatSupport; 