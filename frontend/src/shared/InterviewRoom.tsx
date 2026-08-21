import { useEffect, useRef, useState } from 'react';
import { API, authHeaders } from './api';
import { useRealtime } from './realtime';

type IceServer = { urls: string[]; username?: string; credential?: string };
type JoinResponse = { interviewId: number; roomId: string; role: 'CANDIDATE' | 'EVALUATOR'; iceServers: IceServer[] };
type Signal = { type: 'READY' | 'OFFER' | 'ANSWER' | 'ICE_CANDIDATE' | 'LEAVE'; payload?: RTCSessionDescriptionInit | RTCIceCandidateInit };
export type InterviewSummary = { id: number; jobTitle: string; interviewType: string; mode?: string; status: string; scheduledAt?: string; durationMinutes?: number; joinAvailable?: boolean };

class AuthenticationExpiredError extends Error {}
class AuthenticatedRequestError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

const joinRequests = new Map<string, { promise: Promise<JoinResponse>; expiresAt: number }>();

function jwtExpiresAt(token: string) {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(payload.length / 4) * 4, '=');
    const decoded = JSON.parse(window.atob(normalized)) as { exp?: number };
    return typeof decoded.exp === 'number' ? decoded.exp * 1000 : null;
  } catch {
    return null;
  }
}

function isJwtExpired(token: string) {
  const expiresAt = jwtExpiresAt(token);
  return expiresAt !== null && expiresAt <= Date.now();
}

async function joinInterviewRoom(interviewId: number, token: string) {
  const accessToken = token.trim();
  const key = `${interviewId}:${accessToken}`;
  const now = Date.now();
  const cached = joinRequests.get(key);
  if (cached && cached.expiresAt > now) return cached.promise;
  const entry = {
    expiresAt: now + 2000,
    promise: fetch(`${API}/api/interview-rooms/${interviewId}/join`, { method: 'POST', headers: authHeaders(accessToken) }).then(async response => {
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        const message = body.message || body.error || 'This interview room is not available';
        if (response.status === 401) throw new AuthenticatedRequestError(response.status, message);
        throw new Error(message);
      }
      return response.json() as Promise<JoinResponse>;
    }),
  };
  joinRequests.set(key, entry);
  entry.promise.then(
    () => undefined,
    () => undefined,
  ).then(() => window.setTimeout(() => { if (joinRequests.get(key) === entry) joinRequests.delete(key); }, Math.max(0, entry.expiresAt - Date.now())));
  return entry.promise;
}

