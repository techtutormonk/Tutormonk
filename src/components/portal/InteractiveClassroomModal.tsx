import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  PenTool, 
  Eraser, 
  RotateCcw, 
  Share2, 
  MessageSquare, 
  FileText, 
  Send, 
  Sparkles,
  Maximize2
} from 'lucide-react';
import { ClassSession } from '../../types';

interface InteractiveClassroomModalProps {
  session: ClassSession;
  isOpen: boolean;
  onClose: () => void;
}

export const InteractiveClassroomModal: React.FC<InteractiveClassroomModalProps> = ({
  session,
  isOpen,
  onClose
}) => {
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [activeTool, setActiveTool] = useState<'pen' | 'eraser'>('pen');
  const [brushColor, setBrushColor] = useState('#fbbf24');
  const [activeRightTab, setActiveRightTab] = useState<'chat' | 'notes'>('chat');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: string; text: string; time: string }>>([
    { sender: 'Dr. Evelyn Reed (Tutor)', text: 'Welcome Aarav! Today we are working on graphing linear slopes and y = mx + b standard form.', time: '4:30 PM' },
    { sender: 'Aarav (Student)', text: 'Hi Dr. Evelyn! I had a doubt on question 4 from yesterday\'s homework on finding perpendicular slope.', time: '4:31 PM' },
    { sender: 'Dr. Evelyn Reed (Tutor)', text: 'Great question! Remember: perpendicular slopes are negative reciprocals. If m1 = 2/3, then m2 = -3/2. Let\'s draw it on the whiteboard!', time: '4:32 PM' }
  ]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Initialize canvas with grid and sample diagram
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set real size based on container
    canvas.width = canvas.parentElement?.clientWidth || 700;
    canvas.height = canvas.parentElement?.clientHeight || 450;

    // Clear and draw grid
    ctx.fillStyle = '#0f0a28';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#22194d';
    ctx.lineWidth = 1;

    // Draw coordinate grid
    const gridSize = 30;
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Axes
    const centerX = Math.floor(canvas.width / 2);
    const centerY = Math.floor(canvas.height / 2);

    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(canvas.width, centerY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, canvas.height);
    ctx.stroke();

    // Sample equation line: y = 2x + 1 in amber
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(centerX - 150, centerY + 150);
    ctx.lineTo(centerX + 150, centerY - 150);
    ctx.stroke();

    // Text label
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 14px "JetBrains Mono", monospace';
    ctx.fillText('Line 1: y = 2x + 1 (m = 2)', centerX + 20, centerY - 80);

    // Perpendicular line: y = -1/2 x in cyan
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(centerX - 180, centerY - 90);
    ctx.lineTo(centerX + 180, centerY + 90);
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.fillText('Line 2 (Perpendicular): m = -1/2', centerX - 180, centerY + 120);

  }, [isOpen]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeTool === 'pen') {
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = 3;
      ctx.lineTo(x, y);
      ctx.stroke();
    } else {
      ctx.strokeStyle = '#0f0a28';
      ctx.lineWidth = 20;
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#0f0a28';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    setChatMessages((prev) => [
      ...prev,
      { sender: 'You (Student)', text: chatInput, time: 'Now' }
    ]);
    setChatInput('');

    // Quick auto response from tutor
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        { sender: 'Dr. Evelyn Reed (Tutor)', text: 'Spot on! Try drawing the next point (3, 7) directly on the whiteboard.', time: 'Now' }
      ]);
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
      <div 
        className="w-full max-w-6xl bg-[#0c0620] border border-indigo-700/60 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[94vh] text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="px-5 py-3.5 bg-[#140b33] border-b border-indigo-900/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <span>{session.subject} &bull; {session.topic}</span>
              </h3>
              <div className="text-[11px] text-slate-400">
                1:1 Session with <span className="text-amber-400 font-semibold">{session.tutorName}</span> &bull; 48:22 Remaining
              </div>
            </div>
          </div>

          {/* Quick AV controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMicOn(!micOn)}
              className={`p-2 rounded-xl border text-xs flex items-center gap-1.5 transition-colors ${
                micOn ? 'bg-indigo-950 text-slate-200 border-indigo-800' : 'bg-rose-950 text-rose-300 border-rose-800'
              }`}
            >
              {micOn ? <Mic className="w-4 h-4 text-emerald-400" /> : <MicOff className="w-4 h-4 text-rose-400" />}
              <span className="hidden sm:inline">{micOn ? 'Mic On' : 'Muted'}</span>
            </button>

            <button
              onClick={() => setCameraOn(!cameraOn)}
              className={`p-2 rounded-xl border text-xs flex items-center gap-1.5 transition-colors ${
                cameraOn ? 'bg-indigo-950 text-slate-200 border-indigo-800' : 'bg-rose-950 text-rose-300 border-rose-800'
              }`}
            >
              {cameraOn ? <Video className="w-4 h-4 text-emerald-400" /> : <VideoOff className="w-4 h-4 text-rose-400" />}
              <span className="hidden sm:inline">{cameraOn ? 'Cam On' : 'Cam Off'}</span>
            </button>

            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase transition-colors"
            >
              Leave Class
            </button>
          </div>
        </div>

        {/* Main Stage: Whiteboard (Left) + Video & Chat (Right) */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* Left Canvas Area */}
          <div className="flex-1 flex flex-col bg-[#0f0a28] border-r border-indigo-900/60 relative">
            
            {/* Whiteboard Toolbar */}
            <div className="p-2.5 bg-[#140b33]/90 border-b border-indigo-900/60 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTool('pen')}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-semibold transition-colors ${
                    activeTool === 'pen' ? 'bg-amber-400 text-slate-950' : 'bg-indigo-950 text-slate-300 hover:bg-indigo-900'
                  }`}
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>Pen</span>
                </button>

                <button
                  onClick={() => setActiveTool('eraser')}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-semibold transition-colors ${
                    activeTool === 'eraser' ? 'bg-amber-400 text-slate-950' : 'bg-indigo-950 text-slate-300 hover:bg-indigo-900'
                  }`}
                >
                  <Eraser className="w-3.5 h-3.5" />
                  <span>Eraser</span>
                </button>

                {/* Color swatches */}
                <div className="flex items-center gap-1.5 pl-2 border-l border-indigo-800">
                  {['#fbbf24', '#38bdf8', '#34d399', '#f43f5e', '#ffffff'].map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        setBrushColor(c);
                        setActiveTool('pen');
                      }}
                      className={`w-5 h-5 rounded-full border-2 transition-transform ${
                        brushColor === c && activeTool === 'pen' ? 'scale-125 border-white' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleClearCanvas}
                  className="px-2.5 py-1.5 rounded-lg bg-indigo-950 hover:bg-indigo-900 text-slate-300 flex items-center gap-1"
                  title="Clear Whiteboard"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              </div>
            </div>

            {/* Interactive Canvas */}
            <div className="flex-1 relative cursor-crosshair overflow-hidden">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                className="w-full h-full block"
              />
              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-indigo-900/60 text-[11px] text-slate-300 pointer-events-none">
                Interactive Shared Board &bull; Click &amp; drag to solve
              </div>
            </div>
          </div>

          {/* Right Panel: Video Feeds & Chat/Notes */}
          <div className="w-full lg:w-80 xl:w-96 bg-[#120a30] flex flex-col border-t lg:border-t-0">
            
            {/* Webcam Feeds Simulation */}
            <div className="p-3 bg-[#0d0724] border-b border-indigo-900/60 grid grid-cols-2 gap-2">
              
              {/* Tutor Webcam */}
              <div className="relative aspect-video rounded-xl bg-gradient-to-tr from-slate-900 to-indigo-950 border border-indigo-700/60 overflow-hidden flex flex-col justify-end p-2 shadow-inner">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-indigo-800 border-2 border-amber-400 flex items-center justify-center font-bold text-amber-300 text-sm">
                    ER
                  </div>
                </div>
                {/* Audio wave indicator */}
                <div className="relative z-10 flex items-center justify-between text-[10px] bg-black/50 px-1.5 py-0.5 rounded">
                  <span className="font-semibold text-white truncate">Dr. Evelyn Reed</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                </div>
              </div>

              {/* Student Webcam */}
              <div className="relative aspect-video rounded-xl bg-gradient-to-tr from-slate-900 to-indigo-950 border border-indigo-700/60 overflow-hidden flex flex-col justify-end p-2 shadow-inner">
                {cameraOn ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-violet-800 border-2 border-indigo-300 flex items-center justify-center font-bold text-white text-sm">
                      AS
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-[11px] text-slate-500">
                    Camera Off
                  </div>
                )}
                <div className="relative z-10 flex items-center justify-between text-[10px] bg-black/50 px-1.5 py-0.5 rounded">
                  <span className="font-semibold text-white">Aarav (You)</span>
                  {micOn && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                </div>
              </div>

            </div>

            {/* Right Tabs: Chat vs Lesson Notes */}
            <div className="flex border-b border-indigo-900/80 bg-[#160d3b]">
              <button
                onClick={() => setActiveRightTab('chat')}
                className={`flex-1 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                  activeRightTab === 'chat' ? 'border-amber-400 text-amber-400 bg-indigo-950/40' : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Class Chat</span>
              </button>

              <button
                onClick={() => setActiveRightTab('notes')}
                className={`flex-1 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                  activeRightTab === 'notes' ? 'border-amber-400 text-amber-400 bg-indigo-950/40' : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Notes &amp; Homework</span>
              </button>
            </div>

            {/* Tab Body */}
            {activeRightTab === 'chat' ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 p-3 overflow-y-auto space-y-2.5 text-xs">
                  {chatMessages.map((m, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-[#1b1142] border border-indigo-900/60 space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-amber-300">{m.sender}</span>
                        <span className="text-slate-500">{m.time}</span>
                      </div>
                      <p className="text-slate-200 leading-relaxed text-[12px]">{m.text}</p>
                    </div>
                  ))}
                </div>

                <div className="p-2.5 bg-[#140b33] border-t border-indigo-900/60 flex items-center gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask tutor or post equation..."
                    className="flex-1 bg-[#1e1342] border border-indigo-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="p-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold transition-transform active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs text-slate-300">
                <div className="p-3 rounded-xl bg-[#1b1142] border border-indigo-800 space-y-2">
                  <div className="font-bold text-amber-300 text-xs uppercase">Today&apos;s Whiteboard Summary</div>
                  <p className="leading-relaxed text-slate-200">
                    {session.whiteboardNotes || 'Equations: y = 2x + 1, slope m = 2. Perpendicular equation slope m = -1/2.'}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#1b1142] border border-indigo-800 space-y-2">
                  <div className="font-bold text-amber-300 text-xs uppercase">Assigned Practice Task</div>
                  <p className="leading-relaxed text-slate-200">
                    {session.homeworkAssigned || 'Complete practice problem set 4.3 questions 1 to 8.'}
                  </p>
                </div>
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
};
