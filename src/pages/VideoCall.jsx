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
import { supabase } from '@/lib/supabase';

const STUN_SERVERS = [
  {
    urls: 'stun:stun.l.google.com:19302',
  },
];

function createConnectionId(roomId) {
  const storageKey = `vc_connId_${roomId}`;

  let connId = null;

  try {
    connId = sessionStorage.getItem(storageKey);
  } catch (_) {}

  if (connId) {
    return connId;
  }

  connId =
    typeof crypto !== 'undefined' &&
    crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`;

  try {
    sessionStorage.setItem(
      storageKey,
      connId
    );
  } catch (_) {}

  return connId;
}

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

export default function VideoCall() {
  const location = useLocation();
  const navigate = useNavigate();

  const params = new URLSearchParams(
    location.search
  );

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

  const channelRef =
    useRef(null);

  const connectionIdRef =
    useRef(null);

  const mySeatRef =
    useRef(null);

  const peerSeatRef =
    useRef(null);

  const peerRoleRef =
    useRef(null);

  const peerConnectionsRef =
    useRef(new Map());

  const iceQueueRef =
    useRef([]);

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

  const volOnRef =
    useRef(volOn);

  useEffect(() => {
    volOnRef.current = volOn;
  }, [volOn]);

  /*
   * Mantém o áudio remoto sincronizado.
   */
  useEffect(() => {
    const video =
      remoteVideoRef.current;

    if (!video) {
      return;
    }

    video.muted = !volOn;
    video.volume = volOn ? 1 : 0;
  }, [volOn, status]);

  /*
   * Fecha a conexão atual.
   */
  const cleanupConnection = useCallback(() => {
    const channel =
      channelRef.current;

    if (channel) {
      try {
        supabase.removeChannel(
          channel
        );
      } catch (_) {}
    }

    channelRef.current = null;

    const pc =
      pcRef.current;

    if (pc) {
      try {
        pc.ontrack = null;
        pc.onicecandidate = null;
        pc.onconnectionstatechange =
          null;
        pc.oniceconnectionstatechange =
          null;
        pc.onnegotiationneeded = null;
        pc.ondatachannel = null;
        pc.close();
      } catch (_) {}
    }

    pcRef.current = null;

    peerConnectionsRef.current.forEach(
      (connection) => {
        try {
          connection.close();
        } catch (_) {}
      }
    );

    peerConnectionsRef.current.clear();

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
      localVideoRef.current.srcObject =
        null;
    }

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject =
        null;
    }

    iceQueueRef.current = [];
    mySeatRef.current = null;
    peerSeatRef.current = null;
    peerRoleRef.current = null;

    politeRef.current = false;
    makingOfferRef.current = false;
    ignoreOfferRef.current = false;
    initializedRef.current = false;

    setMySeat(null);
    setPeerPresent(false);
    setPeerRole(null);
  }, []);

  /*
   * Publica uma mensagem pelo canal Realtime.
   */
  const sendRoomMessage = useCallback(
    async (payload) => {
      const channel =
        channelRef.current;

      if (!channel) {
        return false;
      }

      try {
        const result =
          await channel.send({
            type: 'broadcast',
            event: 'room',
            payload,
          });

        if (
          result &&
          typeof result === 'object' &&
          result !== 'ok'
        ) {
          /*
           * Algumas versões retornam "ok",
           * outras retornam objeto.
           * Não interrompemos a chamada aqui.
           */
        }

        return true;
      } catch (error) {
        console.error(
          'Erro ao enviar mensagem da sala:',
          error
        );

        return false;
      }
    },
    []
  );

  /*
   * Adiciona candidatos ICE pendentes.
   */
  const flushIceQueue =
    useCallback(async () => {
      const pc =
        pcRef.current;

      if (
        !pc ||
        !pc.remoteDescription
      ) {
        return;
      }

      const queue = [
        ...iceQueueRef.current,
      ];

      iceQueueRef.current = [];

      for (
        const candidate of queue
      ) {
        try {
          await pc.addIceCandidate(
            candidate
          );
        } catch (error) {
          console.warn(
            'Não foi possível adicionar candidato ICE:',
            error
          );
        }
      }
    }, []);

  /*
   * Cria oferta WebRTC.
   */
  const negotiate =
    useCallback(async () => {
      const pc =
        pcRef.current;

      if (!pc) {
        return;
      }

      if (
        makingOfferRef.current
      ) {
        return;
      }

      if (
        pc.signalingState !==
        'stable'
      ) {
        return;
      }

      if (!peerSeatRef.current) {
        return;
      }

      try {
        makingOfferRef.current =
          true;

        setStatus('connecting');

        const offer =
          await pc.createOffer();

        if (
          pc.signalingState !==
          'stable'
        ) {
          return;
        }

        await pc.setLocalDescription(
          offer
        );

        await sendRoomMessage({
          kind: 'offer',
          fromSeat:
            mySeatRef.current,
          toSeat:
            peerSeatRef.current,
          sdp:
            pc.localDescription,
        });
      } catch (error) {
        console.error(
          'Erro ao criar oferta WebRTC:',
          error
        );
      } finally {
        makingOfferRef.current =
          false;
      }
    }, [sendRoomMessage]);

  /*
   * Processa a sinalização WebRTC.
   */
  const handleSignal =
    useCallback(
      async (data) => {
        const pc =
          pcRef.current;

        if (!pc || !data) {
          return;
        }

        /*
         * Ignora mensagens destinadas
         * a outro participante.
         */
        if (
          data.toSeat &&
          mySeatRef.current &&
          data.toSeat !==
            mySeatRef.current
        ) {
          return;
        }

        try {
          if (
            data.kind === 'offer'
          ) {
            const offerCollision =
              makingOfferRef.current ||
              pc.signalingState !==
                'stable';

            const shouldIgnore =
              offerCollision &&
              !politeRef.current;

            ignoreOfferRef.current =
              shouldIgnore;

            if (shouldIgnore) {
              return;
            }

            if (offerCollision) {
              await pc.setLocalDescription(
                {
                  type: 'rollback',
                }
              );
            }

            await pc.setRemoteDescription(
              data.sdp
            );

            peerSeatRef.current =
              data.fromSeat ||
              peerSeatRef.current;

            await flushIceQueue();

            const answer =
              await pc.createAnswer();

            await pc.setLocalDescription(
              answer
            );

            await sendRoomMessage({
              kind: 'answer',
              fromSeat:
                mySeatRef.current,
              toSeat:
                data.fromSeat,
              sdp:
                pc.localDescription,
            });

            setStatus('connecting');

            return;
          }

          if (
            data.kind === 'answer'
          ) {
            if (
              data.toSeat &&
              data.toSeat !==
                mySeatRef.current
            ) {
              return;
            }

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

          if (
            data.kind === 'ice'
          ) {
            if (
              !data.candidate
            ) {
              return;
            }

            if (
              pc.remoteDescription
            ) {
              try {
                await pc.addIceCandidate(
                  data.candidate
                );
              } catch (error) {
                if (
                  !ignoreOfferRef.current
                ) {
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
      [
        flushIceQueue,
        sendRoomMessage,
      ]
    );

  /*
   * Cria a conexão WebRTC.
   */
  const createPeerConnection =
    useCallback(() => {
      if (pcRef.current) {
        return pcRef.current;
      }

      const pc =
        new RTCPeerConnection({
          iceServers:
            STUN_SERVERS,
        });

      pcRef.current = pc;

      if (localStreamRef.current) {
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

        if (
          !stream ||
          !remoteVideoRef.current
        ) {
          return;
        }

        remoteVideoRef.current.srcObject =
          stream;

        remoteVideoRef.current.muted =
          !volOnRef.current;

        remoteVideoRef.current.volume =
          volOnRef.current ? 1 : 0;

        remoteVideoRef.current
          .play()
          .catch(() => {});

        setStatus('connected');
      };

      pc.onicecandidate = (
        event
      ) => {
        if (
          !event.candidate
        ) {
          return;
        }

        sendRoomMessage({
          kind: 'ice',
          fromSeat:
            mySeatRef.current,
          toSeat:
            peerSeatRef.current,
          candidate:
            event.candidate,
        });
      };

      pc.onconnectionstatechange =
        () => {
          const state =
            pc.connectionState;

          if (
            state === 'connected'
          ) {
            setStatus(
              'connected'
            );
          }

          if (
            state === 'connecting'
          ) {
            setStatus(
              'connecting'
            );
          }

          if (
            state === 'disconnected'
          ) {
            setStatus('waiting');
          }

          if (
            state === 'failed'
          ) {
            setStatus('waiting');
          }

          if (
            state === 'closed'
          ) {
            setStatus('waiting');
          }
        };

      pc.oniceconnectionstatechange =
        () => {
          const state =
            pc.iceConnectionState;

          if (
            state === 'connected' ||
            state === 'completed'
          ) {
            setStatus(
              'connected'
            );
          }

          if (
            state === 'failed'
          ) {
            setStatus('waiting');
          }
        };

      pc.onnegotiationneeded =
        async () => {
          /*
           * Somente o participante
           * escolhido pelo seat inicia.
           */
          if (
            !politeRef.current &&
            peerSeatRef.current
          ) {
            await negotiate();
          }
        };

      return pc;
    }, [negotiate, sendRoomMessage]);

  /*
   * Processa mensagens do Realtime.
   */
  const handleRoomEvent =
    useCallback(
      async (event) => {
        const payload =
          event?.payload || event;

        if (!payload) {
          return;
        }

        if (
          payload.roomEvent ===
          'presence'
        ) {
          const users =
            Array.isArray(
              payload.users
            )
              ? payload.users
              : [];

          const currentSeat =
            mySeatRef.current;

          const others =
            users.filter(
              (user) =>
                user &&
                user.seat !==
                  currentSeat
            );

          const peer =
            others[0] || null;

          setPeerPresent(
            Boolean(peer)
          );

          setPeerRole(
            peer?.role || null
          );

          if (peer) {
            peerSeatRef.current =
              peer.seat;

            peerRoleRef.current =
              peer.role || null;

            politeRef.current =
              Number(
                currentSeat
              ) >
              Number(peer.seat);

            createPeerConnection();

            /*
             * O seat menor inicia.
             */
            if (
              Number(currentSeat) <
                Number(peer.seat)
            ) {
              setStatus(
                'connecting'
              );

              await negotiate();
            }
          } else {
            peerSeatRef.current =
              null;

            peerRoleRef.current =
              null;

            setStatus('waiting');
          }

          return;
        }

        if (
          payload.roomEvent ===
          'signal'
        ) {
          await handleSignal(
            payload.data
          );

          return;
        }

        if (
          payload.roomEvent ===
          'chat'
        ) {
          const message =
            payload.message;

          if (
            !message ||
            !message.text
          ) {
            return;
          }

          setMessages(
            (current) => [
              ...current,
              {
                id:
                  message.id ||
                  `${Date.now()}-${Math.random()}`,
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

          return;
        }
      },
      [
        createPeerConnection,
        handleSignal,
        negotiate,
      ]
    );

  /*
   * Inicia câmera, microfone,
   * canal Realtime e WebRTC.
   */
  const initializeCall =
    useCallback(async () => {
      if (!roomId) {
        setPermissionError(
          'Sala de consulta não identificada.'
        );
        setStatus('error');
        return;
      }

      if (
        initializedRef.current
      ) {
        return;
      }

      initializedRef.current =
        true;

      setPermissionError(null);
      setStatus('requesting');

      const connectionId =
        createConnectionId(
          roomId
        );

      connectionIdRef.current =
        connectionId;

      try {
        if (
          !navigator.mediaDevices ||
          !navigator.mediaDevices
            .getUserMedia
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
                facingMode:
                  'user',
              },
              audio: {
                echoCancellation:
                  true,
                noiseSuppression:
                  true,
                autoGainControl:
                  true,
              },
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

        const videoTracks =
          stream.getVideoTracks();

        const audioTracks =
          stream.getAudioTracks();

        setCamOn(
          videoTracks.some(
            (track) =>
              track.enabled
          )
        );

        setMicOn(
          audioTracks.some(
            (track) =>
              track.enabled
          )
        );
      } catch (error) {
        console.error(
          'Erro ao acessar câmera/microfone:',
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
        /*
         * Canal privado da consulta.
         */
        const channel =
          supabase.channel(
            `video-room:${roomId}`,
            {
              config: {
                private: true,
              },
            }
          );

        channelRef.current =
          channel;

        /*
         * Eventos de presença.
         */
        channel.on(
          'presence',
          {
            event: 'sync',
          },
          () => {
            const state =
              channel.presenceState();

            const users =
              Object.entries(
                state
              ).flatMap(
                ([
                  key,
                  entries,
                ]) =>
                  entries.map(
                    (entry) => ({
                      ...entry,
                      presenceKey:
                        key,
                    })
                  )
              );

            const currentSeat =
              mySeatRef.current;

            const others =
              users.filter(
                (user) =>
                  user.seat !==
                  currentSeat
              );

            const peer =
              others[0] ||
              null;

            setPeerPresent(
              Boolean(peer)
            );

            setPeerRole(
              peer?.role || null
            );

            if (peer) {
              peerSeatRef.current =
                peer.seat;

              peerRoleRef.current =
                peer.role || null;

              politeRef.current =
                Number(
                  currentSeat
                ) >
                Number(
                  peer.seat
                );

              createPeerConnection();

              if (
                Number(
                  currentSeat
                ) <
                  Number(
                    peer.seat
                  )
              ) {
                setStatus(
                  'connecting'
                );

                negotiate();
              }
            } else {
              peerSeatRef.current =
                null;

              setStatus(
                'waiting'
              );
            }
          }
        );

        /*
         * Eventos de sinalização e chat.
         */
        channel.on(
          'broadcast',
          {
            event: 'room',
          },
          async ({
            payload,
          }) => {
            await handleRoomEvent(
              payload
            );
          }
        );

        const subscription =
          await channel.subscribe(
            async (subscribeStatus) => {
              if (
                subscribeStatus !==
                'SUBSCRIBED'
              ) {
                return;
              }

              /*
               * Seat baseado no papel.
               *
               * 0 = paciente
               * 1 = psicólogo
               *
               * Isso garante que cada sala
               * tenha dois lugares previsíveis.
               */
              const seat =
                role ===
                'psychologist'
                  ? 1
                  : 0;

              mySeatRef.current =
                seat;

              setMySeat(seat);

              await channel.track({
                connectionId,
                seat,
                role,
                joinedAt:
                  new Date().toISOString(),
              });

              createPeerConnection();

              setStatus('waiting');
            }
          );

        /*
         * O subscribe retorna o próprio
         * canal nas versões atuais.
         */
        subscriptionRefSafe(
          subscription
        );
      } catch (error) {
        console.error(
          'Erro ao conectar à sala Supabase:',
          error
        );

        cleanupConnection();

        setPermissionError(
          'Não foi possível conectar à sala da consulta. Verifique sua conexão e tente novamente.'
        );

        setStatus('error');
      }
    }, [
      roomId,
      role,
      cleanupConnection,
      createPeerConnection,
      handleRoomEvent,
      negotiate,
    ]);

  /*
   * Inicialização.
   */
  useEffect(() => {
    initializeCall();

    return () => {
      cleanupConnection();
    };
  }, [
    initializeCall,
    cleanupConnection,
  ]);

  /*
   * Cronômetro da consulta.
   */
  useEffect(() => {
    if (
      status !== 'connected'
    ) {
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
      window.clearInterval(
        timer
      );
    };
  }, [status]);

  /*
   * Formata o cronômetro.
   */
  const formatElapsed =
    useCallback(
      (seconds) => {
        const minutes =
          Math.floor(
            seconds / 60
          );

        const remainingSeconds =
          seconds % 60;

        return (
          String(minutes).padStart(
            2,
            '0'
          ) +
          ':' +
          String(
            remainingSeconds
          ).padStart(2, '0')
        );
      },
      []
    );

  /*
   * Liga/desliga câmera.
   */
  const toggleCam = () => {
    const stream =
      localStreamRef.current;

    if (!stream) {
      return;
    }

    const next = !camOn;

    stream
      .getVideoTracks()
      .forEach((track) => {
        track.enabled = next;
      });

    setCamOn(next);
  };

  /*
   * Liga/desliga microfone.
   */
  const toggleMic = () => {
    const stream =
      localStreamRef.current;

    if (!stream) {
      return;
    }

    const next = !micOn;

    stream
      .getAudioTracks()
      .forEach((track) => {
        track.enabled = next;
      });

    setMicOn(next);
  };

  /*
   * Liga/desliga volume.
   */
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

  /*
   * Envia mensagem pelo Realtime.
   */
  const sendMessage = async () => {
    const text =
      draft.trim();

    if (!text) {
      return;
    }

    if (
      !channelRef.current
    ) {
      return;
    }

    const message = {
      id:
        typeof crypto !==
          'undefined' &&
        crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`,
      text,
      role,
      seat:
        mySeatRef.current,
      time:
        new Date().toISOString(),
    };

    const sent =
      await sendRoomMessage({
        roomEvent: 'chat',
        message,
      });

    if (sent) {
      setDraft('');
    }
  };

  /*
   * Tenta novamente.
   */
  const retryConnection =
    async () => {
      if (retrying) {
        return;
      }

      setRetrying(true);

      cleanupConnection();

      setStatus(
        'requesting'
      );

      await new Promise(
        (resolve) =>
          setTimeout(
            resolve,
            300
          )
      );

      setRetrying(false);

      initializeCall();
    };

  /*
   * Encerra a chamada.
   */
  const endCall = () => {
    if (
      endingRef.current
    ) {
      return;
    }

    endingRef.current =
      true;

    cleanupConnection();

    navigate(-1);
  };

  const peerLabel =
    peerRole ===
    'psychologist'
      ? peerName
      : peerRole === 'patient'
        ? 'Paciente'
        : peerName;

  /*
   * Sala inexistente.
   */
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
            Não foi possível
            identificar a sala desta
            consulta.
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
      {/* Top bar */}
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
              Consulta com{' '}
              {peerName}
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

            {status ===
            'connected'
              ? 'Conexão segura'
              : status ===
                  'connecting'
                ? 'Conectando...'
                : status ===
                    'waiting'
                  ? 'Aguardando'
                  : status ===
                      'error'
                    ? 'Erro'
                    : 'Preparando...'}
          </span>

          {status ===
            'connected' && (
            <span className="text-sm font-mono tabular-nums">
              {formatElapsed(
                elapsed
              )}
            </span>
          )}
        </div>
      </div>

      {/* Stage */}
      <div className="flex-1 relative bg-black flex items-center justify-center p-4 sm:p-8 min-h-0">
        {/* Remote video */}
        <div className="absolute inset-4 sm:inset-8 rounded-3xl overflow-hidden bg-gradient-to-br from-violet-900/40 to-slate-900 border border-white/10">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />

          {status !==
            'connected' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
              <div className="w-20 h-20 rounded-3xl gradient-brand flex items-center justify-center shadow-glow animate-float">
                {status ===
                'error' ? (
                  <AlertTriangle size={34} />
                ) : status ===
                  'waiting' ? (
                  <UserCircle2 size={34} />
                ) : (
                  <Video
                    size={34}
                    className="animate-pulse-soft"
                  />
                )}
              </div>

              <p className="mt-6 font-heading font-semibold text-lg">
                {status ===
                'error'
                  ? 'Algo deu errado'
                  : status ===
                      'waiting'
                    ? 'Aguardando o profissional'
                    : status ===
                        'connecting'
                      ? 'Estabelecendo conexão...'
                      : 'Preparando sua sala...'}
              </p>

              <p className="mt-1.5 text-sm text-white/60 max-w-sm">
                {status ===
                'error'
                  ? 'Verifique as permissões de câmera e microfone e tente novamente.'
                  : status ===
                      'waiting'
                    ? `A consulta começa ${scheduledTime}. Você já pode entrar e aguardar.`
                    : 'Conectando você ao profissional de forma segura.'}
              </p>

              {status ===
                'waiting' && (
                <div className="mt-5 flex items-center gap-2 text-xs text-white/50">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse-soft" />

                  {peerPresent
                    ? 'Profissional entrou, conectando...'
                    : 'Profissional ainda não entrou'}
                </div>
              )}

              {status ===
                'error' && (
                <button
                  type="button"
                  onClick={
                    retryConnection
                  }
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

          {status ===
            'connected' && (
            <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md text-xs">
              {peerLabel}
            </div>
          )}
        </div>

        {/* Local self-view */}
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
              <VideoOff
                size={22}
              />

              <span className="text-[11px]">
                Câmera desligada
              </span>
            </div>
          )}

          <span className="absolute bottom-2 left-2 text-[10px] px-2 py-0.5 rounded-full bg-black/50">
            Você
          </span>
        </div>

        {/* Permission error */}
        {permissionError &&
          status !==
            'error' && (
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

      {/* Chat */}
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
            {messages.length ===
              0 && (
              <p className="text-xs text-white/40 text-center mt-8">
                As mensagens são privadas e permanecem nesta sala.
              </p>
            )}

            {messages.map(
              (message, index) => (
                <div
                  key={`${message.id || message.time}-${index}`}
                  className={`max-w-[80%] ${
                    message.from ===
                    'me'
                      ? 'ml-auto'
                      : ''
                  }`}
                >
                  <div
                    className={`px-3 py-2 rounded-2xl text-sm break-words ${
                      message.from ===
                      'me'
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
                if (
                  event.key ===
                  'Enter'
                ) {
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
              disabled={
                !draft.trim()
              }
              className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center disabled:opacity-40"
              aria-label="Enviar mensagem"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Controls */}
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
            onClick={
              toggleVolume
            }
            iconOn={Volume2}
            iconOff={VolumeX}
            label="Volume"
          />

          <ControlButton
            active={chatOpen}
            onClick={() =>
              setChatOpen(
                (current) =>
                  !current
              )
            }
            iconOn={
              MessageCircle
            }
            iconOff={
              MessageCircle
            }
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

function subscriptionRefSafe(subscription) {
  /*
   * O Supabase Realtime trabalha com o próprio
   * objeto de canal. Esta função existe apenas
   * para manter compatibilidade com diferentes
   * versões do cliente.
   */
  return subscription;
}

function ControlButton({
  active,
  onClick,
  iconOn,
  iconOff,
  label,
}) {
  const Icon = active
    ? iconOn
    : iconOff;

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
