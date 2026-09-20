// Biddel BISS il-link ta' hawn taħt meta jkun hemm Facebook Live ġdid.
const FACEBOOK_LIVE_URL = "https://www.facebook.com/100082258298684/videos/2120374695521474";

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".facebook-live-link").forEach(link => {
    link.href = FACEBOOK_LIVE_URL;
  });

  const player = document.getElementById("facebook-live-player");
  if (player) {
    player.src = "https://www.facebook.com/plugins/video.php?href=" +
      encodeURIComponent(FACEBOOK_LIVE_URL) +
      "&show_text=false&width=734";
  }
});
