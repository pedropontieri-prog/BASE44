import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  PhoneOff,
  Send,
  ShieldCheck,
  Wifi,
  AlertTriangle,
  Lock,
  MessageCircle,
  UserCircle2,
  RefreshCw,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

const STUN_SERVERS = [
  {
    urls: 'stun:stun.l.google.com:19302',
  },
];

function formatMessageTime(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ControlButton({
  active,
  onClick,
  iconOn,
  iconOff,
  label,
}) {
  const Icon = active ? iconOn : iconOff;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 group"
      aria-label={label}
    >
      <span
        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
          active
            ? 'bg-white/15 hover:bg-white/25'
            : 'bg-red-500/80 hover:bg-red-500'
        }`}
      >
        <Icon size={20} />
      </span>

      <span className="text-[10px] text-white/60">
        {label}
      </span>
    </button>
  );
}

export default function VideoCall() {
  const location = useLocation();
  const navigate = useNavigate();

  const params = new URLSearchParams(location.search);
  const state = location.state || {};

  const roomId =
    state.roomId ||
    params.get('room') ||
    params.get('id') ||
    null;

  const role =
    state.role ||
    params.get('role') ||
    'patient';

  const peerName =
    state.psychologistName ||
    params.get('name') ||
    'Profissional';

  const scheduledTime =
    state.time ||
    params.get('time') ||
    'em breve';

  const [camOn, setCamOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [volOn, setVolOn] = useState(true);

  const [permissionError, setPermissionError] =
    useState(null);

  const [status, setStatus] =
    useState('requesting');

  const [peerPresent, setPeerPresent] =
    useState(false);

  const [peerRole, setPeerRole] =
    useState(null);

  const [mySeat, setMySeat] =
    useState(null);

  const [chatOpen, setChatOpen] =
    useState(false);

  const [messages, setMessages] =
    useState([]);

  const [draft, setDraft] =
    useState('');

  const [elapsed, setElapsed] =
    useState(0);

  const [retrying, setRetrying] =
    useState(false);

  const localVideoRef =
    useRef(null);

  const remoteVideoRef =
    useRef(null);

  const localStreamRef =
    useRef(null);

  const pcRef =
    useRef(null);

  const roomRef =
    useRef(null);

  const subscriptionRef =
    useRef(null);

  const iceQueueRef =
    useRef([]);

  const mySeatRef =
    useRef(null);

  const peerSeatRef =
    useRef(null);

  const politeRef =
    useRef(false);

  const makingOfferRef =
    useRef(false);

  const ignoreOfferRef =
    useRef(false);

  const initializedRef =
    useRef(false);

  const endingRef =
    useRef(false);

  useEffect(() => {
    mySeatRef.current = mySeat;
  }, [mySeat]);

  useEffect(() => {
    const video = remoteVideoRef.current;

    if (!video) {
      return;
    }

    video.muted = !volOn;
    video.volume = volOn ? 1 : 0;
  }, [volOn, status]);

  const formatElapsed = useCallback((seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return (
      String(minutes).padStart(2, '0') +
      ':' +
      String(remainingSeconds).padStart(2, '0')
    );
  }, []);

  const cleanupConnection = useCallback(() => {
    try {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    } catch (_) {}

    subscriptionRef.current = null;

    try {
      if (roomRef.current) {
        roomRef.current.close();
      }
    } catch (_) {}

    roomRef.current = null;

    try {
      if (pcRef.current) {
        pcRef.current.ontrack = null;
        pcRef.current.onicecandidate = null;
        pcRef.current.onconnectionstatechange = null;
        pcRef.current.oniceconnectionstatechange = null;
        pcRef.current.onnegotiationneeded = null;
        pcRef.current.close();
      }
    } catch (_) {}

    pcRef.current = null;

    if (localStreamRef.current) {
      localStreamRef.current
        .getTracks()
        .forEach((track) => {
          try {
            track.stop();
          } catch (_) {}
        });
    }

    localStreamRef.current = null;

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    iceQueueRef.current = [];
    peerSeatRef.current = null;
    makingOfferRef.current = false;
    ignoreOfferRef.current = false;
    initializedRef.current = false;
  }, []);

  const flushIceQueue = useCallback(async () => {
    const pc = pcRef.current;

    if (!pc || !pc.remoteDescription) {
      return;
    }

    const queue = [...iceQueueRef.current];

    iceQueueRef.current = [];

    for (const candidate of queue) {
      try {
        await pc.addIceCandidate(candidate);
      } catch (error) {
        console.warn(
          'Não foi possível adicionar candidato ICE:',
          error
        );
      }
    }
  }, []);

  const negotiate = useCallback(async () => {
    const pc = pcRef.current;
    const room = roomRef.current;

    if (!pc || !room) {
      return;
    }

    if (makingOfferRef.current) {
      return;
    }

    if (pc.signalingState !== 'stable') {
      return;
    }

    try {
      makingOfferRef.current = true;

      setStatus('connecting');

      const offer = await pc.createOffer();

      if (pc.signalingState !== 'stable') {
        return;
      }

      await pc.setLocalDescription(offer);

      if (!pc.localDescription) {
        return;
      }

      room.send({
        type: 'signal',
        data: {
          kind: 'offer',
          sdp: pc.localDescription,
        },
      });
    } catch (error) {
      console.error(
        'Erro ao criar oferta WebRTC:',
        error
      );
    } finally {
      makingOfferRef.current = false;
    }
  }, []);

  const handleSignal = useCallback(
    async (data) => {
      const pc = pcRef.current;
      const room = roomRef.current;

      if (!pc || !room || !data) {
        return;
      }

      try {
        if (data.kind === 'offer') {
          const offerCollision =
            makingOfferRef.current ||
            pc.signalingState !== 'stable';

          /*
           * CORREÇÃO:
           * A variável ignoreOffer precisava
           * ser declarada antes de ser usada.
           */
          const ignoreOffer =
            offerCollision &&
            !politeRef.current;

          ignoreOfferRef.current =
            ignoreOffer;

          if (ignoreOffer) {
            return;
          }

          if (offerCollision) {
            await pc.setLocalDescription({
              type: 'rollback',
            });
          }

          await pc.setRemoteDescription(
            data.sdp
          );

          await flushIceQueue();

          const answer =
            await pc.createAnswer();

          await pc.setLocalDescription(
            answer
          );

          if (!pc.localDescription) {
            return;
          }

          room.send({
            type: 'signal',
            data: {
              kind: 'answer',
              sdp: pc.localDescription,
            },
          });

          setStatus('connecting');

          return;
        }

        if (data.kind === 'answer') {
          if (
            pc.signalingState !==
            'have-local-offer'
          ) {
            return;
          }

          await pc.setRemoteDescription(
            data.sdp
          );

          await flushIceQueue();

          setStatus('connecting');

          return;
        }

        if (data.kind === 'ice') {
          if (!data.candidate) {
            return;
          }

          if (pc.remoteDescription) {
            try {
              await pc.addIceCandidate(
                data.candidate
              );
            } catch (error) {
              if (!ignoreOfferRef.current) {
                console.warn(
                  'Erro ao adicionar ICE:',
                  error
                );
              }
            }
          } else {
            iceQueueRef.current.push(
              data.candidate
            );
          }
        }
      } catch (error) {
        console.error(
          'Erro na sinalização WebRTC:',
          error
        );
      }
    },
    [flushIceQueue]
  );

  const initializeCall = useCallback(
    async () => {
      if (!roomId) {
        setPermissionError(
          'Sala de consulta não identificada.'
        );

        setStatus('error');

        return;
      }

      if (initializedRef.current) {
        return;
      }

      initializedRef.current = true;

      setPermissionError(null);
      setPeerPresent(false);
      setPeerRole(null);
      setStatus('requesting');

      const storageKey =
        `vc_connId_${roomId}`;

      let connId =
        sessionStorage.getItem(
          storageKey
        );

      if (!connId) {
        connId =
          typeof crypto !== 'undefined' &&
          crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random()}`;

        sessionStorage.setItem(
          storageKey,
          connId
        );
      }

      try {
        if (
          !navigator.mediaDevices ||
          !navigator.mediaDevices.getUserMedia
        ) {
          throw new Error(
            'Seu navegador não suporta acesso à câmera e ao microfone.'
          );
        }

        const stream =
          await navigator.mediaDevices.getUserMedia(
            {
              video: {
                width: {
                  ideal: 1280,
                },
                height: {
                  ideal: 720,
                },
              },
              audio: true,
            }
          );

        localStreamRef.current =
          stream;

        if (localVideoRef.current) {
          localVideoRef.current.srcObject =
            stream;

          localVideoRef.current.muted =
            true;

          try {
            await localVideoRef.current.play();
          } catch (_) {}
        }

        setCamOn(
          stream
            .getVideoTracks()
            .some(
              (track) => track.enabled
            )
        );

        setMicOn(
          stream
            .getAudioTracks()
            .some(
              (track) => track.enabled
            )
        );

        setPermissionError(null);
      } catch (error) {
        console.error(
          'Erro ao acessar mídia:',
          error
        );

        initializedRef.current =
          false;

        setPermissionError(
          'Não foi possível acessar a câmera ou o microfone. Verifique as permissões do navegador e tente novamente.'
        );

        setStatus('error');

        return;
      }

      try {
        const room =
          base44.actors.VideoRoom(
            roomId
          ).connect({
            id: connId,
          });

        roomRef.current = room;

        const pc =
          new RTCPeerConnection({
            iceServers:
              STUN_SERVERS,
          });

        pcRef.current = pc;

        if (
          localStreamRef.current
        ) {
          localStreamRef.current
            .getTracks()
            .forEach((track) => {
              pc.addTrack(
                track,
                localStreamRef.current
              );
            });
        }

        pc.ontrack = (event) => {
          const stream =
            event.streams?.[0];

          if (!stream) {
            return;
          }

          if (!remoteVideoRef.current) {
            return;
          }

          remoteVideoRef.current.srcObject =
            stream;

          remoteVideoRef.current.muted =
            !volOn;

          remoteVideoRef.current.volume =
            volOn ? 1 : 0;

          remoteVideoRef.current
            .play()
            .catch(() => {});

          setPeerPresent(true);
          setStatus('connected');
        };

        pc.onicecandidate = (event) => {
          if (
            !event.candidate ||
            !roomRef.current
          ) {
            return;
          }

          roomRef.current.send({
            type: 'signal',
            data: {
              kind: 'ice',
              candidate:
                event.candidate,
            },
          });
        };

        pc.onconnectionstatechange =
          () => {
            const connectionState =
              pc.connectionState;

            if (
              connectionState ===
              'connected'
            ) {
              setStatus('connected');
              return;
            }

            if (
              connectionState ===
              'connecting'
            ) {
              setStatus('connecting');
              return;
            }

            if (
              connectionState ===
                'disconnected' ||
              connectionState ===
                'failed'
            ) {
              setStatus('waiting');
              return;
            }

            if (
              connectionState ===
              'closed'
            ) {
              setStatus('waiting');
            }
          };

        pc.oniceconnectionstatechange =
          () => {
            const iceState =
              pc.iceConnectionState;

            if (
              iceState === 'connected' ||
              iceState === 'completed'
            ) {
              setStatus('connected');
            }

            if (
              iceState === 'checking'
            ) {
              setStatus('connecting');
            }

            if (
              iceState === 'failed'
            ) {
              setStatus('waiting');
            }
          };

        const subscription =
          room.subscribe((msg) => {
            if (
              !msg ||
              typeof msg !== 'object'
            ) {
              return;
            }

            if (msg.type === 'you') {
              const seat =
                msg.seat;

              setMySeat(seat);
              mySeatRef.current =
                seat;

              return;
            }

            if (
              msg.type === 'presence'
            ) {
              const users =
                Array.isArray(
                  msg.users
                )
                  ? msg.users
                  : [];

              const currentSeat =
                mySeatRef.current ??
                msg.seat;

              const others =
                users.filter(
                  (user) =>
                    user.seat !==
                    currentSeat
                );

              const peer =
                others[0];

              setPeerPresent(
                Boolean(peer)
              );

              setPeerRole(
                peer?.role || null
              );

              if (peer) {
                peerSeatRef.current =
                  peer.seat;

                politeRef.current =
                  currentSeat >
                  peer.seat;

                if (
                  currentSeat <
                    peer.seat &&
                  pcRef.current
                ) {
                  setStatus(
                    'connecting'
                  );

                  negotiate();
                }
              } else {
                peerSeatRef.current =
                  null;

                setStatus('waiting');
              }

              return;
            }

            if (
              msg.type === 'signal'
            ) {
              handleSignal(
                msg.data
              );

              return;
            }

            if (
              msg.type ===
              'chat_history'
            ) {
              const history =
                Array.isArray(
                  msg.messages
                )
                  ? msg.messages
                  : [];

              setMessages(
                history.map(
                  (message) => ({
                    from:
                      message.seat ===
                      mySeatRef.current
                        ? 'me'
                        : 'peer',
                    role:
                      message.role,
                    text:
                      message.text ||
                      '',
                    time:
                      formatMessageTime(
                        message.time
                      ),
                  })
                )
              );

              return;
            }

            if (
              msg.type === 'chat'
            ) {
              const message =
                msg.message ||
                msg;

              if (!message.text) {
                return;
              }

              setMessages(
                (current) => [
                  ...current,
                  {
                    from:
                      message.seat ===
                      mySeatRef.current
                        ? 'me'
                        : 'peer',
                    role:
                      message.role,
                    text:
                      message.text,
                    time:
                      formatMessageTime(
                        message.time
                      ),
                  },
                ]
              );
            }
          });

        subscriptionRef.current =
          subscription;

        room.send({
          type: 'role',
          role,
        });

        setStatus('waiting');
      } catch (error) {
        console.error(
          'Erro ao iniciar sala:',
          error
        );

        cleanupConnection();

        setPermissionError(
          'Não foi possível conectar à sala da consulta. Tente novamente.'
        );

        setStatus('error');
      }
    },
    [
      roomId,
      role,
      volOn,
      negotiate,
      handleSignal,
      cleanupConnection,
    ]
  );

  useEffect(() => {
    initializeCall();

    return () => {
      cleanupConnection();
    };
  }, [
    initializeCall,
    cleanupConnection,
  ]);

  useEffect(() => {
    if (status !== 'connected') {
      setElapsed(0);
      return undefined;
    }

    const timer =
      window.setInterval(() => {
        setElapsed(
          (current) =>
            current + 1
        );
      }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [status]);

  const toggleCam = () => {
    const stream =
      localStreamRef.current;

    if (!stream) {
      return;
    }

    const tracks =
      stream.getVideoTracks();

    if (tracks.length === 0) {
      return;
    }

    const next = !camOn;

    tracks.forEach(
      (track) => {
        track.enabled = next;
      }
    );

    setCamOn(next);
  };

  const toggleMic = () => {
    const stream =
      localStreamRef.current;

    if (!stream) {
      return;
    }

    const tracks =
      stream.getAudioTracks();

    if (tracks.length === 0) {
      return;
    }

    const next = !micOn;

    tracks.forEach(
      (track) => {
        track.enabled = next;
      }
    );

    setMicOn(next);
  };

  const toggleVolume = () => {
    const next = !volOn;

    setVolOn(next);

    if (remoteVideoRef.current) {
      remoteVideoRef.current.muted =
        !next;

      remoteVideoRef.current.volume =
        next ? 1 : 0;
    }
  };

  const sendMessage = () => {
    const text =
      draft.trim();

    const room =
      roomRef.current;

    if (!text || !room) {
      return;
    }

    room.send({
      type: 'chat',
      message: {
        text,
        role,
        seat:
          mySeatRef.current,
        time:
          new Date().toISOString(),
      },
    });

    setDraft('');
  };

  const retryConnection = async () => {
    if (retrying) {
      return;
    }

    setRetrying(true);

    cleanupConnection();

    setStatus('requesting');

    await new Promise(
      (resolve) =>
        setTimeout(resolve, 250)
    );

    setRetrying(false);

    initializeCall();
  };

  const endCall = () => {
    if (endingRef.current) {
      return;
    }

    endingRef.current = true;

    cleanupConnection();

    navigate(-1);
  };

  const peerLabel =
    peerRole === 'psychologist'
      ? peerName
      : peerRole === 'patient'
        ? 'Paciente'
        : peerName;

  if (!roomId) {
    return (
      <div className="min-h-screen bg-foreground text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-3xl bg-red-500/20 mx-auto flex items-center justify-center">
            <AlertTriangle
              size={34}
              className="text-red-400"
            />
          </div>

          <h1 className="mt-6 text-xl font-heading font-bold">
            Sala não encontrada
          </h1>

          <p className="mt-2 text-sm text-white/60">
            Não foi possível identificar a sala desta consulta.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate(-1)
            }
            className="mt-6 px-6 py-3 rounded-full gradient-brand font-semibold"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-foreground text-white flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-black/30 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center shrink-0">
            <Lock size={16} />
          </div>

          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">
              Sala privada do EntreNós
            </p>

            <p className="text-[11px] text-white/60 truncate">
              Consulta com {peerName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span
            className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full ${
              status === 'connected'
                ? 'bg-emerald-500/20 text-emerald-300'
                : status === 'error'
                  ? 'bg-red-500/20 text-red-300'
                  : 'bg-amber-500/20 text-amber-300'
            }`}
          >
            <Wifi size={13} />

            {status === 'connected'
              ? 'Conexão segura'
              : status === 'connecting'
                ? 'Conectando...'
                : status === 'waiting'
                  ? 'Aguardando'
                  : status === 'error'
                    ? 'Erro'
                    : 'Preparando...'}
          </span>

          {status === 'connected' && (
            <span className="text-sm font-mono tabular-nums">
              {formatElapsed(elapsed)}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 relative bg-black flex items-center justify-center p-4 sm:p-8 min-h-0">
        <div className="absolute inset-4 sm:inset-8 rounded-3xl overflow-hidden bg-gradient-to-br from-violet-900/40 to-slate-900 border border-white/10">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />

          {status !== 'connected' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
              <div className="w-20 h-20 rounded-3xl gradient-brand flex items-center justify-center shadow-glow animate-float">
                {status === 'error' ? (
                  <AlertTriangle size={34} />
                ) : status === 'waiting' ? (
                  <UserCircle2 size={34} />
                ) : (
                  <Video
                    size={34}
                    className="animate-pulse-soft"
                  />
                )}
              </div>

              <p className="mt-6 font-heading font-semibold text-lg">
                {status === 'error'
                  ? 'Algo deu errado'
                  : status === 'waiting'
                    ? 'Aguardando o profissional'
                    : status === 'connecting'
                      ? 'Estabelecendo conexão...'
                      : 'Preparando sua sala...'}
              </p>

              <p className="mt-1.5 text-sm text-white/60 max-w-sm">
                {status === 'error'
                  ? 'Verifique as permissões de câmera e microfone e tente novamente.'
                  : status === 'waiting'
                    ? `A consulta começa ${scheduledTime}. Você já pode entrar e aguardar.`
                    : 'Conectando você ao profissional de forma segura.'}
              </p>

              {status === 'waiting' && (
                <div className="mt-5 flex items-center gap-2 text-xs text-white/50">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse-soft" />

                  {peerPresent
                    ? 'Profissional entrou, conectando...'
                    : 'Profissional ainda não entrou'}
                </div>
              )}

              {status === 'error' && (
                <button
                  type="button"
                  onClick={retryConnection}
                  disabled={retrying}
                  className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full gradient-brand text-sm font-semibold disabled:opacity-50"
                >
                  <RefreshCw
                    size={15}
                    className={
                      retrying
                        ? 'animate-spin'
                        : ''
                    }
                  />

                  Tentar novamente
                </button>
              )}
            </div>
          )}

          {status === 'connected' && (
            <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md text-xs">
              {peerLabel}
            </div>
          )}
        </div>

        <div className="absolute bottom-6 right-6 w-32 sm:w-44 aspect-[3/4] rounded-2xl overflow-hidden bg-slate-800 border-2 border-white/20 shadow-glow z-10">
          {camOn ? (
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover scale-x-[-1]"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-white/50 gap-2">
              <VideoOff size={22} />

              <span className="text-[11px]">
                Câmera desligada
              </span>
            </div>
          )}

          <span className="absolute bottom-2 left-2 text-[10px] px-2 py-0.5 rounded-full bg-black/50">
            Você
          </span>
        </div>

        {permissionError &&
          status !== 'error' && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 max-w-md w-[90%] glass-strong rounded-2xl p-4 flex items-start gap-3 text-sm animate-fade-in z-10">
              <AlertTriangle
                size={18}
                className="text-amber-400 shrink-0 mt-0.5"
              />

              <div>
                <p className="font-medium">
                  Permissão necessária
                </p>

                <p className="text-white/70 text-xs mt-1">
                  {permissionError}
                </p>
              </div>
            </div>
          )}
      </div>

      {chatOpen && (
        <div className="absolute right-0 top-0 bottom-0 w-full sm:w-80 bg-slate-900/95 backdrop-blur-xl border-l border-white/10 flex flex-col z-30 animate-fade-in">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <span className="font-semibold text-sm inline-flex items-center gap-2">
              <MessageCircle size={16} />
              Chat da consulta
            </span>

            <button
              type="button"
              onClick={() =>
                setChatOpen(false)
              }
              className="text-white/60 hover:text-white"
              aria-label="Fechar chat"
            >
              <PhoneOff size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <p className="text-xs text-white/40 text-center mt-8">
                As mensagens são privadas e permanecem nesta sala.
              </p>
            )}

            {messages.map(
              (message, index) => (
                <div
                  key={`${message.time}-${index}`}
                  className={`max-w-[80%] ${
                    message.from === 'me'
                      ? 'ml-auto'
                      : ''
                  }`}
                >
                  <div
                    className={`px-3 py-2 rounded-2xl text-sm break-words ${
                      message.from === 'me'
                        ? 'gradient-brand'
                        : 'bg-white/10'
                    }`}
                  >
                    {message.text}
                  </div>

                  <p className="text-[10px] text-white/40 mt-1 text-right">
                    {message.time}
                  </p>
                </div>
              )
            )}
          </div>

          <div className="p-3 border-t border-white/10 flex gap-2">
            <input
              value={draft}
              onChange={(event) =>
                setDraft(
                  event.target.value
                )
              }
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Mensagem..."
              maxLength={1000}
              className="flex-1 px-3 py-2 rounded-xl bg-white/10 text-sm placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />

            <button
              type="button"
              onClick={sendMessage}
              disabled={!draft.trim()}
              className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center disabled:opacity-40"
              aria-label="Enviar mensagem"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      <div className="px-4 sm:px-6 py-5 bg-black/40 backdrop-blur-md border-t border-white/10">
        <div className="flex items-center justify-center gap-3 sm:gap-4">
          <ControlButton
            active={camOn}
            onClick={toggleCam}
            iconOn={Video}
            iconOff={VideoOff}
            label="Câmera"
          />

          <ControlButton
            active={micOn}
            onClick={toggleMic}
            iconOn={Mic}
            iconOff={MicOff}
            label="Microfone"
          />

          <ControlButton
            active={volOn}
            onClick={toggleVolume}
            iconOn={Volume2}
            iconOff={VolumeX}
            label="Volume"
          />

          <ControlButton
            active={chatOpen}
            onClick={() =>
              setChatOpen(
                (current) => !current
              )
            }
            iconOn={MessageCircle}
            iconOff={MessageCircle}
            label="Chat"
          />

          <button
            type="button"
            onClick={endCall}
            className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors shadow-glow"
            aria-label="Encerrar chamada"
          >
            <PhoneOff size={22} />
          </button>
        </div>

        <p className="text-center text-[11px] text-white/40 mt-3 inline-flex items-center justify-center gap-1.5 w-full">
          <ShieldCheck size={12} />
          Nenhuma gravação automática. Esta sala é protegida.
        </p>
      </div>
    </div>
  );
}
