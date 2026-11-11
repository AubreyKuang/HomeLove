# HomeLove · 像素小屋 · ピクセル小屋

A tiny pixel-art life sim with dress-up and romance. Everything is drawn by code: there are no image or sound files.

[中文](#中文) · [English](#english) · [日本語](#日本語)

## How to run

Open `index.html` in a browser. To serve it locally instead:

```bash
python3 -m http.server 8000
```

Then visit http://localhost:8000. Progress and the chosen language are saved in the browser's local storage.

## Project layout

| Path | What it is |
|---|---|
| `index.html` | The whole game: drawing, map, characters, systems |
| `lang/zh.js` | Simplified Chinese text (source language) |
| `lang/en.js` | English text |
| `lang/ja.js` | Japanese text |
| `tools/check-lang.js` | Checks a language pack against `zh.js` |

## Adding or editing a language

All player-facing text lives in `lang/<code>.js`. To add a language, copy `lang/zh.js`, translate the values (never the keys), keep every `{placeholder}` and keep arrays the same length. Then add a `<script>` tag for it in `index.html`, add the code to `LANG_ORDER`, and run:

```bash
node tools/check-lang.js <code>
```

---

## 中文

在像素小屋里过日子：吃饭、睡觉、种草莓、钓鱼、换装。一天里会有五位居民轮流来院子：

| 时间 | 角色 |
|---|---|
| 07:00–11:30 | 顾言 · 咖啡店店长 |
| 09:00–15:00 | 林小满 · 花店店员 |
| 11:00–17:00 | 陆星野 · 体育系大学生 |
| 15:00–21:00 | 江屿 · 街头吉他手 |
| 20:00–01:00 | 白夜 · 画星空的人 |

每个人喜欢的穿搭、礼物、聊天方式、活动和约会地点都不一样。试过一次，日记里的「攻略笔记」就会记下来。好感到了可以约会、告白，最后邀请对方搬来一起住。

**操作**：方向键或 WASD 走路，E / 空格 互动，1 2 3 选择选项，C 打开衣柜，J 打开日记，L 切换语言。手机上用屏幕上的方向键和 A 键。

## English

Live in a tiny pixel cottage: eat, sleep, grow strawberries, fish and dress up. Five neighbors drop by the yard at different times of day: Gu Yan (café owner, mornings), Lin Xiaoman (florist, late morning), Lu Xingye (athlete, midday), Jiang Yu (street guitarist, evening) and Bai Ye (star painter, late night).

Each of them likes different outfits, gifts, kinds of talk, activities and date spots. Whatever you try gets written into the Notes in your diary. Raise their affection to go on dates, confess, and eventually invite one of them to move in.

**Controls**: arrow keys or WASD to walk, E / Space to interact, 1 2 3 to pick options, C for the wardrobe, J for the diary, L to switch language. On phones, use the on-screen pad and A button.

## 日本語

小さなピクセルの小屋で暮らそう。ごはん、睡眠、イチゴ栽培、釣り、着せ替え。一日の中で、5人の住人が時間ごとに庭へやって来ます：顧言（カフェ店長・朝）、林小満（花屋・午前）、陸星野（体育会系大学生・昼）、江嶼（ストリートギタリスト・夕方）、白夜（星空を描く人・深夜）。

好きな服、プレゼント、会話、遊び、デートの場所は人それぞれ。一度試したことは日記の「攻略メモ」に記録されます。好感度が上がればデートや告白、最後には一緒に暮らすことも。

**操作**：矢印キーまたは WASD で移動、E / スペースで調べる、1 2 3 で選択、C でクローゼット、J で日記、L で言語切り替え。スマホでは画面の十字キーと A ボタンを使います。
