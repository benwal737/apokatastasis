enum RoomPrivacy {
  PUBLIC,
  CODE_GATED,
}
enum Role {
  HOST,
  CONTRIBUTOR,
  VIEWER,
}
enum PovSource {
  WEBRTC,
  INGRESS_RTMP,
  INGRESS_WHIP,
}
enum PovStatus {
  OFFLINE,
  PENDING,
  LIVE,
}
enum ParticipantStatus {
  PENDING,
  APPROVED,
  BLOCKED,
}
enum IngressProvider {
  LIVEKIT,
}