export function InterviewRoom({ interview, token, onLeave, onAuthExpired }: { interview: InterviewSummary; token: string; onLeave: () => void; onAuthExpired?: () => void }) {
  const localVideo = useRef<HTMLVideoElement>(null), remoteVideo = useRef<HTMLVideoElement>(null);
  const { connectionError, publish, subscribe } = useRealtime();
  const [state, setState] = useState('Preparing camera and microphone...'), [error, setError] = useState('');
  const [micEnabled, setMicEnabled] = useState(true), [cameraEnabled, setCameraEnabled] = useState(true), [elapsed, setElapsed] = useState(0);
  const streamRef = useRef<MediaStream | null>(null);
  const realtimeErrorRef = useRef(connectionError);

  useEffect(() => { const timer = window.setInterval(() => setElapsed(value => value + 1), 1000); return () => window.clearInterval(timer); }, []);
  useEffect(() => { realtimeErrorRef.current = connectionError; }, [connectionError]);
  useEffect(() => {
    let disposed = false, joined = false, offerStarted = false;
    let peer: RTCPeerConnection | null = null, unsubscribe: () => void = () => {}, role: JoinResponse['role'] | null = null;
    const queuedCandidates: RTCIceCandidateInit[] = [], destination = `/app/interviews/${interview.id}/signal`;
    const send = (type: string, payload?: unknown) => publish(destination, { type, payload });
    const flushCandidates = async () => { if (!peer?.remoteDescription) return; while (queuedCandidates.length) await peer.addIceCandidate(queuedCandidates.shift()!); };
    const handleSignal = async (signal: Signal) => {
      if (!peer || disposed) return;
      if (signal.type === 'READY' && role === 'CANDIDATE' && !offerStarted) {
        offerStarted = true; const offer = await peer.createOffer(); await peer.setLocalDescription(offer); send('OFFER', peer.localDescription);
      } else if (signal.type === 'OFFER' && role === 'EVALUATOR') {
        await peer.setRemoteDescription(signal.payload as RTCSessionDescriptionInit); await flushCandidates(); const answer = await peer.createAnswer(); await peer.setLocalDescription(answer); send('ANSWER', peer.localDescription);
      } else if (signal.type === 'ANSWER' && role === 'CANDIDATE') {
        await peer.setRemoteDescription(signal.payload as RTCSessionDescriptionInit); await flushCandidates();
      } else if (signal.type === 'ICE_CANDIDATE' && signal.payload) {
        const candidate = signal.payload as RTCIceCandidateInit; if (peer.remoteDescription) await peer.addIceCandidate(candidate); else queuedCandidates.push(candidate);
      } else if (signal.type === 'LEAVE') setState('The other participant left');
    };
    const start = async () => {
      try {
        const accessToken = token?.trim();
        if (!accessToken) throw new AuthenticationExpiredError('Your session is missing an authentication token. Please sign in again.');
        if (isJwtExpired(accessToken)) throw new AuthenticationExpiredError('Your session expired. Please sign in again.');
        const room = await joinInterviewRoom(interview.id, accessToken); role = room.role;
        const mediaDevices = globalThis.navigator?.mediaDevices;
        if (!mediaDevices?.getUserMedia) {
          const reason = window.isSecureContext
            ? 'This browser does not expose camera and microphone APIs.'
            : 'Camera and microphone require a secure context. Open the app on localhost or over HTTPS.';
          throw new Error(reason);
        }
        const stream = await mediaDevices.getUserMedia({ video: true, audio: true });
        if (disposed) { stream.getTracks().forEach(track => track.stop()); return; }
        streamRef.current = stream; if (localVideo.current) localVideo.current.srcObject = stream;
        peer = new RTCPeerConnection({ iceServers: room.iceServers });
        stream.getTracks().forEach(track => peer!.addTrack(track, stream));
        peer.ontrack = event => { if (remoteVideo.current) remoteVideo.current.srcObject = event.streams[0]; };
        peer.onicecandidate = event => { if (event.candidate) send('ICE_CANDIDATE', event.candidate.toJSON()); };
        peer.onconnectionstatechange = () => { const value = peer?.connectionState ?? 'closed'; setState(value === 'connected' ? 'Connected' : value === 'failed' ? 'Connection failed' : value === 'disconnected' ? 'Disconnected' : 'Connecting...'); };
        unsubscribe = subscribe(`/user/queue/interviews/${interview.id}`, message => { try { void handleSignal(JSON.parse(message.body) as Signal).catch(() => setState('Signaling error')); } catch { setState('Invalid signaling message'); } });
        setState('Waiting for realtime connection...');
        const waitForConnection = window.setInterval(() => { try { send('JOIN'); joined = true; window.clearInterval(waitForConnection); setState('Waiting for the other participant...'); } catch { /* reconnect loop */ } }, 300);
        window.setTimeout(() => {
          window.clearInterval(waitForConnection);
          if (!joined && !disposed) {
            setError(realtimeErrorRef.current || 'Unable to connect to the realtime interview server.');
            setState('Realtime connection unavailable');
          }
        }, 15000);
      } catch (caught) {
        if (caught instanceof AuthenticationExpiredError) {
          onAuthExpired?.();
          return;
        }
        if (caught instanceof AuthenticatedRequestError) {
          const tokenState = isJwtExpired(token) ? 'expired locally' : 'not expired locally';
          setError(`Authentication failed while joining the interview (${caught.message}; token ${tokenState}). Please sign in again if this persists.`);
          setState('Unable to join');
          return;
        }
        const message = caught instanceof DOMException ? (caught.name === 'NotAllowedError' ? 'Camera or microphone permission was denied.' : `Media device error: ${caught.message}`) : caught instanceof Error ? caught.message : 'Unable to enter interview';
        setError(message); setState('Unable to join');
      }
    };
    void start();
    return () => { disposed = true; if (joined) { try { send('LEAVE'); } catch { /* socket already closed */ } } unsubscribe(); peer?.close(); streamRef.current?.getTracks().forEach(track => track.stop()); streamRef.current = null; };
  }, [interview.id, onAuthExpired, publish, subscribe, token]);

  const toggleTrack = (kind: 'audio' | 'video') => { const tracks = kind === 'audio' ? streamRef.current?.getAudioTracks() : streamRef.current?.getVideoTracks(); const enabled = !(tracks?.[0]?.enabled ?? false); tracks?.forEach(track => { track.enabled = enabled; }); if (kind === 'audio') setMicEnabled(enabled); else setCameraEnabled(enabled); };
  const time = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;
  return <section className="interview-room"><header><div><small>{interview.interviewType.replaceAll('_', ' ')}</small><h1>{interview.jobTitle}</h1></div><div className="room-state"><span className={state === 'Connected' ? 'online' : ''}>{state}</span><time>{time}</time></div></header>{error && <div className="candidate-alert">{error}</div>}<div className="video-stage"><video ref={remoteVideo} autoPlay playsInline className="remote-video" /><div className="remote-placeholder">{state === 'Connected' ? 'Remote video' : state}</div><video ref={localVideo} autoPlay playsInline muted className="local-video" /></div><footer><button className={micEnabled ? '' : 'off'} onClick={() => toggleTrack('audio')}>{micEnabled ? 'Mute microphone' : 'Unmute microphone'}</button><button className={cameraEnabled ? '' : 'off'} onClick={() => toggleTrack('video')}>{cameraEnabled ? 'Turn camera off' : 'Turn camera on'}</button><button className="leave-call" onClick={onLeave}>Leave</button></footer></section>;
}
