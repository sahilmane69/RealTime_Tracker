const socket = io();
const map = L.map('map').setView([0, 0], 8);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: 'Sahil Mane'
}).addTo(map);

const markers = {};
let userName = '';
let userEmoji = '🙂';
let ownMarkerInitialized = false;

function submitUser() {
  const nameVal = document.getElementById('nameInput').value.trim();
  const emojiVal = document.getElementById('emojiInput').value.trim();

  if (!nameVal) {
    alert("Name is required!");
    return;
  }

  userName = nameVal;
  userEmoji = emojiVal || '🙂';

  socket.emit('register-user', { name: userName, emoji: userEmoji });
  document.getElementById('userForm').style.display = 'none';

  startTracking();
}

function getOffsetPosition(baseLat, baseLng, id, isSelf) {
  if (isSelf) return [baseLat, baseLng];

  const hash = Array.from(id).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const angle = (hash % 360) * (Math.PI / 180);
  const offset = 0.0003;
  const offsetLat = baseLat + offset * Math.cos(angle);
  const offsetLng = baseLng + offset * Math.sin(angle);
  return [offsetLat, offsetLng];
}

function startTracking() {
  if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;

        // Center and zoom on your location (first time only)
        if (!ownMarkerInitialized) {
          map.setView([latitude, longitude], 15);
          ownMarkerInitialized = true;
        }

        socket.emit("send-location", { latitude, longitude });
      },
      (err) => console.error(err),
      {
        enableHighAccuracy: true,
        timeout: 7000,
        maximumAge: 0
      }
    );
  }
}

socket.on("receive-location", (data) => {
  const { id, name, emoji, latitude, longitude } = data;
  const isSelf = (socket.id === id);
  const [lat, lng] = getOffsetPosition(latitude, longitude, id, isSelf);

  if (markers[id]) {
    markers[id].setLatLng([lat, lng]);
  } else {
    const icon = L.divIcon({
      html: `<div class='emoji-avatar'>${emoji}</div><div style="text-align:center;font-size:10px">${name}</div>`,
      iconSize: [40, 50],
      className: ''
    });

    markers[id] = L.marker([lat, lng], { icon }).addTo(map);
  }
});

socket.on("user-disconnected", (id) => {
  if (markers[id]) {
    map.removeLayer(markers[id]);
    delete markers[id];
  }
});
