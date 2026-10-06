/* 楊承勳生日紀念網站 — 畫面與聲音設定 */
window.MEMORIAL_CONFIG = {
  /* ── 1. 文字 ──────────────────────────────────────────────── */
  displayName: "楊承勳",
  title: "楊承勳生日",
  eyebrow: "2008 · 9 · 12",
  subtitle: "今晚，為楊承勳點一盞生日的光",
  storyCap: "楊承勳",           // 介紹那一幕左上角的小標
  intro: [
    "他是爸媽最棒的兒子、姊姊身旁溫暖體貼的弟弟。",
    "他有主見、認真負責，說到做到、盡心盡責。",
    "希望大家都記得",
    "這樣美好的他",
    "今晚，願每一盞燭光，都替我們說一句：生日快樂。"
  ],

  /* ── 2. 素材（放進 public/assets/） ───────────────────────── */
  photo: "assets/photo.jpg",                 // "assets/photo.jpg"；null 用內建象徵圖
  music: "assets/music.mp3",
  // 依檔案編號安排三段祝福；內容與最終順序仍需實聽確認。
  voices: [
    {src:"assets/voices/voice-01.mp3",at:0,vol:.55},
    {src:"assets/voices/voice-03.mp3",at:2.5,vol:.76},
    {src:"assets/voices/voice-04.mp3",at:4,vol:.8},
    {src:"assets/voices/voice-02.mp3",at:6,vol:.9,fadeIn:4,fadeOutAtDawn:6}
  ],
  voicesDuck: .2,

  /* ── 3. 蠟燭數 ─────────────────────────────────────────────── */
  candles: 18,

  footerNote: "本站為親友自發的紀念。此靜態版本的留言只保存在目前瀏覽器中。"
};
