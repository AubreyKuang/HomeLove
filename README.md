# 像素小屋 · Pixel Cottage · ピクセル小屋

一个像素风的「过日子 + 换装 + 恋爱」小游戏。整个游戏只有一个网页和三个语言文件，所有画面都由代码现场绘制，没有图片、模型或音频文件。

A cozy pixel-art life sim with dress-up and romance, playable in 中文 / English / 日本語. Every sprite is drawn by code; there are no image or audio files.

**▶ 在线试玩 · Play online · オンラインで遊ぶ：<https://aubreykuang.github.io/HomeLove/>**

🛠 测试模式（金手指、数值拉满）· Test mode · テストモード：<https://aubreykuang.github.io/HomeLove/dev.html>

[中文](#中文) · [English](#english) · [日本語](#日本語) · [项目结构 / Project layout](#项目结构--project-layout)

![小屋和院子：玩家和花店店员林小满在池塘边，咖啡师顾言在一旁散步](docs/screenshots/yard.png)

## 截图 · Screenshots

| | |
|---|---|
| ![和江屿在池塘边约会，三个对话选项](docs/screenshots/romance.png) | ![夜晚，白夜站在池塘边，萤火虫和台灯亮着](docs/screenshots/night.png) |
| 约会和对话选项（English）<br>Dates and dialogue choices | 深夜和恋人白夜看星星（日本語）<br>Late night with Bai Ye |
| ![衣柜界面：上衣分类、颜色和带爱心标记的衣服](docs/screenshots/wardrobe.png) | ![日记界面：五位居民的好感、喜好和攻略笔记](docs/screenshots/diary.png) |
| 衣柜，♥ 表示有人喜欢（中文）<br>The wardrobe; ♥ marks what someone likes | 日记里的关系和攻略笔记（English）<br>The diary: affection and notes |
| ![用了金手指之后，四位男生围到玩家身边，头顶冒出爱心](docs/screenshots/summon.png) | ![宠物领养站的菜单：小猫、小狗、小鸟、小兔](docs/screenshots/adopt.png) |
| 金手指：所有男生好感全满，全都跑来找你（中文）<br>The Golden Charm brings every guy running | 在领养站领养宠物（日本語）<br>Adopting a pet at the hut |
| ![修罗场：恋人陆星野撞见你和江屿说话，吃醋地说「那家伙是谁？」](docs/screenshots/jealous.png) | ![扩建后的小屋：卧室、厨房和健身角，陆星野在灶台做早饭](docs/screenshots/home.png) |
| 修罗场：恋人吃醋了（中文）<br>Jealousy: caught by your partner | 同居生活：恋人在厨房做早饭（English）<br>Living together: breakfast in the new kitchen |

![开始界面，可以选择中文、English、日本語](docs/screenshots/start.png)

---

## 中文

### 游戏简介

你住在一间小屋里，屋外有池塘、菜园和花园。每天要吃饭、睡觉、换衣服，一天里会有五位居民轮流来院子里串门。和他们聊天、送礼物、一起做事、约会，好感够了就能告白，最后还能邀请对方搬进小屋一起住。

### 主要玩法

- **过日子**：时间会流逝（现实 1 秒 = 游戏 2 分钟），有白天、傍晚和夜晚。三条状态要照顾：⚡精力（去小床睡觉）、🍙饱腹（去小圆桌吃饭）、💗心情。熬到凌晨 2 点或精力耗光会直接睡着。
- **换装**：7 类衣物（肤色、发型、上衣、下装、鞋子、头饰、配饰），大部分有 12 种颜色，可以转身查看四个方向，可以随机搭配，最多收藏 6 套。在院子里采 3 朵花能解锁花环。
- **礼裙扭蛋机**：走到门口信箱右边按 E。首抽免费，之后每抽可用 2 个贝壳或 3 朵花。蔷薇千层、星夜拖尾、铃兰珍珠和孔雀金纹四款礼裙各有不同的像素裙摆与细节。每次抽到新款，打开后可以直接试穿，衣柜里也能改色和存搭配。
- **收集和制作**：在花园采花，在小圆桌用草莓烤饼干，在书桌写情书。菜园和池塘的收成也可以在灶台做饭，或者作为礼物送给居民。
- **种田**：到院子右侧菜地按 E 播种或照料。胡萝卜、草莓和南瓜分别需要 1、2、3 个浇过水的夜晚。草莓收过后，再浇水过一晚还能结果。一天没浇水，作物会等着你。种得多时可以一次浇完所有缺水的菜地。
- **钓鱼**：面朝池塘按 E 选钓法。西侧芦苇边常见小鱼，东侧开阔水面更容易钓到金鳞鲤或月光鱼。白天找金鳞鲤，天黑再来找月光鱼。草莓鱼饵能缩短等待、延长收竿时间，也更容易钓到这两种鱼。看到「！」后趁进度条走完前收竿，鱼的首次钓获日期和最长尺寸会记进日记。
- **月下同钓**：第一次送白夜月光鱼后，过两天晚上 19:00–23:30 到院子里。他会走过来邀请你去池塘。可以改天再去，鱼跑了也可以再抛一竿。一起钓到的第一条鱼会留下像素纪念卡，写着时间、鱼名和尺寸，白夜后来还可能在聊天时提起它。
- **恋爱和攻略**：
  - 每天可以和每个人聊天（有问答）、互动（夸奖、开玩笑、撩一下、牵手、拥抱、亲亲）、送礼物、一起做事（散步、钓鱼、看书、运动、看星星），以及约会（池塘、花园、星空野餐、在家做饭）。
  - 每个人吃的那一套都不一样：喜欢的颜色、衣服、礼物、话题、活动和约会地点各不相同。穿上对方喜欢的风格再去聊天，好感涨得更多。
  - 试过的东西会记进日记的「攻略笔记」，用 😍😊🙂😐😣 表示对方的反应。
  - 好感进度：2♥ 解锁一起做事，4♥ 撩一下，6♥ 约会，7♥ 牵手，8♥ 告白（心情要在 40 以上），恋人 9♥ 亲亲，10♥ 邀请同居。
  - 有了恋人还去撩别人、约别人，被恋人看到会吃醋扣好感（见下面的「修罗场」）。
- **生活回忆**：居民会记住共同经历，日记可以收藏像素纪念卡。见[玩法、测试与截图](#生活回忆玩法测试与截图)。
- **宠物**：小路边的领养站可以领养小猫、小狗、小鸟、小兔（每种 3 种毛色，最多养 3 只），从候选名字里给它取名。宠物会跟着你走，也可以让它在原地等你。每天可以摸摸、喂它爱吃的东西、陪它玩；亲密度高了，早上会叼礼物回来。每位居民也有偏爱的小动物，带着对的宠物去聊天会额外加好感。
- **同居生活**：小屋扩建了，右边多了厨房（冰箱、灶台、台面）和健身角，卧室换成了双人床。好感满 10♥ 邀请恋人搬进来后，TA 会按时间表过日子：早上 7 点和傍晚 5 点半做饭（做好的饭放在小圆桌上，去吃就能回饱腹和心情），上午扫地，下午在健身角锻炼。TA 干活时可以过去帮忙，平时可以依偎在一起；晚上 9 点以后可以「今晚一起睡」，画面淡出，第二天早上会有专属的晨间对白。你自己也可以用灶台做菜、在健身角运动，恋人在家会一起帮忙。
- **金手指**：院子角落藏着一个闪闪发光的道具。用了以后，顾言、陆星野、江屿、白夜的好感度直接满格，当天还会全都跑来找你、跟着你转。捡到后可以马上用，也可以收进背包，之后在日记里点「使用」。
- **音乐和音效**：轻柔的八音盒背景音乐，晚上会变得更慢、更安静；走路、对话、采集、钓鱼、宠物叫声、好感上升都有音效。全部由浏览器现场合成，没有音频文件。按 M 或右上角 🔊 可以静音。

### 同居后的一天

邀请恋人搬进来以后，TA 会自己按时间表过日子，不用你操作。新厨房和健身角在客厅右边，穿过右墙的门洞就到了。

| 时间 | 恋人在做什么 | 你可以 |
|---|---|---|
| 07:00–08:30 | 在灶台前做早饭 | 帮忙一起做；8:30 做好后去小圆桌吃（饱腹 +50） |
| 09:30–11:00 | 拿着扫帚打扫屋子 | 帮忙打扫；扫完你心情 +5 |
| 14:00–15:30 | 在健身角举哑铃 | 一起练 |
| 17:30–19:00 | 做晚饭 | 19:00 后去小圆桌吃 |
| 其他时间 | 在家里和院子里走走，你走近时会转过来看你 | 聊天、依偎在一起 |
| 21:00 以后 | 在家陪你 | 「今晚一起睡」 |

每件家务都有 TA 专属的台词，干活时去跟 TA 说话就能听到。

### 修罗场

有了恋人之后，如果当着恋人的面撩别人、牵别人的手、约别人出去，被看到就会吃醋，好感 -6。每个人吃醋的样子都不一样：

| 恋人 | 吃醋时说 |
|---|---|
| 顾言 | ……刚才那位，你们很熟吗？我只是好奇。 |
| 林小满 | ……刚才那个人是谁呀？我、我才没有在意呢。 |
| 陆星野 | ……那家伙是谁？我、我也可以对你更好的！ |
| 江屿 | ……刚才那人谁啊？我没生气，就是问问。 |
| 白夜 | ……你和那个人，聊得挺开心啊。 |

![修罗场：恋人陆星野撞见你和江屿说话](docs/screenshots/jealous.png)

用了金手指之后，四位男生会同时围在你身边，修罗场就更热闹了。

### 五位居民

| 时间 | 角色 | 一句话 |
|---|---|---|
| 07:00–11:30 | 顾言 · 咖啡店店长 | 戴眼镜的温柔书生，吃撩不吃玩笑，最爱情书 |
| 09:00–15:00 | 林小满 · 花店店员 | 害羞又甜，最爱花，喜欢在花园约会 |
| 11:00–17:00 | 陆星野 · 体育系大学生 | 阳光直球，笑点超低，最爱鱼 |
| 15:00–21:00 | 江屿 · 街头吉他手 | 话少但温柔，最爱草莓，喜欢池塘 |
| 20:00–01:00 | 白夜 · 画星空的人 | 银发毒舌，夸他没用，最爱星星石 |

### 操作

| 按键 | 作用 |
|---|---|
| 方向键 / WASD | 走路 |
| E / 空格 | 互动、继续对话、钓鱼收竿 |
| 1 2 3 … | 选择对话选项 |
| C | 打开衣柜 |
| J | 打开日记 |
| L | 切换语言（也可以点右上角 🌐） |
| M | 打开或关闭音乐和音效（也可以点右上角 🔊） |

手机上会出现屏幕方向键和 A 键。

### 怎么玩

直接用浏览器打开 `index.html` 就能玩，不需要联网（联网时会加载像素字体）。也可以在本地起一个服务器：

```bash
python3 -m http.server 8000
```

然后打开 http://localhost:8000 。进度和语言选择都保存在浏览器里。

**测试模式**：打开 `dev.html`（[在线版](https://aubreykuang.github.io/HomeLove/dev.html)），左上角有测试面板：直接拿金手指或立刻使用、所有数值拉满、状态锁满、重置今天的次数、跳到指定时间、清空测试存档。测试模式的存档和正常游戏分开，互不影响。改完 `index.html` 后运行 `python3 dev/make-dev.py` 重新生成 `dev.html`。

---

## English

### About

You live in a small cottage with a pond, a strawberry patch and a flower garden. Eat, sleep and dress up while five neighbors take turns visiting your yard through the day. Chat, give gifts, do things together and go on dates; with enough affection you can confess, and eventually invite one of them to move in.

### Features

- **Daily life**: time flows (1 real second = 2 game minutes) from morning to late night. Keep an eye on ⚡ energy (sleep in bed), 🍙 fullness (eat at the table) and 💗 mood. Stay up past 2 a.m. or run out of energy and you'll pass out.
- **Dress-up**: 7 categories (skin, hair, tops, bottoms, shoes, headwear, extras), most in 12 colors. Turn the preview to see all four sides, roll a random outfit, and save up to 6 looks. Pick 3 flowers to unlock the flower wreath.
- **Garden and pond**: plant, water, and harvest strawberries, carrots, and pumpkins. Fish the reed bank or the open water by day or night, optionally using a strawberry as bait. Reel in when “!” appears. The diary keeps your first catch date and best size for each species. Give your harvest away or try it at the stove.
- **Dress capsules**: the machine beside the mailbox gives you a free first draw. Later draws cost two shells or three flowers. Collect four distinct gowns, try them on, and recolor them in the wardrobe.
- **Fishing by moonlight**: give Bai Ye a moonfish. Starting two days later, he can come find you in the yard between 19:00 and 23:30. Your first catch together earns a dated keepsake with the species and size.
- **Romance**:
  - Each day you can chat (with questions), interact (compliment, joke, flirt, hold hands, hug, kiss), give a gift, do an activity together (walk, fish, read, sport, stargaze) and go on a date (pond, garden, starlit picnic, cooking at home).
  - Everyone has their own taste in colors, clothes, gifts, topics, activities and date spots. Dress the way they like before you chat and affection grows faster.
  - Whatever you try is recorded in the diary's Notes as 😍😊🙂😐😣.
  - Milestones: 2♥ activities, 4♥ flirt, 6♥ dates, 7♥ hold hands, 8♥ confess (mood 40+), 9♥ kiss as a couple, 10♥ move in together.
  - Flirt with someone else while your partner is watching and they'll get jealous (see Jealousy below).
- **Pets**: adopt a kitten, puppy, bird or bunny at the hut by the path (3 coat colors each, up to 3 pets) and pick a name. Pets follow you around or wait where you leave them. Pet, feed and play with them every day; with a strong bond they bring you presents in the morning. Each neighbor has a favorite animal, and chatting with the right pet nearby earns bonus affection.
- **Living together**: the cottage now has a kitchen (fridge, stove, counter), a workout corner and a double bed. Once your partner moves in (10♥), they follow a daily routine: cooking at 7:00 and 17:30 (the meal waits on the round table for fullness and mood), sweeping in the morning and working out in the afternoon. Help them with chores, cuddle up, and after 21:00 choose to spend the night together; the screen fades out and they greet you with their own good-morning line. You can also cook at the stove and work out yourself, and your partner pitches in.
- **Golden Charm**: something shiny is hidden in a corner of the yard. Use it and Gu Yan, Lu Xingye, Jiang Yu and Bai Ye all jump to max affection and come find you for the rest of the day. Use it on the spot or keep it in your bag and use it later from the diary.
- **Music and sound**: a soft music-box soundtrack that slows down and quiets at night, plus sounds for footsteps, dialogue, gathering, fishing, pets and rising affection. All of it is synthesized live in the browser; there are no audio files. Press M or the 🔊 button to mute.

### A day living together

Once your partner moves in, they run their own day on a schedule; you don't have to do anything. The new kitchen and workout corner are to the right of the living room, through the doorway in the right wall.

| Time | What your partner does | What you can do |
|---|---|---|
| 07:00–08:30 | Cooks breakfast at the stove | Help; after 8:30 eat it at the round table (fullness +50) |
| 09:30–11:00 | Sweeps the house with a broom | Help; when they finish, your mood +5 |
| 14:00–15:30 | Lifts dumbbells in the workout corner | Work out together |
| 17:30–19:00 | Cooks dinner | Eat it at the round table after 19:00 |
| Other times | Wanders the house and yard, turns to face you when you come close | Chat, cuddle up |
| After 21:00 | Stays home with you | Spend the night together |

Every chore comes with that character's own lines; talk to them while they work to hear them.

### Jealousy

Once you have a partner, flirting with, holding hands with or dating someone else in front of them makes them jealous (affection -6). Everyone takes it differently:

| Partner | What they say |
|---|---|
| Gu Yan | …That person just now. Are you two close? Just curious. |
| Lin Xiaoman | …Who was that just now? N-not that I care or anything. |
| Lu Xingye | …Who was that? I-I can treat you way better! |
| Jiang Yu | …Who was that? I'm not mad. Just asking. |
| Bai Ye | …You and that person looked like you were having fun. |

### The neighbors

| Time | Who | In short |
|---|---|---|
| 07:00–11:30 | Gu Yan · café owner | Gentle bookworm in glasses; loves love letters, not jokes |
| 09:00–15:00 | Lin Xiaoman · florist | Shy and sweet; loves flowers and garden walks |
| 11:00–17:00 | Lu Xingye · athletics student | Sunny and direct; laughs at everything, loves fish |
| 15:00–21:00 | Jiang Yu · street guitarist | Few words, soft heart; loves strawberries and the pond |
| 20:00–01:00 | Bai Ye · star painter | Silver-haired and sharp-tongued; flattery fails, Star Stones win |

### Controls

Arrow keys or WASD to walk · E / Space to interact, continue and reel in · 1 2 3 to pick options · C wardrobe · J diary · L switch language (or the 🌐 button) · M music and sound on/off (or the 🔊 button). On phones, an on-screen pad and A button appear.

### Running it

Open `index.html` in a browser; it works offline (the pixel fonts load when online). Or serve the folder with `python3 -m http.server 8000` and visit http://localhost:8000. Progress and language are saved in the browser.

**Test mode**: open `dev.html` ([online](https://aubreykuang.github.io/HomeLove/dev.html)) for a panel in the top-left: get or use the Golden Charm right away, max out every stat, lock needs at full, reset today's limits, jump to a time of day, or wipe the test save. It keeps its own save, separate from the normal game. After editing `index.html`, run `python3 dev/make-dev.py` to rebuild `dev.html`.

---

## 日本語

### ゲーム紹介

池とイチゴ畑と花壇のある小さな小屋で暮らすゲームです。ごはんを食べて、眠って、着替えて。一日のうちに 5 人の住人が時間ごとに庭へやって来ます。おしゃべりやプレゼント、一緒に遊んだりデートしたりして仲良くなれば告白でき、最後は小屋で一緒に暮らすこともできます。

### 主な遊び方

- **暮らし**：時間が流れます（現実の 1 秒 = ゲーム内 2 分）。⚡体力（ベッドで眠る）、🍙満腹（テーブルで食事）、💗気分の 3 つに気を配りましょう。深夜 2 時を過ぎるか体力が尽きると、その場で寝てしまいます。
- **着せ替え**：7 カテゴリ（肌の色、髪型、トップス、ボトムス、くつ、帽子・髪飾り、小物）、ほとんどが 12 色。4 方向から確認でき、ランダムコーデや最大 6 着までのお気に入り保存も。花を 3 本摘むと花かんむりが解放されます。
- **畑と釣り**：イチゴ、ニンジン、カボチャを植え、水やりして収穫。昼夜で釣れる魚が変わり、イチゴをエサにもできる。「！」が出たら竿を上げよう。初めて釣れた日と最大サイズは日記に残る。収穫物や魚は料理や贈り物に使える。
- **ドレスガチャ**：郵便受けのそばにあるガチャは初回無料。次からは貝殻2個か花3本で回せる。4着のドレスが重複せずに手に入り、試着や色替えもできる。
- **月夜のふたり釣り**：白夜に月光魚を贈ると、2日後から19:00〜23:30に庭へ釣りに誘いに来ることがある。一緒に釣った最初の魚は、日付や魚の名前、大きさとともに記念カードに残る。
- **恋愛**：
  - 毎日、おしゃべり（質問つき）、ふれあい（褒める、冗談、ドキッとさせる、手をつなぐ、ハグ、キス）、プレゼント、一緒に過ごす（散歩、釣り、読書、運動、星空観察）、デート（池、花壇、星空ピクニック、おうち料理）ができます。
  - 好きな色、服、プレゼント、話題、遊び、デート先は人それぞれ。相手好みの服で話しかけると好感度が上がりやすくなります。
  - 試した反応は日記の「攻略メモ」に 😍😊🙂😐😣 で記録されます。
  - 目安：2♥ 一緒に過ごす、4♥ ドキッとさせる、6♥ デート、7♥ 手をつなぐ、8♥ 告白（気分 40 以上）、恋人で 9♥ キス、10♥ 同居。
  - 恋人の目の前で他の人を口説くと、やきもちを焼かれます（下の「修羅場」参照）。
- **ペット**：小道のそばの里親小屋で、子ネコ・子イヌ・小鳥・子ウサギを迎えられます（毛色は各 3 種類、3 匹まで）。名前は候補から選べます。ペットはあなたについて来るほか、その場で待たせることも。毎日なでて、好物をあげて、遊んであげましょう。なつき度が上がると朝にプレゼントを持ってきます。住人にはそれぞれ好きな動物がいて、その子を連れて話しかけると好感度にボーナスがつきます。
- **同居生活**：小屋が増築され、キッチン（冷蔵庫・コンロ・カウンター）とトレーニングコーナー、ダブルベッドができました。10♥ で恋人が引っ越してくると、毎日の時間割どおりに暮らします。朝 7 時と夕方 5 時半に料理（丸テーブルの手料理を食べると満腹と気分が回復）、午前は掃除、午後はトレーニング。家事を手伝ったり、寄り添ったり、21 時以降は「今夜は一緒に」を選ぶと画面が暗転し、翌朝その人だけのおはようの台詞が聞けます。自分でもコンロで料理、トレーニングコーナーで運動ができ、恋人が家にいれば一緒に手伝ってくれます。
- **ゴールデンチャーム**：庭の隅にキラキラ光るアイテムが隠れています。使うと顧言・陸星野・江嶼・白夜の好感度が一気に最大になり、その日はみんながあなたに会いに来て、ずっとそばにいてくれます。拾ってすぐ使っても、カバンにしまって後から日記で「使う」を押してもOK。
- **BGMと効果音**：やさしいオルゴールのBGM（夜はゆっくり静かに）と、足音・会話・採集・釣り・ペットの鳴き声・好感度アップなどの効果音。すべてブラウザでその場で合成していて、音声ファイルはありません。M キーか右上の 🔊 でミュートできます。

### 同居後の一日

恋人が引っ越してくると、時間割どおりに自分で暮らします。あなたは何もしなくて大丈夫。新しいキッチンとトレーニングコーナーはリビングの右側、右の壁の出入り口の先にあります。

| 時間 | 恋人がしていること | あなたができること |
|---|---|---|
| 07:00–08:30 | コンロで朝ごはんを作る | 手伝う。8:30 以降は丸テーブルで食べられる（満腹 +50） |
| 09:30–11:00 | ほうきで家を掃除 | 手伝う。終わると気分 +5 |
| 14:00–15:30 | トレーニングコーナーでダンベル | 一緒にトレーニング |
| 17:30–19:00 | 晩ごはんを作る | 19:00 以降に丸テーブルで食べる |
| それ以外 | 家や庭を歩き回り、近づくとこちらを向く | おしゃべり、寄り添う |
| 21:00 以降 | 家であなたのそばにいる | 「今夜は一緒に」 |

家事にはそれぞれキャラクター専用の台詞があります。作業中に話しかけてみてください。

### 修羅場

恋人ができたあと、恋人の目の前で他の人を口説いたり、手をつないだり、デートに誘ったりすると、やきもちを焼かれて好感度 -6。やきもちの焼き方は人それぞれ：

| 恋人 | やきもちの台詞 |
|---|---|
| 顧言 | ……さっきの人とは、仲がいいんですか？ ただ気になっただけですよ。 |
| 林小満 | ……さっきの人、誰？ べ、別に気にしてないもん。 |
| 陸星野 | ……あいつ誰だよ？ お、俺だって、お前にもっと優しくできるし！ |
| 江嶼 | ……さっきのやつ誰だ？ 怒ってない。聞いただけ。 |
| 白夜 | ……あいつとは、ずいぶん楽しそうに話してたな。 |

### 住人たち

| 時間 | 住人 | ひとこと |
|---|---|---|
| 07:00–11:30 | 顧言・カフェ店長 | 眼鏡の穏やかな読書家。冗談より口説き文句、ラブレターが一番 |
| 09:00–15:00 | 林小満・花屋の店員 | 恥ずかしがり屋で甘い。花と花壇デートが好き |
| 11:00–17:00 | 陸星野・体育会系大学生 | まっすぐで明るい。笑いのツボが浅く、魚が大好き |
| 15:00–21:00 | 江嶼・ストリートギタリスト | 口数は少ないけど優しい。イチゴと池が好き |
| 20:00–01:00 | 白夜・星空を描く人 | 銀髪で毒舌。お世辞は効かない、星の石が一番 |

### 操作

矢印キー / WASD で移動 · E / スペースで調べる・会話を進める・竿を上げる · 1 2 3 で選択 · C クローゼット · J 日記 · L 言語切り替え（右上の 🌐 でも可） · M BGMと効果音のオン／オフ（右上の 🔊 でも可）。スマホでは画面の十字キーと A ボタンを使います。

### 遊び方

`index.html` をブラウザで開くだけで遊べます（オフライン可。オンライン時はピクセルフォントを読み込みます）。`python3 -m http.server 8000` で起動して http://localhost:8000 を開いても OK。進行状況と言語はブラウザに保存されます。

**テストモード**：`dev.html`（[オンライン版](https://aubreykuang.github.io/HomeLove/dev.html)）を開くと左上にテストパネルが出ます。ゴールデンチャームをすぐ入手・使用、全ステータス最大、ステータス固定、今日の回数リセット、時刻ジャンプ、テスト用セーブの削除ができます。セーブは通常のゲームとは別です。`index.html` を変更したら `python3 dev/make-dev.py` で `dev.html` を作り直してください。

---

## 项目结构 / Project layout

| Path | 内容 / What it is |
|---|---|
| `index.html` | 游戏本体：绘图、地图、角色、各种系统 / The whole game: drawing, map, characters, systems |
| `cottage-activities.js` | 作物生长、钓获规则和鱼类记录 / Crop growth, fishing rules, and catch records |
| `lang/zh.js` | 简体中文文本（源语言）/ Simplified Chinese text (source) |
| `lang/en.js` | 英文文本 / English text |
| `lang/ja.js` | 日文文本 / Japanese text |
| `dev.html` | 测试模式（游戏本体 + 测试面板）/ Test mode (the game plus a test panel) |
| `dev/make-dev.py` | 由 `index.html` 生成 `dev.html` / Builds `dev.html` from `index.html` |
| `tools/check-lang.js` | 检查语言包和 `zh.js` 是否一致 / Checks a language pack against `zh.js` |
| `docs/screenshots/` | README 里的截图 / Screenshots used in this README |

### 修改或添加语言 / Editing or adding a language

所有玩家能看到的文字都在 `lang/<code>.js` 里。要加一种新语言：复制 `lang/zh.js`，只翻译值、不要改键名，保留所有 `{占位符}`，数组长度保持一致；然后在 `index.html` 里加一个 `<script>` 标签，把语言代码加进 `LANG_ORDER`，最后运行检查：

All player-facing text lives in `lang/<code>.js`. To add a language, copy `lang/zh.js`, translate the values (never the keys), keep every `{placeholder}` and keep arrays the same length. Add a `<script>` tag in `index.html`, add the code to `LANG_ORDER`, then run:

```bash
node tools/check-lang.js <code>
```

## NPC 记忆系统与测试

居民会记住玩家送礼、约会和表白的结果。记忆会调整后续聊天的好感收益。礼物和约会对象等信息保存在结构化字段中。

记忆由确定性 JavaScript 规则生成，无需 LLM 或 API 密钥。客观事件与角色主观记忆分开存储，记忆引用来源事件 ID，并记录情绪、确信程度和获知方式。连续事件序号用于拒绝重复处理和检测序号缺口。

每位 NPC 最多保留 32 条短期记忆、50 条长期记忆。重要程度由统一权重计算，同类重复经历可合并为长期印象。当前人生摘要选取最多 8 条长期记忆。记忆随现有 LocalStorage 存档保存，旧存档在产生新记忆时初始化相关数据。

### 运行回归测试

在项目根目录使用支持内置测试运行器的 Node.js（本次验证使用 Node.js 22）运行：

```sh
node --test tests/*.test.cjs
```

回归测试覆盖入口脚本语法、主观视角与信息隔离、事件去重与序号缺口、结构化记忆合并、短期容量和来源保留、确信程度、20 次 JSON 保存读回，以及该游戏的实际互动函数入口。测试调用实际代码，并模拟所需的渲染、计时器或其他外部依赖。

### 当前边界

- 这是基础记忆版本。Working Memory 继续使用既有角色运行状态，尚未实现完整的当前行动恢复。
- 长期记忆超过 50 条时按重要程度和时间截断，人生摘要也有上限，尚不能保证所有重要人生经历永久保留。
- 事件记录支持记忆来源追踪和去重，尚未实现世界状态的事件重放。
- 已实现 LocalStorage 主档与上一有效快照回退。IndexedDB、多快照历史、完整存档版本迁移和导入导出尚未实现。
- 回归测试验证了结构化记忆的 JSON 读写。浏览器刷新后恢复新版纪念卡的流程仍待验收。

## 生活回忆玩法、测试与截图

以下玩法以仓库代码为准。在线版由 GitHub Pages 的 `gh-pages` 分支部署。下载仓库后可打开 `index.html` 游玩，或打开带独立存档和测试面板的 `dev.html`。

| 玩法 | 在游戏里怎么触发 |
|---|---|
| 初次约会 | 完成约会后，NPC 会保存第一次约会的地点和日期。以后每天第一次聊天时，有 40% 概率提起这次约会。 |
| 礼物 | NPC 会记住礼物和自己的反应。聊天时有机会提到具体礼物，累计记忆也会影响聊天的好感收益。 |
| 生日 | 日记标出每个 28 天周期的生日。当天可以在对话里祝福。已经认识且达到 3♥ 的居民会记得你有没有来祝福。 |
| 病中探望 | 生病当天的对话菜单会出现「探望生病的居民」。已经认识且达到 3♥ 的居民会记得你有没有来探望。 |
| 吃醋 | 现有恋人在附近撞见玩家撩别人、牵手或约会时，会扣 6 点好感并记住。这个机制目前以当场目击为触发条件。 |
| 主动招呼 | 认识后的居民来访时段会在原时间前后浮动最多 45 个游戏分钟。居民在场且距离合适时，有机会主动走近打招呼。 |
| 像素纪念卡 | 初次约会、生日祝福和病中探望会在日记留下带角色头像的卡片。每次完成约会还有 5% 概率解锁「难忘约会」。 |
| 换装点评 | 居民有过一次穿搭记录后，下次见面会留意换装，按各自偏好点评。穿喜欢的搭配聊天还能提高好感收益。 |

### 本次测试

- 12 项 Node 回归通过，覆盖旧存档迁移、作物生长、鱼饵与钓获、礼裙扭蛋抽取、白夜邀约、纪念卡和 NPC 记忆。英语和日语语言包检查通过。
- 使用固定随机值调用主分支的游戏函数，验证后续约会保留第一次约会地点、聊天能提起该地点、稀有卡可触发、近处恋人才会目击，以及换装后有点评。
- 在 Chrome 在线测试版完成池塘约会，确认攻略笔记出现。主分支新版界面的浏览器测试尚未完成。

### 玩法截图

| 池塘约会 | 日记里的关系与攻略笔记 |
|---|---|
| ![池塘约会中与江屿的对话选项](docs/screenshots/romance.png) | ![日记里的居民好感、喜好和互动笔记](docs/screenshots/diary.png) |

| 衣柜里的穿搭偏好 | 恋人目击后吃醋 |
|---|---|
| ![衣柜里带爱心标记的衣物与颜色](docs/screenshots/wardrobe.png) | ![陆星野撞见玩家和江屿互动后吃醋](docs/screenshots/jealous.png) |

新版纪念卡和 NPC 回忆对白的截图待浏览器验收后补上。

本次在线版实测：完成顾言的池塘约会后，日记出现「池塘约会」攻略笔记。

![在线测试版的日记显示顾言的池塘约会攻略笔记](https://github.com/user-attachments/assets/f1397e92-d2ad-4212-b436-7d755aeee81f)
