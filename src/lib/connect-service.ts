"use client";

import {
  Room,
  RoomEvent,
  RemoteParticipant,
  RemoteTrack,
  RemoteTrackPublication,
  TrackPublication,
  VideoTrack,
  AudioTrack,
  Track,
} from "livekit-client";

export async function connectViewer(opts: {
  wsUrl: string; // e.g. process.env.NEXT_PUBLIC_LIVEKIT_WS_URL!
  token: string; // server-generated JWT
  container: HTMLElement; // where to append <video>/<audio>
}) {
  const room = new Room();

  const attach = (track: RemoteTrack, pub: RemoteTrackPublication) => {
    const trackSid = pub.trackSid;
    let el: HTMLMediaElement | null = null;

    if (track.kind === Track.Kind.Video) {
      el = document.createElement("video");
      el.autoplay = true;
      el.autoplay = true;
      (track as VideoTrack).attach(el as HTMLVideoElement);
    } else if (track.kind === Track.Kind.Audio) {
      el = document.createElement("audio");
      el.autoplay = true;
      (track as AudioTrack).attach(el as HTMLAudioElement);
    }

    if (el) {
      el.dataset.lkTrackSid = trackSid;
      opts.container.appendChild(el);
    }
  };

  const detach = (track: RemoteTrack, pub: RemoteTrackPublication) => {
    const trackSid = pub.trackSid;
    // Detach via SDK (removes from all attached elements)
    track.detach();
    // Also remove our specific element if present
    const node = opts.container.querySelector(
      `[data-lk-track-sid="${trackSid}"]`
    ) as HTMLMediaElement | null;
    if (node) node.remove();
  };

  // Room event listeners
  room.on(RoomEvent.TrackSubscribed, (track, pub, _participant) => {
    attach(track as RemoteTrack, pub as RemoteTrackPublication);
  });

  room.on(RoomEvent.TrackUnsubscribed, (track, pub, _participant) => {
    detach(track as RemoteTrack, pub as RemoteTrackPublication);
  });

  // Connect
  await room.connect(opts.wsUrl, opts.token);

  // Attach already-subscribed tracks from existing remote participants
  // remoteParticipants is a Map<identity, RemoteParticipant>
  Array.from(room.remoteParticipants.values()).forEach(
    (p: RemoteParticipant) => {
      // trackPublications is a Map<sid, TrackPublication>
      Array.from(p.trackPublications.values()).forEach(
        (pub: TrackPublication) => {
          if (pub.isSubscribed && pub.track) {
            attach(pub.track as RemoteTrack, pub as RemoteTrackPublication);
          }
        }
      );
    }
  );

  return {
    room,
    disconnect: () => {
      try {
        // Clean up rendered elements
        Array.from(room.remoteParticipants.values()).forEach((p) => {
          Array.from(p.trackPublications.values()).forEach((pub) => {
            if (pub.track) {
              (pub.track as RemoteTrack).detach();
              const el = opts.container.querySelector(
                `[data-lk-track-sid="${pub.trackSid}"]`
              ) as HTMLMediaElement | null;
              if (el) el.remove();
            }
          });
        });
      } catch {
        // no-op
      }
      room.disconnect();
    },
  };
}
