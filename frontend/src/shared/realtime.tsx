import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { API, authHeaders } from './api';
import type { Session } from './types';

export type NotificationItem = {
  id: number;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  type?: string;
  actionUrl?: string;
};

type RealtimeValue = {
  connected: boolean;
  connectionError: string;
  notifications: NotificationItem[];
  unreadCount: number;
  markRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
  publish: (destination: string, body: unknown) => void;
  subscribe: (destination: string, callback: (message: IMessage) => void) => () => void;
};

const RealtimeContext = createContext<RealtimeValue | null>(null);

function websocketUrl() {
  const configured = import.meta.env.VITE_WS_URL as string | undefined;
  if (configured) return configured;
  if (API.startsWith('http')) return `${API.replace(/^http/, 'ws')}/ws`;
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws`;
}

export function RealtimeProvider({ session, children }: { session: Session; children: ReactNode }) {
  const clientRef = useRef<Client | null>(null);
  const subscriptions = useRef(new Map<string, Set<(message: IMessage) => void>>());
  const activeSubscriptions = useRef(new Map<string, StompSubscription>());
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const installSubscription = useCallback((destination: string, client: Client) => {
    activeSubscriptions.current.get(destination)?.unsubscribe();
    const subscription = client.subscribe(destination, message => {
      subscriptions.current.get(destination)?.forEach(callback => callback(message));
    });
    activeSubscriptions.current.set(destination, subscription);
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch(`${API}/api/notifications`, { headers: authHeaders(session.accessToken) }),
      fetch(`${API}/api/notifications/unread/count`, { headers: authHeaders(session.accessToken) }),
    ]).then(async ([historyResponse, countResponse]) => {
      if (!historyResponse.ok || !countResponse.ok) return;
      const history = await historyResponse.json() as NotificationItem[];
      if (!cancelled) setNotifications(history);
    }).catch(() => undefined);

    const accessToken = session.accessToken.trim();
    const client = new Client({
      brokerURL: websocketUrl(),
      connectHeaders: { Authorization: `Bearer ${accessToken}` },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
    });
    client.onConnect = () => {
      setConnected(true);
      setConnectionError('');
      installSubscription('/user/queue/notifications', client);
      subscriptions.current.forEach((_callbacks, destination) => installSubscription(destination, client));
    };
    client.onWebSocketClose = event => {
      setConnected(false);
      if (!cancelled) setConnectionError(`Realtime connection closed${event.code ? ` (${event.code})` : ''}.`);
    };
    client.onWebSocketError = event => {
      setConnected(false);
      setConnectionError('Unable to reach the realtime server.');
    };
    client.onStompError = frame => {
      setConnected(false);
      setConnectionError(frame.headers.message || 'Realtime authentication failed.');
    };
    clientRef.current = client;

    const notificationHandler = (message: IMessage) => {
      try {
        const incoming = JSON.parse(message.body) as NotificationItem;
        setNotifications(current => [incoming, ...current.filter(item => item.id !== incoming.id)]);
      } catch { /* Ignore malformed notification payloads from stale clients. */ }
    };
    subscriptions.current.set('/user/queue/notifications', new Set([notificationHandler]));
    const activationTimer = window.setTimeout(() => {
      if (!cancelled) client.activate();
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(activationTimer);
      activeSubscriptions.current.clear();
      subscriptions.current.clear();
      clientRef.current = null;
      void client.deactivate();
    };
  }, [installSubscription, session.accessToken]);

  const subscribe = useCallback((destination: string, callback: (message: IMessage) => void) => {
    const callbacks = subscriptions.current.get(destination) ?? new Set();
    callbacks.add(callback);
    subscriptions.current.set(destination, callbacks);
    const client = clientRef.current;
    if (client?.connected && !activeSubscriptions.current.has(destination)) installSubscription(destination, client);
    return () => {
      const current = subscriptions.current.get(destination);
      current?.delete(callback);
      if (!current?.size) {
        subscriptions.current.delete(destination);
        activeSubscriptions.current.get(destination)?.unsubscribe();
        activeSubscriptions.current.delete(destination);
      }
    };
  }, [installSubscription]);

  const publish = useCallback((destination: string, body: unknown) => {
    const client = clientRef.current;
    if (!client?.connected) throw new Error('Realtime connection is not ready');
    client.publish({ destination, body: JSON.stringify(body) });
  }, []);

  const markRead = useCallback(async (id: number) => {
    const response = await fetch(`${API}/api/notifications/${id}/read`, { method: 'PATCH', headers: authHeaders(session.accessToken) });
    if (!response.ok) throw new Error('Unable to mark notification as read');
    setNotifications(current => current.map(item => item.id === id ? { ...item, read: true } : item));
  }, [session.accessToken]);

  const markAllRead = useCallback(async () => {
    const response = await fetch(`${API}/api/notifications/read-all`, { method: 'PATCH', headers: authHeaders(session.accessToken) });
    if (!response.ok) throw new Error('Unable to mark notifications as read');
    setNotifications(current => current.map(item => ({ ...item, read: true })));
  }, [session.accessToken]);

  const value = useMemo(() => ({ connected, connectionError, notifications, unreadCount: notifications.filter(item => !item.read).length, markRead, markAllRead, publish, subscribe }), [connected, connectionError, notifications, markRead, markAllRead, publish, subscribe]);
  return <RealtimeContext.Provider value={value}>{children}<NotificationBell /></RealtimeContext.Provider>;
}

export function useRealtime() {
  const value = useContext(RealtimeContext);
  if (!value) throw new Error('useRealtime must be used inside RealtimeProvider');
  return value;
}

function NotificationBell() {
  const { connected, notifications, unreadCount, markRead, markAllRead } = useRealtime();
  const [open, setOpen] = useState(false);
  const openNotification = async (item: NotificationItem) => {
    if (!item.read) await markRead(item.id).catch(() => undefined);
    if (item.actionUrl) {
      window.dispatchEvent(new CustomEvent('app:navigate', { detail: item.actionUrl }));
      setOpen(false);
    }
  };
  return <div className="notification-center">
    <button className="notification-bell" title="Notifications" aria-label="Notifications" onClick={() => setOpen(value => !value)}>
      <span aria-hidden="true">&#128276;</span>{unreadCount > 0 && <b>{unreadCount > 99 ? '99+' : unreadCount}</b>}
    </button>
    {open && <section className="notification-panel">
      <header><div><strong>Notifications</strong><small>{connected ? 'Live' : 'Reconnecting'}</small></div>{unreadCount > 0 && <button onClick={() => void markAllRead()}>Mark all read</button>}</header>
      <div className="notification-list">{notifications.map(item => <button key={item.id} className={item.read ? '' : 'unread'} onClick={() => void openNotification(item)}><strong>{item.title}</strong><span>{item.message}</span><small>{new Date(item.createdAt).toLocaleString()}</small>{item.actionUrl && <em>View details</em>}</button>)}{!notifications.length && <p>No notifications yet.</p>}</div>
    </section>}
  </div>;
}
