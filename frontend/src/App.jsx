import { useState, useRef, useEffect } from 'react';

export default function App() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: 'Welcome to CarbonTrack Sentinel Assistant.\n\nHow can I assist you with your sustainability objectives today?',
      actions: []
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const newUserMessage = {
      id: Date.now(),
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: inputValue
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const allMessages = [...messages, newUserMessage];
      const apiMessages = allMessages.map(msg => ({
        role: msg.sender === 'bot' ? 'assistant' : 'user',
        content: msg.text
      }));

      const response = await fetch('http://localhost:8001/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
      });
      if (!response.ok) {
        throw new Error('Server responded with ' + response.status);
      }

      setIsLoading(false); // Hide the "Thinking..." pulse

      const botMessageId = Date.now() + 1;
      const botResponse = {
        id: botMessageId,
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: '',
        actions: []
      };
      setMessages((prev) => [...prev, botResponse]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;
      let streamedText = '';

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunkValue = decoder.decode(value, { stream: true });
          streamedText += chunkValue;
          
          setMessages((prev) => prev.map(msg => 
            msg.id === botMessageId ? { ...msg, text: streamedText } : msg
          ));
        }
      }
    } catch (error) {
      console.error('Failed to fetch from assistant API', error);
      const errorMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: "I'm having trouble connecting to the server. Please make sure the AI service is running on port 8001.",
        actions: []
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen font-sans bg-background text-on-surface overflow-hidden dark">
      {/* Top Navigation */}
      <header className="bg-surface dark:bg-surface-dim text-primary dark:text-primary-fixed fixed top-0 w-full z-50 border-b border-outline-variant dark:border-surface-variant flex justify-between items-center px-[24px] h-16">
        <div className="font-headline-md text-headline-md font-bold text-primary dark:text-primary-fixed">
          CarbonTrack Sentinel
        </div>
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-on-surface-variant hover:text-primary cursor-pointer transition-colors scale-95 active:scale-90">account_circle</span>
          <span className="material-symbols-outlined text-on-surface-variant hover:text-primary cursor-pointer transition-colors scale-95 active:scale-90">settings</span>
        </div>
      </header>
      
      {/* Main Content Area */}
      <main className="flex-grow pt-16 flex relative overflow-hidden bg-background">
        <div className="w-full max-w-4xl mx-auto flex flex-col h-[calc(100vh-64px)]">
          <div className="flex flex-col flex-grow overflow-hidden bg-background">
            {/* Chat Header */}
            <div className="px-[24px] py-[16px] border-b border-surface-variant flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-surface-container-lowest flex items-center justify-center border border-primary-container">
                  <span className="material-symbols-outlined text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
                </div>
                <div>
                  <h2 className="font-headline-sm text-headline-sm text-on-surface">CarbonTrack AI Assistant</h2>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className="w-2 h-2 rounded-full bg-secondary-fixed"></div>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">Online</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Chat Message Area */}
            <div className="flex-grow p-[24px] overflow-y-auto chat-scroll flex flex-col gap-[16px]">
              <div className="text-center font-data-sm text-data-sm text-on-surface-variant my-[8px]">
                Today, {new Date().toLocaleDateString()}
              </div>

              {messages.map((msg) => (
                msg.sender === 'bot' ? (
                  <div key={msg.id} className="flex items-start gap-3 max-w-[80%]">
                    <div className="w-8 h-8 rounded-lg bg-surface-container-lowest flex-shrink-0 flex items-center justify-center border border-surface-variant mt-1">
                      <span className="material-symbols-outlined text-on-surface-variant text-sm">robot_2</span>
                    </div>
                    <div className="flex flex-col gap-3 w-full">
                      <div className="bg-surface-container rounded-2xl rounded-tl-sm p-4 border border-surface-variant text-on-surface font-body-md text-body-md shadow-sm whitespace-pre-wrap">
                        {msg.text}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div key={msg.id} className="flex flex-col items-end gap-1 mt-[16px]">
                    <div className="bg-surface-container-highest border border-primary-container/30 rounded-2xl rounded-tr-sm p-4 text-on-surface font-body-md text-body-md max-w-[80%] shadow-sm whitespace-pre-wrap">
                      <p>{msg.text}</p>
                    </div>
                    <span className="font-data-sm text-data-sm text-on-surface-variant mr-1">{msg.timestamp}</span>
                  </div>
                )
              ))}
              
              {isLoading && (
                <div className="flex items-start gap-3 max-w-[80%]">
                  <div className="w-8 h-8 rounded-lg bg-surface-container-lowest flex-shrink-0 flex items-center justify-center border border-surface-variant mt-1">
                    <span className="material-symbols-outlined text-on-surface-variant text-sm animate-pulse">robot_2</span>
                  </div>
                  <div className="bg-surface-container rounded-2xl rounded-tl-sm p-4 border border-surface-variant text-on-surface font-body-md text-body-md shadow-sm">
                    <span className="animate-pulse">Thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Input Area */}
            <div className="p-[24px] bg-background border-t border-surface-variant">
              <div className="relative flex items-center bg-surface-container-lowest rounded-lg border border-outline-variant focus-within:border-primary-container focus-within:ring-1 focus-within:ring-primary-container/50 transition-all">
                <button className="absolute left-3 text-on-surface-variant hover:text-primary-container transition-colors">
                  <span className="material-symbols-outlined">attach_file</span>
                </button>
                <input 
                  className="w-full bg-transparent border-none text-on-surface placeholder:text-on-surface-variant font-body-md text-body-md py-4 pl-12 pr-16 focus:ring-0 focus:outline-none" 
                  placeholder="Type your question..." 
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <button 
                  className="absolute right-2 bg-primary-container text-on-primary-container rounded-md w-10 h-10 flex items-center justify-center hover:bg-primary-fixed-dim transition-colors glow-hover disabled:opacity-50"
                  onClick={handleSendMessage}
                  disabled={isLoading || !inputValue.trim()}
                >
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
                </button>
              </div>
              <div className="text-center mt-2">
                <span className="font-data-sm text-data-sm text-on-surface-variant/70">CarbonTrack AI may produce inaccurate information.</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
