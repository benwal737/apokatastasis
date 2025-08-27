let pc: RTCPeerConnection | null = null;
let localStream: MediaStream | null = null;

export async function startWhip(povId: string) {
  localStream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true,
  });
  pc = new RTCPeerConnection();
  for (const track of localStream.getTracks()) {
    pc.addTrack(track, localStream);
  }
  pc.onconnectionstatechange = () => {
    console.log("PC state:", pc?.connectionState);
  };

  const offer = await pc.createOffer({
    offerToReceiveAudio: false,
    offerToReceiveVideo: false,
  });
  await pc.setLocalDescription(offer);

  await waitForIceComplete(pc);

  const sdp = pc.localDescription?.sdp;
  if (!sdp) throw new Error("No local SDP");

  const res = await fetch(`/api/whip/${povId}`, {
    method: "POST",
    headers: { "Content-Type": "application/sdp" },
    body: sdp,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`WHIP publish failed: ${text}`);
  }

  const answerSdp = await res.text();

  await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

  return { pc, localStream };
}

export async function stopWhip(povId: string) {
  try {
    await fetch(`/api/whip/${povId}`, { method: "DELETE" });
  } catch (e) {
    console.warn("WHIP resource delete warning:", e);
  }

  if (pc) {
    try {
      pc.getSenders().forEach((s) => s.track?.stop());
    } catch {}
    try {
      pc.close();
    } catch {}
    pc = null;
  }

  if (localStream) {
    localStream.getTracks().forEach((t) => t.stop());
    localStream = null;
  }
}

function waitForIceComplete(pc: RTCPeerConnection): Promise<void> {
  if (pc.iceGatheringState === "complete") return Promise.resolve();

  return new Promise((resolve) => {
    const check = () => {
      if (pc.iceGatheringState === "complete") {
        pc.removeEventListener("icegatheringstatechange", check);
        resolve();
      }
    };
    pc.addEventListener("icegatheringstatechange", check);
  });
}
