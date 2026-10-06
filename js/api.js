/* GitHub Pages 靜態版：祝福只保存在訪客自己的瀏覽器中。 */
(function (global) {
  'use strict';

  var KEY = 'memorial:github-pages:v1';
  var SEED = [
    ['小雨', '生日快樂。願你自由自在地長大。'],
    ['一位老師', '十八歲了。老師記得你。'],
    ['阿翔', '今晚這盞光，替我抱抱你。'],
    ['同學們', '我們都還記得你的笑聲。'],
    ['台中的媽媽', '謝謝你讓更多孩子被看見。'],
    ['匿名', '生日快樂，小天使。'],
    ['小花', '願你那裡有好多蛋糕。'],
    ['一位社工', '我們會繼續努力。'],
    ['阿嬤', '乖孫，生日快樂。'],
    ['路過的人', '不認識你，但想為你點一盞光。']
  ];

  function clean(value, max, fallback) {
    var text = String(value || '').trim();
    return Array.from(text).slice(0, max).join('') || fallback;
  }

  function read() {
    try {
      var saved = JSON.parse(global.localStorage.getItem(KEY) || 'null');
      if (saved && Array.isArray(saved.wishes)) return saved;
    } catch (_) {}
    var now = Date.now();
    return {
      wishes: SEED.map(function (item, index) {
        return {
          id: 'seed-' + index,
          name: item[0],
          message: item[1],
          created_at: new Date(now - (SEED.length - index) * 600000).toISOString()
        };
      })
    };
  }

  function write(state) {
    try { global.localStorage.setItem(KEY, JSON.stringify(state)); } catch (_) {}
  }

  function makeId() {
    if (global.crypto && global.crypto.randomUUID) return global.crypto.randomUUID();
    return 'local-' + Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  var state = read();

  global.MemorialAPI = {
    init: async function () { return { mode: 'static' }; },
    listWishes: async function (limit) {
      var count = Math.max(1, Math.min(Number(limit) || 300, 400));
      return state.wishes.slice(-count).reverse();
    },
    sendWish: async function (wish) {
      var saved = {
        id: makeId(),
        name: clean(wish && wish.name, 20, '一位朋友'),
        message: clean(wish && wish.message, 60, '生日快樂。'),
        created_at: new Date().toISOString()
      };
      state.wishes.push(saved);
      write(state);
      return { ok: true, wish: saved, verified: true };
    },
    deleteWish: async function (id) {
      state.wishes = state.wishes.filter(function (wish) { return String(wish.id) !== String(id); });
      write(state);
      return { ok: true };
    },
    getSettings: async function () { return {}; }
  };
})(window);
