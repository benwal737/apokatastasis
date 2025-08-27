import {
  Room,
  RoomEvent,
  RemoteParticipant,
  RemoteTrack,
  RemoteTrackPublication,
  Track,
  VideoPresets,
  createLocalTracks,
  LocalTrack,
  LocalVideoTrack,
} from "livekit-client";

export async function connectViewer(opts: {
  wsUrl: string;
  token: string;
  container?: HTMLElement;
  onTrackSubscribed?: (
    track: MediaStreamTrack,
    publication: RemoteTrackPublication,
    participant: RemoteParticipant
  ) => void;
  onTrackUnsubscribed?: (
    track: MediaStreamTrack,
    publication: RemoteTrackPublication,
    participant: RemoteParticipant
  ) => void;
}) {
  const room = new Room({
    adaptiveStream: true,
    dynacast: true,
    videoCaptureDefaults: {
      resolution: VideoPresets.h1080.resolution,
    },
  });

  // Handle track subscriptions
  room
    .on(
      RoomEvent.TrackSubscribed,
      (
        track: RemoteTrack,
        publication: RemoteTrackPublication,
        participant: RemoteParticipant
      ) => {
        if (opts.onTrackSubscribed) {
          opts.onTrackSubscribed(
            track.mediaStreamTrack,
            publication,
            participant
          );
        }
      }
    )
    .on(
      RoomEvent.TrackUnsubscribed,
      (
        track: RemoteTrack,
        publication: RemoteTrackPublication,
        participant: RemoteParticipant
      ) => {
        if (opts.onTrackUnsubscribed) {
          opts.onTrackUnsubscribed(
            track.mediaStreamTrack,
            publication,
            participant
          );
        }
      }
    );

  try {
    // Connect to the room
    await room.connect(opts.wsUrl, opts.token, {
      autoSubscribe: true,
    });

    // Return cleanup function
    return {
      disconnect: () => {
        room.disconnect();
      },
      room,
    };
  } catch (error) {
    console.error("Failed to connect to room:", error);
    throw error;
  }
}
