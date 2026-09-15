const { RoomServiceClient } = require('livekit-server-sdk');
const apiKey = process.env.LIVEKIT_API_KEY;
const apiSecret = process.env.LIVEKIT_API_SECRET;
const wsUrl = process.env.LIVEKIT_URL;

async function check() {
  const svc = new RoomServiceClient(wsUrl, apiKey, apiSecret);
  const rooms = await svc.listRooms();
  console.log("Rooms:", rooms.map(r => r.name));
  for (const r of rooms) {
    const participants = await svc.listParticipants(r.name);
    console.log(`Participants in ${r.name}:`, participants.map(p => ({ name: p.name, identity: p.identity })));
  }
}
check().catch(console.error);
