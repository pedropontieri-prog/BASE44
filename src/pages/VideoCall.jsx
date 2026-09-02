import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Video, VideoOff, Mic, MicOff, Volume2, VolumeX, PhoneOff, Send, ShieldCheck, Wifi, AlertTriangle, Lock, MessageCircle, UserCircle2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function VideoCall() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const state = location.state || {};
  const roomId = state.roomId || params.get('room') || params.get('id') || 'demo-room';
  const role = state.role || params.get('role') || 'patient';
  const peerName = state.psychologistName || params.get('name') || 'Profissional';
  const scheduledTime = state.time || params.get('time') || 'em breve';

  const [camOn, setCamOn] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [volOn, setVolOn] = useState(true);
  const [permissionError, setPermissionError] = useState(null);
  const [status, setStatus] = useState('requesting'); // requesting | waiting | connecting | connected | error
  const [peerPresent, setPeerPresent] = useState(false);
  const [peerRole, setPeerRole] = useState(null);
  const [mySeat, setMySeat] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [elapsed, setElapsed] = useState(0);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const pcRef = useRef(null);
  const roomRef = useRef(null);
  const iceQueueRef = useRef([]);
  const makingOfferRef = useRef(false);
  const politeRef = useRef(true);
  const mySeatRef = useRef(null);
  const negotiatingRef = useRef(false);
  const cleanupRef = useRef(null);
  useEffect(() => { mySeatRef.current = mySeat; }, [mySeat]);

  const negotiate = async () => {
    const pc = pcRef.current;
    if (!pc) return;
    try {
      makingOfferRef.current = true;
      setStatus('connecting');
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      roomRef.current.send({ type: 'signal', data: { kind: 'offer', sdp: offer } });
    } catch (e) {
      // ignore
    } finally {
      makingOfferRef.current = false;
    }
  };

  const handleSignal = async (data) => {
    const pc = pcRef.current;
    if (!pc || !data) return;
    try {
      if (data.kind === 'offer') {
        if (makingOfferRef.current && politeRef.current) {
          await pc.setLocalDescription({ type: 'rollback' });
        }
        await pc.setRemoteDescription(data.sdp);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        roomRef.current.send({ type: 'signal', data: { kind: 'answer', sdp: answer } });
        setStatus('connecting');
      } else if (data.kind === 'answer') {
        await pc.setRemoteDescription(data.sdp);
      } else if (data.kind === 'ice') {
        if (pc.remoteDescription) {
          await pc.addIceCandidate(data.candidate);
        } else {
          iceQueueRef.current.push(data.candidate);
        }
      }
    } catch (e) {
      // ignore signaling errors
    }
  };

  // Setup media + actor + WebRTC
  useEffect(() => {
    let cancelled = false;
    let connId = sessionStorage.getItem('vc_connId');
    if (!connId) { connId = crypto.randomUUID(); sessionStorage.setItem('vc_connId', connId); }

    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        setCamOn(true);
        setMicOn(true);
        setPermissionError(null);
        setStatus('waiting');
      } catch (err) {
        setPermissionError('Não foi possível acessar câmera ou microfone. Verifique as permissões do navegador e tente novamente.');
        setStatus('error');
        return;
      }

      // Connect to actor room
      const room = base44.actors.VideoRoom(roomId).connect({ id: connId });
      roomRef.current = room;

      // Create peer connection
      const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
      pcRef.current = pc;

      // Add local tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => pc.addTrack(t, localStreamRef.current));
      }

      pc.ontrack = (e) => {
        if (remoteVideoRef.current && e.streams[0]) {
          remoteVideoRef.current.srcObject = e.streams[0];
          setStatus('connected');
        }
      };

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          room.send({ type: 'signal', data: { kind: 'ice', candidate: e.candidate } });
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected') setStatus('connected');
        if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') setStatus('waiting');
      };

      const sub = room.subscribe((msg) => {
        if (!msg || typeof msg !== 'object') return;
        if (msg.type === 'you') {
          setMySeat(msg.seat);
        } else if (msg.type === 'presence') {
          const users = msg.users || [];
          const me = users.find(u => u.seat === (mySeatRef.current ?? msg.seat));
          const others = users.filter(u => u.seat !== (mySeatRef.current ?? msg.seat));
          setPeerPresent(others.length > 0);
          setPeerRole(others[0]?.role || null);
          // The peer with the higher seat is "impolite" (initiator); lower seat is "polite"
          // We decide based on our seat vs others once both present
          if (others.length > 0 && mySeatRef.current != null) {
            politeRef.current = mySeatRef.current < others[0].seat;
          }
          // Trigger negotiation when peer appears and we haven't started
          if (others.length > 0 && !negotiatingRef.current && pcRef.current) {
            negotiatingRef.current = true;
            negotiate();
          }
        } else if (msg.type === 'signal') {
          handleSignal(msg.data);
        } else if (msg.type === 'chat') {
          setMessages(m => [...m, { from: msg.message.seat === mySeatRef.current ? 'me' : 'peer', role: msg.message.role, text: msg.message.text, time: new Date(msg.message.time).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) }]);
        } else if (msg.type === 'chat_history') {
          setMessages((msg.messages || []).map(m => ({ from: m.seat === mySeatRef.current ? 'me' : 'peer', role: m.role, text: m.text, time: new Date(m.time).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) })));
        }
      });

      // Declare role
      room.send({ type: 'role', role });

      return () => { sub.unsubscribe(); room.close(); };
    };

    init().then(cleanup => { if (cleanup) cleanupRef.current = cleanup; });
    return () => {
      cancelled = true;
      if (cleanupRef.current) cleanupRef.current();
      if (pcRef.current) pcRef.current.close();
      if (localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop());
    };
    // eslint-disable-next-line
  }, [roomId]);

  // Timer when connected
  useEffect(() => {
    if (status !== 'connected') { setElapsed(0); return; }
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(t);
  }, [status]);

  const toggleCam = () => {
    const next = !camOn;
    setCamOn(next);
    localStreamRef.current?.getVideoTracks().forEach(t => t.enabled = next);
  };
  const toggleMic = () => {
    const next = !micOn;
    setMicOn(next);
    localStreamRef.current?.getAudioTracks().forEach(t => t.enabled = next);
  };

  const sendMessage = () => {
    if (!draft.trim()) return;
    roomRef.current?.send({ type: 'chat', text: draft });
    setDraft('');
  };

  const endCall = () => {
    if (pcRef.current) pcRef.current.close();
    if (localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop());
    navigate(-1);
  };

  const fmt = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  const peerLabel = peerRole === 'psychologist' ? peerName : peerRole === 'patient' ? 'Paciente' : peerName;

  return (
    <div className="h-screen bg-foreground text-white flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-black/30 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center"><Lock size={16} /></div>
          <div>
            <p className="text-sm font-semibold">Sala privada do EntreNós</p>
            <p className="text-[11px] text-white/60">Consulta com {peerName}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full ${status==='connected'?'bg-emerald-500/20 text-emerald-300':status==='error'?'bg-red-500/20 text-red-300':'bg-amber-500/20 text-amber-300'}`}>
            <Wifi size={13} /> {status==='connected'?'Conexão segura':status==='connecting'?'Conectando...':status==='waiting'?'Aguardando':status==='error'?'Erro':'Preparando...'}
          </span>
          {status === 'connected' && <span className="text-sm font-mono tabular-nums">{fmt(elapsed)}</span>}
        </div>
      </div>

      {/* Stage */}
      <div className="flex-1 relative bg-black flex items-center justify-center p-4 sm:p-8">
        {/* Remote (main) */}
        <div className="absolute inset-4 sm:inset-8 rounded-3xl overflow-hidden bg-gradient-to-br from-violet-900/40 to-slate-900 border border-white/10">
          {status !== 'connected' ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
              <div className="w-20 h-20 rounded-3xl gradient-brand flex items-center justify-center shadow-glow animate-float">
                {status === 'error' ? <AlertTriangle size={34} /> : status === 'waiting' ? <UserCircle2 size={34} /> : <Video size={34} className="animate-pulse-soft" />}
              </div>
              <p className="mt-6 font-heading font-semibold text-lg">
                {status === 'error' ? 'Algo deu errado' : status === 'waiting' ? 'Aguardando o profissional' : status === 'connecting' ? 'Estabelecendo conexão...' : 'Preparando sua sala...'}
              </p>
              <p className="mt-1.5 text-sm text-white/60 max-w-sm">
                {status === 'error' ? 'Verifique as permissões de câmera e microfone.' : status === 'waiting' ? `A consulta começa ${scheduledTime}. Você já pode entrar e aguardar.` : 'Conectando você ao profissional de forma segura.'}
              </p>
              {status === 'waiting' && (
                <div className="mt-5 flex items-center gap-2 text-xs text-white/50">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse-soft" /> {peerPresent ? 'Profissional entrou, conectando...' : 'Profissional ainda não entrou'}
                </div>
              )}
            </div>
          ) : (
            <video ref={remoteVideoRef} autoPlay playsInline className={`w-full h-full object-cover ${volOn ? '' : 'opacity-60'}`} />
          )}
        </div>

        {/* Local self-view */}
        <div className="absolute bottom-6 right-6 w-32 sm:w-44 aspect-[3/4] rounded-2xl overflow-hidden bg-slate-800 border-2 border-white/20 shadow-glow">
          {camOn ? (
            <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-white/50 gap-2">
              <VideoOff size={22} />
              <span className="text-[11px]">Câmera desligada</span>
            </div>
          )}
          <span className="absolute bottom-2 left-2 text-[10px] px-2 py-0.5 rounded-full bg-black/50">Você</span>
        </div>

        {/* Permission error */}
        {permissionError && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 max-w-md w-[90%] glass-strong rounded-2xl p-4 flex items-start gap-3 text-sm animate-fade-in">
            <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Permissão necessária</p>
              <p className="text-white/70 text-xs mt-1">{permissionError}</p>
            </div>
          </div>
        )}
      </div>

      {/* Chat panel */}
      {chatOpen && (
        <div className="absolute right-0 top-0 bottom-0 w-full sm:w-80 bg-slate-900/95 backdrop-blur-xl border-l border-white/10 flex flex-col z-20 animate-fade-in">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <span className="font-semibold text-sm inline-flex items-center gap-2"><MessageCircle size={16} /> Chat da consulta</span>
            <button onClick={() => setChatOpen(false)} className="text-white/60 hover:text-white"><PhoneOff size={16} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && <p className="text-xs text-white/40 text-center mt-8">As mensagens são privadas e permanecem nesta sala.</p>}
            {messages.map((m, i) => (
              <div key={i} className={`max-w-[80%] ${m.from==='me' ? 'ml-auto' : ''}`}>
                <div className={`px-3 py-2 rounded-2xl text-sm ${m.from==='me' ? 'gradient-brand' : 'bg-white/10'}`}>{m.text}</div>
                <p className="text-[10px] text-white/40 mt-1 text-right">{m.time}</p>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-white/10 flex gap-2">
            <input value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendMessage()} placeholder="Mensagem..." className="flex-1 px-3 py-2 rounded-xl bg-white/10 text-sm placeholder:text-white/40 focus:outline-none" />
            <button onClick={sendMessage} className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center"><Send size={16} /></button>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="px-4 sm:px-6 py-5 bg-black/40 backdrop-blur-md border-t border-white/10">
        <div className="flex items-center justify-center gap-3 sm:gap-4">
          <ControlButton active={camOn} onClick={toggleCam} iconOn={Video} iconOff={VideoOff} label="Câmera" />
          <ControlButton active={micOn} onClick={toggleMic} iconOn={Mic} iconOff={MicOff} label="Microfone" />
          <ControlButton active={volOn} onClick={()=>setVolOn(!volOn)} iconOn={Volume2} iconOff={VolumeX} label="Volume" />
          <ControlButton active={chatOpen} onClick={()=>setChatOpen(!chatOpen)} iconOn={MessageCircle} iconOff={MessageCircle} label="Chat" />
          <button onClick={endCall} className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors shadow-glow" aria-label="Encerrar chamada">
            <PhoneOff size={22} />
          </button>
        </div>
        <p className="text-center text-[11px] text-white/40 mt-3 inline-flex items-center justify-center gap-1.5 w-full">
          <ShieldCheck size={12} /> Nenhuma gravação automática. Esta sala é criptografada.
        </p>
      </div>
    </div>
  );
}

function ControlButton({ active, onClick, iconOn, iconOff, label }) {
  const Icon = active ? iconOn : iconOff;
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 group" aria-label={label}>
      <span className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${active ? 'bg-white/15 hover:bg-white/25' : 'bg-red-500/80 hover:bg-red-500'}`}>
        <Icon size={20} />
      </span>
      <span className="text-[10px] text-white/60">{label}</span>
    </button>
  );
}
