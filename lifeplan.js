'use strict';
/* =====================================================
   lifeplan.js — 株式会社Office-M 公式サイト
===================================================== */

/* ---------- 共通 ---------- */
const header = document.getElementById('site-header');
window.addEventListener('scroll', () => {
  header?.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobile-menu');
hamburger?.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  mobileMenu.classList.toggle('open');
});
mobileMenu?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  hamburger.classList.remove('open');
  mobileMenu.classList.remove('open');
}));

document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const href = a.getAttribute('href');
    if (!href || href.length < 2) return;
    const t = document.querySelector(href);
    if (!t) return;
    e.preventDefault();
    window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - 86, behavior: 'smooth' });
  });
});

function toast(msg) {
  const el = document.createElement('div');
  el.textContent = msg;
  Object.assign(el.style, {
    position: 'fixed', bottom: '96px', left: '50%',
    transform: 'translateX(-50%) translateY(8px)',
    background: '#16425f', color: '#fff', padding: '12px 24px',
    borderRadius: '100px', fontSize: '.875rem', zIndex: 9999,
    boxShadow: '0 8px 24px rgba(0,0,0,.25)', whiteSpace: 'nowrap',
    opacity: 0, transition: 'all .25s ease',
  });
  document.body.appendChild(el);
  requestAnimationFrame(() => { el.style.opacity = 1; el.style.transform = 'translateX(-50%)'; });
  setTimeout(() => { el.style.opacity = 0; setTimeout(() => el.remove(), 300); }, 2600);
}

function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function fmtDateTime(ts) {
  const d = new Date(ts); const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}/${p(d.getMonth() + 1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/* ---------- スクロールリビール ---------- */
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const els = Array.from(document.querySelectorAll(
    '.sec-head-c, .worry-card, .svc-card, .reason-card, .philosophy, .stats-band, ' +
    '.case-card, .ai-intro, .ai-chatbox, .quick-diag, .fund-timeline-section, ' +
    '.asim-card, .tax-calc-layout, .housing-tax-grid, .tax-cta, ' +
    '.voice-card, .flow-step, .team-card, .group-card, .company-box, ' +
    '.faq-item, .reserve-left, .reserve-form-wrap'
  )).filter(el => !el.closest('.hero'));
  if (reduce || !('IntersectionObserver' in window) || !els.length) return;
  els.forEach(el => el.classList.add('reveal'));
  const io = new IntersectionObserver(es => {
    es.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target;
      const sibs = el.parentElement ? Array.from(el.parentElement.children).filter(c => c.classList.contains('reveal')) : [el];
      el.style.transitionDelay = Math.min(Math.max(0, sibs.indexOf(el)) * 80, 320) + 'ms';
      el.classList.add('in');
      io.unobserve(el);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
  els.forEach(el => io.observe(el));
})();

/* =====================================================
   AI相談エンジン（回答重複防止）
   ─ トピック検出 → 文プールから未使用の文だけで回答を合成。
   ─ 一度出した文は二度と使わない（usedSetに記録）。
===================================================== */
(function () {
  const log = document.getElementById('ai-log');
  const input = document.getElementById('ai-input');
  const sendBtn = document.getElementById('ai-send');
  if (!log || !input) return;

  const used = new Set();
  const pick = pool => {
    for (const s of pool) if (!used.has(s)) { used.add(s); return s; }
    return null;
  };

  const T = [
    { id: '住宅購入', kw: ['住宅', 'マイホーム', '家を買', '物件', '購入', '戸建', 'マンション', '建売', '注文住宅'],
      open: [
        '住宅購入でまず決めるべきは「いくら借りられるか」ではなく「いくらなら人生が崩れないか」です。銀行の審査枠は年収の7〜8倍まで出ますが、教育費・老後と両立できる安全圏はもっと手前にあります。',
        '物件探しの前に、購入後35年間のキャッシュフロー表を作ることを強くおすすめします。「買えるか」ではなく「買った後も幸せか」が判断基準です。',
        '住宅は人生最大の買い物ですが、同時に「他の夢を削る道具」にもなり得ます。予算の逆算は、住宅単体ではなく教育・老後を含めた3つ同時で行うのが鉄則です。'],
      fact: [
        '一般に、無理のない返済額の目安は「額面年収の25％以内」。額面年収700万円なら月々約14.6万円が上限ラインです（手取り基準で考えるなら、さらに保守的になります）。',
        '金利1.0％・35年返済なら、月10万円の返済で約3,540万円借りられます。金利が1.5％に上がると同じ月10万円で約3,270万円まで下がります。',
        '購入時には物件価格の6〜9％程度の諸費用（登記・ローン手数料・火災保険・税金）が別途かかります。4,000万円の物件なら約240〜360万円です。'],
      act: [
        'まず「毎月いくらまでなら35年間払い続けても大丈夫か」を家計から逆算し、その金額から借入上限を計算してみてください。当サイトの簡易診断で1分で試算できます。',
        '複数の金融機関で事前審査を取り、金利タイプ（変動・固定・ミックス）ごとの返済額を並べて比較しましょう。'],
      care: [
        '「家賃並みの返済額」という営業トークには注意が必要です。持ち家は固定資産税・修繕費・保険で年間30〜50万円の維持費が上乗せされます。',
        '夫婦ペアローンは借入額を増やせますが、どちらかの収入減・団信の適用範囲など、リスクの設計が不可欠です。'] },
    { id: '金利', kw: ['金利', '変動', '固定', 'フラット35', '利上げ', '利息'],
      open: [
        '変動か固定かは「損得」ではなく「家計の耐久力」で選ぶのが正解です。金利が2％上がっても返済を続けられる家計なら変動、余力が薄いなら固定が向いています。',
        '金利選びの本質は予想ではなく保険です。固定金利の上乗せ分は「金利上昇に備える保険料」と考えると判断しやすくなります。'],
      fact: [
        '借入4,000万円・35年の場合、金利が0.5％上がると総返済額は約400万円増えます。金利0.1％の差でも約80万円の差になります。',
        '変動金利には一般に「5年ルール（返済額は5年間据え置き）」と「125％ルール（見直し後も1.25倍まで）」がありますが、利息の増加分は免除されず後送りされる点に注意が必要です。'],
      act: [
        '現在の借入がある方は、残高・残年数・金利の3点をメモして借り換えシミュレーションを。残高1,000万円以上・残期間10年以上・金利差0.3％以上が借り換え検討の目安です。',
        '変動で借りる場合は「金利が2％上がった場合の返済額」を先に計算し、その差額を毎月積み立てておくと上昇局面でも慌てません。'],
      care: [
        '金利だけで銀行を選ぶと、団信の保障範囲・手数料型か保証料型かで逆転することがあります。総支払額＋保障内容で比較してください。'] },
    { id: '頭金・繰上返済', kw: ['頭金', '繰上', '繰り上げ', '一括返済', '貯金を入れ'],
      open: [
        '頭金は「多いほど良い」とは限りません。手元資金を減らしすぎると、病気や収入減のときに家計が脆くなります。生活費6ヶ月分＋直近の教育費は必ず残すのが原則です。',
        '繰上返済と資産運用はライバル関係です。ローン金利1％以下なら、繰上返済より新NISAでの運用（期待3〜5％）の方が合理的な場合が多くあります。'],
      fact: [
        '住宅ローン控除は年末残高の0.7％が最大13年間戻る制度。低金利下では「借りたまま控除を受け切ってから繰上返済」の方が得になるケースがあります。',
        '期間短縮型の繰上返済100万円は、返済初期なら利息軽減効果が数十万円になることも。同じ100万円でも実行時期が早いほど効果は大きくなります。'],
      act: [
        '「繰上返済に回す予定のお金を、いったんNISAで積み立てる」方式なら、いつでも繰上に切り替えられる柔軟性を保てます。'],
      care: [
        '住宅ローン控除の適用期間中に繰上返済で残高を減らしすぎると、控除額も減ります。控除とのバランスを必ず試算してから実行してください。'] },
    { id: '教育資金', kw: ['教育', '学費', '大学', '学資', '子ども', '子供', '進学', '塾', '習い事'],
      open: [
        '教育資金の鉄則は「使う時期が決まっているお金」だということ。大学入学の年齢から逆算し、必要額の7〜8割は元本割れしにくい形で準備するのが基本です。',
        '教育費は「じわじわ払う生活費」と「大学でドンとかかる一時金」に分かれます。積立で備えるべきは後者、月々の家計で吸収すべきは前者と分けて考えると設計が楽になります。'],
      fact: [
        '子ども1人あたりの教育費総額は、全て公立で約800万円、私立中心なら1,500〜2,000万円が目安です。最大の山は大学4年間で、私立文系なら約400〜500万円かかります。',
        '月1.5万円を利回り7％で20年間積み立てると約738万円（元本360万円）。同じ積立でも銀行預金なら360万円のままです。時間と複利が教育資金の最大の味方です。',
        '児童手当を全額貯めるだけで、中学卒業までに約200万円になります。「手当は最初からなかったもの」として自動積立するのが最も確実です。'],
      act: [
        'お子さまの現在の年齢から大学入学まで何年あるかを数え、「必要額 −（児童手当＋現在の積立見込み）」の不足分を月割りしてみてください。それが今日から積み立てるべき金額です。'],
      care: [
        '教育資金を全額投資で準備するのは危険です。入学直前に暴落が来ると取り崩せなくなるため、入学5年前からは段階的に安全資産へ移すのがセオリーです。'] },
    { id: 'NISA', kw: ['nisa', 'ニーサ', '積立投資', 'つみたて', '投資信託', 'インデックス', 'オルカン', 's&p'],
      open: [
        '新NISAの最大の強みは「運用益が一生非課税」であること。通常は利益の約20％が税金で引かれますが、NISA内なら丸ごと手元に残ります。',
        'NISAで大切なのは商品選びより「続ける仕組み」です。給料日翌日の自動積立に設定し、暴落時もやめない。これだけで大半の人より良い成績になります。'],
      fact: [
        '新NISAは年間360万円（つみたて投資枠120万円＋成長投資枠240万円）、生涯1,800万円まで投資できます。売却すると翌年に枠が復活するのも旧制度にない特長です。',
        '全世界株式インデックスの過去30年の平均リターンは年5〜7％程度。月3万円を30年間・年5％で積み立てると約2,500万円（元本1,080万円）になる計算です。',
        '積立は「時間分散」の効果で高値づかみを避けられます。一括投資より心理的に続けやすいのも大きな利点です。'],
      act: [
        'まずは「毎月の黒字額の半分」から始めるのがおすすめです。家計に無理のない金額で自動積立を設定し、ボーナス月に増額する設計が長続きします。'],
      care: [
        'NISAは「損益通算ができない」点に注意。損失が出ても他の利益と相殺できません。だからこそ長期・分散・積立の王道運用と相性が良い制度です。'] },
    { id: 'iDeCo', kw: ['ideco', 'イデコ', '確定拠出', '個人型', '401k'],
      open: [
        'iDeCoの本質は「節税しながら作る自分年金」です。掛金が全額所得控除になるため、拠出した瞬間に所得税・住民税が確実に安くなります。これは運用リターンとは別の、制度が保証する利益です。',
        'NISAとiDeCoで迷ったら、「60歳まで使わないお金はiDeCo、途中で使うかもしれないお金はNISA」という分け方が実務的です。'],
      fact: [
        '年収600万円の会社員が月2.3万円拠出すると、所得税・住民税が年間約5.5万円軽減されます。30年続ければ節税だけで約165万円です。',
        '2024年12月から企業年金がある会社員の拠出上限が月2万円に引き上げられ、より使いやすくなりました（企業年金がない会社員は月2.3万円のまま）。受取時も退職所得控除・公的年金等控除が使えます。'],
      act: [
        'まず勤務先に「企業型DCの有無」と「マッチング拠出の可否」を確認してください。それによってiDeCoの拠出可能額が変わります。'],
      care: [
        'iDeCoは原則60歳まで引き出せません。住宅頭金や教育費に充てる予定のお金を入れないよう、流動性の設計が重要です。'] },
    { id: '老後資金', kw: ['老後', '年金', '退職', '2000万', 'リタイア', '定年', 'セカンドライフ'],
      open: [
        '老後資金の正解は「2,000万円」という一律の数字ではなく、「あなたの年金収入と理想の生活費の差額 × 年数」です。まず自分の年金額を知ることがスタートラインです。',
        '老後不安の正体の8割は「いくら必要か分からない」こと。必要額が数字で見えると、対策は月々の積立額という具体的な行動に変わります。'],
      fact: [
        '夫婦2人のモデル年金は月約23万円。ゆとりある老後の生活費は月約36万円と言われ、差額13万円×30年＝約4,700万円が「ゆとり分」の総額です（最低限なら不足はもっと小さくなります）。',
        '年金は繰下げ受給で1ヶ月あたり0.7％増額されます。70歳まで繰り下げると42％増、75歳なら84％増の年金を一生受け取れます。',
        '30歳から月3万円・年5％で積み立てると65歳時点で約3,400万円。40歳スタートだと同条件で約1,800万円。開始が10年遅れると、必要な月額は約2倍になります。'],
      act: [
        '「ねんきん定期便」の見込額を確認し、理想の月の生活費との差額を出してみてください。その差額×12ヶ月×30年が目標額のたたき台になります。'],
      care: [
        '退職金を一括で投資するのは最も危険なパターンの一つです。退職前後のお金は「守り7：攻め3」程度の配分から始めるのが無難です。'] },
    { id: '保険', kw: ['保険', '医療保険', '生命保険', '学資保険', '終身', '掛け捨て', '団信', '見直し'],
      open: [
        '保険の役割は「貯蓄で耐えられない損失」への備えに絞ることです。逆に言えば、貯蓄で払える程度のリスクに保険料を払い続けるのは非効率です。',
        '住宅ローンを組むと団信（団体信用生命保険）に入るため、死亡保障はその分減らせるケースが多くあります。ローン契約は保険見直しの絶好のタイミングです。'],
      fact: [
        '日本の世帯平均の生命保険料は年間約37万円。30年払えば1,100万円超です。ここに月1〜2万円のムダが見つかる家庭は珍しくありません。',
        '高額療養費制度により、年収500万円前後の方の医療費自己負担は月約8〜9万円が上限です。医療保険はこの前提で必要額を考えます。',
        '学資保険の返戻率は現在105〜110％程度。同じ15年でNISA運用（年5％想定）なら約1.3倍が期待でき、「保障は掛け捨て＋積立はNISA」という分離設計も有力です。'],
      act: [
        '保険証券を全部並べて「何のリスクに・いくら・いつまで」を一覧表にしてみてください。重複や過剰がひと目で見つかります。無料相談で一緒に棚卸しすることも可能です。'],
      care: [
        '貯蓄型保険の途中解約は元本割れが基本です。見直しの際は解約ではなく「払い済み」への変更が有利な場合もあるので、必ず比較してから判断してください。'] },
    { id: '相続', kw: ['相続', '遺産', '遺言', '実家', '親の', '争族', '相続税'],
      open: [
        '相続対策は「節税」より先に「分け方」です。相続トラブルの多くは税金ではなく、不動産など分けにくい資産の分割で起こります。',
        '相続税がかかるかどうかの分かれ目は基礎控除「3,000万円＋600万円×法定相続人の数」。まずご実家の資産がこのラインを超えるかの概算から始めましょう。'],
      fact: [
        '相続人が配偶者＋子2人なら基礎控除は4,800万円。都市部に持ち家があると意外と超えるケースが多く、「うちは関係ない」が最も危険な思い込みです。',
        '生命保険の死亡保険金には「500万円×法定相続人」の非課税枠があります。現預金を保険に変えるだけで課税財産を圧縮できる、最も手軽な対策の一つです。',
        '配偶者は「1億6,000万円か法定相続分のいずれか大きい額」まで相続税がかかりません。ただし使いすぎると二次相続で子の負担が跳ね上がる点に注意が必要です。'],
      act: [
        'まず親御さまの資産の棚卸し（不動産の評価額・預貯金・保険・有価証券）を一覧にすることから。当サイトの相続税シミュレーションで概算もできます。'],
      care: [
        '不動産の生前贈与や名義変更は、贈与税・不動産取得税・登録免許税で逆に高くつくことがあります。実行前に必ず税理士へ確認を。当社はグループの高橋秀和税理士事務所と連携し、ワンストップでサポートできます。'] },
    { id: '贈与', kw: ['贈与', '生前贈与', '援助', '親から', '住宅資金贈与', '110万'],
      open: [
        '贈与は「年110万円の基礎控除」を長期間コツコツ使うのが王道です。10年で1,100万円を無税で移転でき、相続財産の圧縮効果も大きくなります。',
        '2024年から生前贈与の相続への持ち戻し期間が3年から7年に延長されました。贈与による相続対策は「早く始めるほど有利」な制度に変わっています。'],
      fact: [
        '住宅取得資金の贈与は、省エネ等住宅なら最大1,000万円まで非課税（2026年12月まで・要件あり）。基礎控除110万円と併用でき、頭金の強い味方です。',
        '教育資金の一括贈与は1,500万円まで非課税の特例がありますが、使い残しに課税されるリスクもあり、実は「必要な都度の贈与（もともと非課税）」で足りるケースが大半です。'],
      act: [
        '贈与契約書を毎回作成し、振込で記録を残してください。「あげた・もらった」の証拠がないと、相続時に名義預金と認定される恐れがあります。'],
      care: [
        '毎年同額・同日の贈与は「定期贈与」とみなされ一括課税されるリスクが指摘されています。金額や時期を変える、契約書を都度作るなどの工夫が安全です。'] },
    { id: '税金・控除', kw: ['税金', '控除', 'ふるさと納税', '節税', '確定申告', '年末調整', '住民税', '所得税'],
      open: [
        '会社員でもできる節税は「所得控除を漏れなく使う」ことに尽きます。iDeCo・生命保険料控除・医療費控除・ふるさと納税の4点セットだけで年数万〜十数万円変わります。',
        '節税の優先順位は「確実に得する制度から」。iDeCo（全額所得控除）→ふるさと納税（実質2,000円）→NISA（運用益非課税）の順に埋めていくのが定石です。'],
      fact: [
        'ふるさと納税の上限額は年収と家族構成で決まります。年収700万円・夫婦＋子1人なら目安は約7.5万円。上限内なら実質負担2,000円で返礼品を受け取れます。',
        '住宅ローン控除は所得税から引き切れない分が住民税からも控除されます（上限あり）。年末調整だけで完結する2年目以降も、初年度は確定申告が必須です。',
        '共働きの場合、医療費控除やふるさと納税は「所得の高い方」に寄せるのが原則。世帯単位での最適化で手取りが変わります。'],
      act: [
        '源泉徴収票の「源泉徴収税額」を確認してみてください。ここがiDeCoやふるさと納税で減らせる金額の原資です。無料相談では源泉徴収票1枚から改善余地を診断できます。'],
      care: [
        '節税商品と呼ばれるもの（過度な不動産投資・高額な保険）は、税金は減っても手残りが減っては本末転倒です。「節税額」ではなく「手取りの増減」で判断してください。'] },
    { id: '家計改善', kw: ['家計', '節約', '貯金', '貯蓄', '固定費', '赤字', 'やりくり', '支出'],
      open: [
        '家計改善は「我慢の節約」ではなく「固定費の設計変更」から。通信費・保険・サブスク・電気ガスの4つは、一度の手続きで効果が一生続きます。',
        '貯蓄の成功率を決めるのは意志ではなく仕組みです。「先取り貯蓄＋残りで生活」に変えるだけで、貯蓄率は平均的に大きく改善します。'],
      fact: [
        '手取りに対する貯蓄率の目安は、独身20％・夫婦（子なし）25％・子育て世帯15％。まずは現状の貯蓄率を計算することが第一歩です。',
        '格安SIMへの乗り換えで夫婦月1万円、保険の見直しで月1〜2万円、火災保険・電気の切り替えで年数万円。固定費だけで月3万円の改善は珍しくありません。月3万円は35年で1,260万円です。'],
      act: [
        '直近3ヶ月の銀行・カード明細から「固定費だけ」を書き出してみてください。変動費の節約より先に、固定費の上位3つにメスを入れるのが最短ルートです。'],
      care: [
        '教育費や食費など「削ると家族の満足度が大きく下がる支出」は最後に。節約が続かない原因の多くは、削る順番の間違いです。'] },
    { id: '資産運用', kw: ['投資', '運用', 'リスク', '株', '債券', '分散', 'ポートフォリオ', '暴落', '円安', 'インフレ'],
      open: [
        '資産運用の目的は「増やすこと」ではなく「人生の目的地に間に合わせること」です。目標額と期限が決まれば、必要なリターンとリスクの取り方は逆算できます。',
        'インフレが続く時代、現金だけで持つことにもリスクがあります。物価が年2％上がると、現金の価値は35年で約半分になります。「増やす」より「守る」ために運用が必要な時代です。'],
      fact: [
        '長期投資では「投資期間15年以上なら、全世界株式のリターンがマイナスになった歴史はほぼない」というデータがあります（過去実績であり将来の保証ではありません）。',
        '資産配分（アセットアロケーション）がリターンの約9割を決めるという研究が知られています。銘柄選びより「株式と安全資産の比率」の方がはるかに重要です。',
        '暴落は必ず来ます。リーマンショックでは世界株は約半分になりましたが、5年ほどで回復しました。積立を止めなかった人が最も報われたのが歴史の教訓です。'],
      act: [
        '「使う時期」で資金を3つに分けてください。5年以内に使うお金は預金、5〜15年は債券混合、15年以上は株式中心。この仕分けだけで運用の8割は設計できます。'],
      care: [
        '「必ず儲かる」「月利○％」という話は全て詐欺と考えて差し支えありません。金融庁登録のある金融機関・商品以外には近づかないでください。'] },
    { id: '省エネ住宅', kw: ['zeh', 'ゼッチ', '太陽光', '省エネ', '断熱', '光熱費', '一条', 'オール電化', '売電'],
      open: [
        '高断熱・高気密住宅は「快適さ」だけでなく「毎月の固定費を35年間下げ続ける投資」です。光熱費の差は住宅ローンの実質負担を左右します。',
        'ZEH住宅は初期費用が上がる分、光熱費削減＋売電収入＋補助金で回収していくモデルです。回収年数を試算してから仕様を決めるのが賢い進め方です。'],
      fact: [
        '一般住宅とZEH水準の住宅では、光熱費の差が月1〜2万円になることがあります。月1.5万円の差は35年で630万円— 物件価格の差を上回るケースも十分あります。',
        '太陽光発電は容量5kW前後で年間5,500〜6,000kWhの発電が目安。自家消費が増えた現在は「売る」より「買わない」効果が主役です。',
        'ZEHや長期優良住宅は、住宅ローン控除の借入上限が一般住宅より500〜1,000万円高く設定されており、税制面でも優遇されています。'],
      act: [
        '住宅会社の見積を比較する際は「本体価格」だけでなく「35年間の光熱費＋メンテナンス費を足した総額」で並べてみてください。順位が入れ替わることがよくあります。'],
      care: [
        '太陽光の売電単価は年々下がっています。売電収入をあてにした資金計画ではなく、自家消費メインの保守的な試算で判断してください。'] },
    { id: 'ライフイベント', kw: ['結婚', '出産', '転職', '独立', '育休', '介護', '離婚', '引越', '収入が減'],
      open: [
        'ライフイベントの前後は、家計の「固定費が組み変わる」タイミングです。変化の前にキャッシュフロー表を更新しておくと、意思決定の質が大きく上がります。',
        '収入が変わる転職・育休・独立の場面では、「変化後の手取りで固定費が回るか」を先に確認するのが鉄則です。貯蓄や投資は一時停止しても、固定費の赤字は蓄積します。'],
      fact: [
        '出産費用は出産育児一時金50万円でかなりカバーされ、育休中は育児休業給付金が手取りの実質8割程度（180日まで）出ます。休業中の社会保険料も免除されます。',
        '介護は平均5年・総額約580万円というデータがあります。親の介護は「親のお金で賄う」のが大原則で、そのためにも親の資産状況の把握が欠かせません。'],
      act: [
        'イベントの半年前を目安に、①手取りの変化 ②固定費の変化 ③公的給付の3点を書き出してみてください。多くの不安は「知らない給付金」を知るだけで軽くなります。'],
      care: [
        '転職時は住宅ローン審査への影響に注意。勤続年数がリセットされるため、購入予定がある方は「ローン実行後の転職」が安全です。'] },
  ];

  const ACK = [
    'ご質問ありがとうございます。',
    '良い視点のご質問です。',
    'なるほど、大切なポイントですね。',
    'その疑問を持てている時点で、一歩リードしています。',
    '承知しました。整理してお答えします。',
    'ここは相談現場でもよく話題になるテーマです。',
    'お任せください、FPの視点でお答えします。',
    'まさに30代のご家庭に多いお悩みです。'
  ];
  const CLOSE = [
    'より詳しくは、あなたの数字を使った無料相談で一緒に試算できます。',
    '前提条件（年齢・年収・家族構成）で最適解は変わります。個別のシミュレーションは無料相談をご利用ください。',
    'この続きは、ご家庭の実際の数字で確認するのが確実です。オンライン無料相談をお気軽にどうぞ。',
    '関連するご質問があれば、下のボタンからでも自由入力でもどうぞ。',
    '「うちの場合は？」の答えは無料のライフプラン診断で数分で出せます。',
    '一般論はここまで。ここから先はあなた専用の設計図の出番です。',
    '疑問が残れば、角度を変えてもう一度聞いてみてください。別の視点でお答えします。',
    '無料相談では、必要に応じてグループの高橋秀和税理士事務所との連携も含め、税金まわりまで一緒に整理できます。'
  ];
  const FALLBACK = [
    'ご質問の意図を正しく捉えたいので、少しだけ具体的に教えてください。例えば「35歳・年収600万・子ども2人で住宅予算は？」のように、状況を添えていただくと精度の高い回答ができます。',
    'そのテーマは複数の分野にまたがりそうです。「住宅」「教育費」「老後」「NISA・iDeCo」「保険」「相続・贈与」「税金」「家計」のどれに一番近いか教えていただけますか？',
    '申し訳ありません、その分野はこのデモAIの守備範囲を超えているかもしれません。ライフプラン・住宅・資産形成・保険・相続・税金についてなら、どの角度からでもお答えできます。',
    '一般的な情報としてお答えできる範囲を超えて、個別具体的な判断が必要なご質問のようです。こうしたケースこそ無料相談の出番です。オンラインで気軽にご相談ください。'
  ];
  const EXHAUST = [
    'このテーマの一般論は、これまでの回答でほぼ出し尽くしました。ここから先は前提条件で答えが変わる領域です。無料相談で、あなたの数字を使った続きをお話しさせてください。',
    'お伝えできる一般的なポイントは一通りご紹介しました。次のステップは「あなたの場合の数字」に落とすことです。簡易診断ツールか無料相談をぜひご活用ください。',
    'この分野はかなり深掘りしましたね。残る論点はご家庭ごとの個別事情に依存します。オンライン無料相談なら30分で具体的な方向性までお示しできます。'
  ];

  function detectTopic(q) {
    const s = q.toLowerCase();
    let best = null, bestScore = 0;
    for (const t of T) {
      let sc = 0;
      for (const k of t.kw) if (s.includes(k.toLowerCase())) sc += k.length >= 3 ? 2 : 1;
      if (sc > bestScore) { bestScore = sc; best = t; }
    }
    return bestScore > 0 ? best : null;
  }

  function personalize(q) {
    const out = [];
    const age = q.match(/(\d{2})\s*歳/);
    const income = q.match(/年収\s*(\d{3,4})/);
    const kids = q.match(/子(?:ども|供)?\s*(\d)\s*人/);
    if (age) out.push(`${age[1]}歳とのことですので、時間を味方につけられるかが設計の分かれ目です。`);
    if (income) out.push(`年収${income[1]}万円を前提にすると、無理のない住居費・積立額の目安も概算できます。`);
    if (kids) out.push(`お子さま${kids[1]}人分のライフイベントを時間軸に並べて考える必要がありますね。`);
    return out.filter(s => !used.has(s)).map(s => { used.add(s); return s; });
  }

  function compose(q) {
    const t = detectTopic(q);
    const parts = [];
    const ack = pick(ACK);
    if (ack) parts.push(ack);
    parts.push(...personalize(q));

    if (!t) {
      const f = pick(FALLBACK) || FALLBACK[FALLBACK.length - 1];
      parts.push(f);
      const c = pick(CLOSE);
      if (c) parts.push(c);
      return { text: parts.join('\n\n'), topic: null };
    }

    const open = pick(t.open);
    const fact = pick(t.fact);
    const act = pick(t.act);
    const care = pick(t.care);

    if (!open && !fact && !act && !care) {
      const ex = pick(EXHAUST) || 'このテーマは無料相談で個別にお答えするのが確実です。';
      parts.push(`【${t.id}】${ex}`);
      return { text: parts.join('\n\n'), topic: t.id };
    }
    if (open) parts.push(open);
    if (fact) parts.push(`【ポイント】${fact}`);
    if (act) parts.push(`【次の一歩】${act}`);
    if (care) parts.push(`【注意点】${care}`);
    const c = pick(CLOSE);
    if (c) parts.push(c);
    return { text: parts.join('\n\n'), topic: t.id };
  }

  /* --- チャットUI --- */
  function addMsg(text, who) {
    const div = document.createElement('div');
    div.className = 'ai-msg' + (who === 'user' ? ' user' : '');
    div.innerHTML = (who === 'user' ? '' : '<span class="ai-avatar"><i class="fa-solid fa-robot"></i></span>') +
      `<div class="ai-msg-body">${escapeHtml(text)}</div>`;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
    return div;
  }
  function addTyping() {
    const div = document.createElement('div');
    div.className = 'ai-msg';
    div.innerHTML = '<span class="ai-avatar"><i class="fa-solid fa-robot"></i></span><div class="ai-msg-body"><span class="ai-typing"><i></i><i></i><i></i></span></div>';
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
    return div;
  }

  let busy = false;
  function send(text) {
    const q = (text || input.value).trim();
    if (!q || busy) return;
    busy = true;
    input.value = '';
    addMsg(q, 'user');
    const typing = addTyping();
    const res = compose(q);
    setTimeout(() => {
      typing.remove();
      addMsg(res.text, 'bot');
      busy = false;
    }, 700 + Math.min(q.length * 18, 900));
  }

  sendBtn?.addEventListener('click', () => send());
  input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.isComposing) send(); });
  document.querySelectorAll('.ai-chip').forEach(ch =>
    ch.addEventListener('click', () => send(ch.dataset.q || ch.textContent)));

  addMsg('こんにちは！株式会社Office-MのAIアシスタントです。住宅・教育費・老後・NISA・保険・相続・税金…お金の疑問なら何でもどうぞ。同じテーマでも、聞くたびに別の角度からお答えします。', 'bot');
})();

/* =====================================================
   簡易診断（保存・読込・PDF）
===================================================== */
function readDiagInputs() {
  return {
    age: +document.getElementById('age').value || 0,
    income: +document.getElementById('income').value || 0,
    savings: +document.getElementById('savings').value || 0,
    retire: +document.getElementById('retire').value || 65,
    loanYrs: +document.getElementById('loan-years').value || 35,
    rate: document.getElementById('rate').value,
    children: +document.getElementById('children').value || 0,
    name: (document.getElementById('cust-name')?.value || ''),
  };
}
function applyDiagInputs(d) {
  if (!d) return;
  const set = (id, v) => { const el = document.getElementById(id); if (el && v != null) el.value = v; };
  set('age', d.age); set('income', d.income); set('savings', d.savings);
  set('children', d.children); set('retire', d.retire);
  set('loan-years', d.loanYrs); set('rate', d.rate);
  if (d.name != null) set('cust-name', d.name);
}
function rc(label, value) {
  return `<div style="background:#fff;padding:14px 16px;border-radius:12px;border:1px solid #dcebf3;text-align:center;">
    <p style="font-size:.72rem;color:#6f8494;margin-bottom:5px;font-weight:600;">${label}</p>
    <p style="font-size:1.2rem;font-weight:900;color:#16425f;">${value}</p>
  </div>`;
}
function runDiagnosis(doScroll) {
  const d = readDiagInputs();
  const rate = parseFloat(d.rate);
  if (!d.age || !d.income) { toast('年齢と世帯年収を入力してください'); return false; }
  const safeMonthlyYen = d.income * 10000 * 0.25 / 12;
  const safeMonthly = Math.round(safeMonthlyYen / 1000) * 1000;
  const annualRate = isNaN(rate) ? 1.0 : rate;
  const i = annualRate / 100 / 12;
  const N = Math.max(1, d.loanYrs) * 12;
  const principalYen = i > 0 ? safeMonthlyYen * (1 - Math.pow(1 + i, -N)) / i : safeMonthlyYen * N;
  const maxLoan = Math.round(principalYen / 10000);
  const downPayment = Math.round(d.savings * 0.7);
  const totalBudget = maxLoan + downPayment;
  const childrenCost = d.children * 800;
  const custName = (d.name || '').trim();

  let risk, riskColor, riskBg, riskMsg;
  if (d.income < 500 || (d.income < 700 && d.children >= 2)) {
    risk = '要注意'; riskColor = '#c0392b'; riskBg = '#fdeeea';
    riskMsg = '教育費・老後資金との両立を慎重にシミュレーションする必要があります。専門家への相談を強くお勧めします。';
  } else if (d.income >= 900 && d.children <= 1) {
    risk = '余裕あり'; riskColor = '#1d6b46'; riskBg = '#eaf7f0';
    riskMsg = '比較的余裕のある計画が立てやすい状況です。積極的な資産運用も視野に入れましょう。';
  } else {
    risk = '標準'; riskColor = '#9a7a2c'; riskBg = '#fbf6e8';
    riskMsg = '適切な計画を立てることで無理のない住宅購入が可能です。ライフプランの精緻な設計が重要です。';
  }

  const el = document.getElementById('qd-result');
  el.classList.add('show');
  el.innerHTML = `
    <div id="diag-card" style="background:#fff;padding:20px;border-radius:14px;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;flex-wrap:wrap;">
        <h4 style="font-size:1rem;font-weight:800;color:#16425f;"><i class="fa-solid fa-clipboard-list" style="color:#e5732c;margin-right:6px;"></i>簡易診断結果</h4>
        <span style="font-size:.78rem;font-weight:700;padding:4px 12px;border-radius:100px;background:${riskBg};color:${riskColor};">${risk}</span>
      </div>
      <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:6px;font-size:.74rem;color:#6f8494;border-bottom:1px solid #eee;padding-bottom:10px;margin-bottom:14px;">
        <span>${custName ? 'お名前／メモ： <strong style="color:#16425f;">' + escapeHtml(custName) + '</strong>' : '株式会社Office-M ライフプラン診断'}</span>
        <span>作成日：${fmtDateTime(Date.now())}</span>
      </div>
      <div style="background:#eaf6fb;border-radius:10px;padding:11px 14px;margin-bottom:16px;font-size:.78rem;color:#51687a;line-height:1.7;">
        <strong style="color:#16425f;">入力内容</strong>：年齢${d.age}歳／世帯年収${d.income.toLocaleString()}万円／貯蓄${d.savings.toLocaleString()}万円／子ども${d.children}人／退職${d.retire}歳／ローン${d.loanYrs}年／金利${annualRate}％
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:10px;">
        ${rc('適正借入額', maxLoan.toLocaleString() + '万円')}
        ${rc('安全な月返済額', safeMonthly.toLocaleString() + '円')}
        ${rc('用意できる頭金', downPayment.toLocaleString() + '万円')}
        ${rc('合計購入予算目安', totalBudget.toLocaleString() + '万円')}
      </div>
      <p style="font-size:.72rem;color:#93a6b3;margin-bottom:16px;"><i class="fa-solid fa-circle-info"></i> 金利 ${annualRate}％・${d.loanYrs}年返済・年収の25％以内で試算した目安です。</p>
      ${childrenCost > 0 ? `<div style="background:#fdeee7;border-left:3px solid #e5732c;padding:12px 16px;border-radius:8px;margin-bottom:14px;font-size:.85rem;color:#51687a;">
        <i class="fa-solid fa-triangle-exclamation" style="color:#e5732c;"></i> お子さま${d.children}人分の教育費 <strong>${childrenCost.toLocaleString()}万円</strong> も別途計画が必要です。
      </div>` : ''}
      <div style="background:${riskBg};border-left:3px solid ${riskColor};padding:14px 16px;border-radius:8px;margin-bottom:12px;">
        <p style="font-size:.875rem;color:${riskColor};font-weight:700;margin-bottom:4px;">${risk} の判定</p>
        <p style="font-size:.85rem;color:#51687a;line-height:1.7;">${riskMsg}</p>
      </div>
      <p style="font-size:.72rem;color:#93a6b3;">※ 入力した金利・返済年数を反映した目安です。インフレ・実際の生活費・諸費用等は含まれていません。</p>
    </div>
    <div class="diag-actions">
      <button type="button" class="diag-pdf-btn" onclick="exportDiagPDF()"><i class="fa-solid fa-file-pdf"></i> PDFで保存</button>
      <a href="#reserve" class="diag-consult-btn">詳しくライフプランを相談する（無料）→</a>
    </div>`;
  if (doScroll !== false) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  return true;
}
document.getElementById('diagnose-btn')?.addEventListener('click', () => runDiagnosis(true));

window.exportDiagPDF = function () {
  const card = document.getElementById('diag-card');
  if (!card) { toast('先に「診断する」を押してください'); return; }
  const name = (document.getElementById('cust-name')?.value || '').trim();
  const fname = (name ? name.replace(/\s+/g, '') + '_' : '') + 'ライフプラン診断結果.pdf';
  if (typeof html2pdf === 'undefined') { window.print(); return; }
  toast('PDFを作成しています…');
  html2pdf().set({
    margin: [12, 12, 12, 12], filename: fname,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
  }).from(card).save();
};

/* --- 顧客データ保存（localStorage） --- */
const LS_KEY = 'mlp_customers';
function loadCustomers() { try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; } catch (e) { return []; } }
function saveCustomers(list) { try { localStorage.setItem(LS_KEY, JSON.stringify(list)); } catch (e) {} }
function renderSavedList() {
  const box = document.getElementById('qd-saved-list');
  if (!box) return;
  const list = loadCustomers();
  if (!list.length) {
    box.innerHTML = '<p class="qd-saved-empty">保存データはまだありません。入力後「保存」を押すとここに表示されます。</p>';
    return;
  }
  box.innerHTML = list.slice().reverse().map(item => `
    <div class="qd-saved-item">
      <div class="qd-saved-info">
        <strong>${escapeHtml(item.name || '名称未設定')}</strong>
        <span>${fmtDateTime(item.ts)}｜年収${(item.data.income || 0).toLocaleString()}万円・子ども${item.data.children || 0}人</span>
      </div>
      <div class="qd-saved-actions">
        <button type="button" class="qd-mini" onclick="loadCustomer('${item.id}')"><i class="fa-solid fa-rotate-left"></i> 続きから</button>
        <button type="button" class="qd-mini del" onclick="deleteCustomer('${item.id}')" aria-label="削除"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>`).join('');
}
window.loadCustomer = function (id) {
  const item = loadCustomers().find(x => x.id === id);
  if (!item) return;
  applyDiagInputs(item.data);
  runDiagnosis(true);
  toast(`「${item.name || '保存データ'}」を読み込みました`);
};
window.deleteCustomer = function (id) {
  saveCustomers(loadCustomers().filter(x => x.id !== id));
  renderSavedList();
  toast('削除しました');
};
document.getElementById('qd-save-btn')?.addEventListener('click', () => {
  const data = readDiagInputs();
  if (!data.age || !data.income) { toast('年齢と世帯年収を入力してください'); return; }
  const list = loadCustomers();
  const name = (data.name || '').trim();
  const existing = name ? list.find(x => (x.name || '') === name) : null;
  if (existing) { existing.data = data; existing.ts = Date.now(); }
  else { list.push({ id: 'c' + Date.now(), name, ts: Date.now(), data }); }
  saveCustomers(list);
  renderSavedList();
  toast(name ? `「${name}」を保存しました` : '保存しました');
});
renderSavedList();

/* =====================================================
   資産形成シミュレーション
===================================================== */
(function () {
  const monthlyEl = document.getElementById('asim-monthly');
  const yearsEl = document.getElementById('asim-years');
  const customEl = document.getElementById('asim-custom');
  const tbody = document.getElementById('asim-tbody');
  const summaryEl = document.getElementById('asim-summary');
  const chartEl = document.getElementById('asim-chart');
  const thCustom = document.getElementById('asim-th-custom');
  if (!monthlyEl || !tbody) return;
  const man = yen => Math.round(yen / 10000);
  function series(annual, r, years) {
    const arr = []; let bal = 0;
    for (let k = 1; k <= years; k++) { bal = bal * (1 + r) + annual; arr.push(bal); }
    return arr;
  }
  function buildChart(years, principal, s3, s5, s7, sc, cpct) {
    const W = 760, H = 250, padL = 46, padR = 14, padT = 12, padB = 24;
    const maxV = Math.max(s7[years - 1], sc[years - 1], principal[years - 1]) || 1;
    const x = k => padL + (years <= 1 ? 0 : k / (years - 1) * (W - padL - padR));
    const y = v => padT + (1 - v / maxV) * (H - padT - padB);
    const line = (arr, color, w) =>
      `<polyline points="${arr.map((v, k) => x(k).toFixed(1) + ',' + y(v).toFixed(1)).join(' ')}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`;
    let grid = '';
    for (let t = 0; t <= 4; t++) {
      const v = maxV * t / 4, yy = y(v);
      grid += `<line x1="${padL}" y1="${yy.toFixed(1)}" x2="${W - padR}" y2="${yy.toFixed(1)}" stroke="#efece4" stroke-width="1"/>`;
      grid += `<text x="${padL - 6}" y="${(yy + 3).toFixed(1)}" text-anchor="end" font-size="9" fill="#93a6b3">${man(v).toLocaleString()}</text>`;
    }
    let xlab = '';
    const step = years <= 12 ? 2 : 5;
    for (let k = 0; k < years - 1; k += step) xlab += `<text x="${x(k).toFixed(1)}" y="${H - 7}" text-anchor="middle" font-size="9" fill="#93a6b3">${k + 1}</text>`;
    xlab += `<text x="${x(years - 1).toFixed(1)}" y="${H - 7}" text-anchor="middle" font-size="9" fill="#e5732c" font-weight="700">${years}年</text>`;
    return `
      <svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="資産推移グラフ">
        ${grid}
        <text x="6" y="${padT + 6}" font-size="9" fill="#93a6b3">万円</text>
        ${line(principal, '#93a6b3', 2)}
        ${line(s3, '#0d8477', 2)}
        ${line(s5, '#2563b5', 2)}
        ${line(sc, '#9a7a2c', 2)}
        ${line(s7, '#c2452c', 2.6)}
        ${xlab}
      </svg>
      <div class="asim-legend">
        <span><i style="background:#93a6b3"></i>元本</span>
        <span><i style="background:#0d8477"></i>3%</span>
        <span><i style="background:#2563b5"></i>5%</span>
        <span><i style="background:#c2452c"></i>7%</span>
        <span><i style="background:#9a7a2c"></i>${cpct}%</span>
      </div>`;
  }
  function render() {
    const monthly = Math.max(0, +monthlyEl.value || 0);
    const years = Math.min(40, Math.max(1, Math.floor(+yearsEl.value || 1)));
    const customN = parseFloat(customEl.value);
    const cpct = isNaN(customN) ? 6 : customN;
    const annual = monthly * 12;
    thCustom.textContent = cpct + '%';
    const principal = [];
    for (let k = 1; k <= years; k++) principal.push(annual * k);
    const s3 = series(annual, .03, years), s5 = series(annual, .05, years),
          s7 = series(annual, .07, years), sc = series(annual, cpct / 100, years);
    const last = a => a[a.length - 1];
    const pr = last(principal);
    const sumCard = (cls, lab, val) => `<div class="asim-sum-card ${cls}">
      <div class="lab">${lab}</div>
      <div class="val">${man(val).toLocaleString()}<small>万円</small></div>
      ${cls === 'principal' ? '<div class="gain">積み立てた元本</div>' : `<div class="gain">+${man(val - pr).toLocaleString()}万円</div>`}
    </div>`;
    summaryEl.innerHTML =
      sumCard('principal', '元本', pr) + sumCard('r3', '年3%', last(s3)) +
      sumCard('r5', '年5%', last(s5)) + sumCard('r7', '年7%', last(s7)) +
      sumCard('rc', '年' + cpct + '%', last(sc));
    let rows = '';
    for (let k = 0; k < years; k++) {
      rows += `<tr class="${k === years - 1 ? 'is-maturity' : ''}">
        <td>${k + 1}年</td>
        <td class="pri">${man(principal[k]).toLocaleString()}</td>
        <td>${man(s3[k]).toLocaleString()}</td>
        <td>${man(s5[k]).toLocaleString()}</td>
        <td class="v7">${man(s7[k]).toLocaleString()}</td>
        <td>${man(sc[k]).toLocaleString()}</td>
      </tr>`;
    }
    tbody.innerHTML = rows;
    chartEl.innerHTML = buildChart(years, principal, s3, s5, s7, sc, cpct);
  }
  document.querySelectorAll('.asim-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.asim-preset').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      monthlyEl.value = btn.dataset.monthly;
      yearsEl.value = btn.dataset.years;
      render();
    });
  });
  [monthlyEl, yearsEl, customEl].forEach(el => el.addEventListener('input', () => {
    document.querySelectorAll('.asim-preset').forEach(b => b.classList.remove('active'));
    render();
  }));
  render();
})();

/* =====================================================
   税金タブ・計算
===================================================== */
document.querySelectorAll('.ttab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.ttab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.ttab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('ttab-' + btn.dataset.ttab)?.classList.add('active');
  });
});

function rr(label, value, color) {
  return `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #eef4f8;">
    <span style="font-size:.85rem;color:#6f8494;">${label}</span>
    <span style="font-size:.95rem;font-weight:800;color:${color};">${value}</span>
  </div>`;
}
function calcInheritTax(amount) {
  if (amount <= 1000) return amount * .10;
  if (amount <= 3000) return amount * .15 - 50;
  if (amount <= 5000) return amount * .20 - 200;
  if (amount <= 10000) return amount * .30 - 700;
  if (amount <= 20000) return amount * .40 - 1700;
  if (amount <= 30000) return amount * .45 - 2700;
  if (amount <= 60000) return amount * .50 - 4200;
  return amount * .55 - 7200;
}
function showInheritResult(html) {
  const el = document.getElementById('inherit-result');
  el.style.alignItems = 'flex-start';
  el.innerHTML = html;
}
document.getElementById('calc-inheritance')?.addEventListener('click', () => {
  const total = +document.getElementById('estate-total').value || 0;
  const heirsN = +document.getElementById('heirs').value || 2;
  const hasSpouse = document.querySelector('input[name="spouse"]:checked')?.value === 'yes';
  const hasInsur = document.querySelector('input[name="insurance"]:checked')?.value === 'yes';
  if (!total) { toast('遺産総額を入力してください'); return; }
  const basicDeduction = 3000 + 600 * heirsN;
  const insuranceExemption = hasInsur ? 500 * heirsN : 0;
  const taxableTotal = Math.max(0, total - basicDeduction - insuranceExemption);
  if (taxableTotal <= 0) {
    showInheritResult(`<div style="padding:32px;text-align:center;width:100%;">
      <div style="font-size:2.6rem;margin-bottom:14px;color:#2e9e5b;"><i class="fa-solid fa-circle-check"></i></div>
      <h4 style="font-size:1.1rem;font-weight:800;color:#1d6b46;margin-bottom:8px;">相続税はかかりません</h4>
      <p style="font-size:.875rem;color:#6f8494;line-height:1.8;">遺産総額が基礎控除額以下のため、相続税は0円です。<br />基礎控除額：<strong>${basicDeduction.toLocaleString()}万円</strong></p>
    </div>`);
    return;
  }
  const perPerson = taxableTotal / heirsN;
  const taxPerPerson = calcInheritTax(perPerson);
  let totalTax = taxPerPerson * heirsN;
  let spouseDiscount = 0;
  if (hasSpouse) {
    const spouseShare = total / 2;
    const spouseExempt = Math.min(spouseShare, 16000);
    spouseDiscount = Math.round(totalTax * (spouseExempt / total));
  }
  const finalTax = Math.max(0, Math.round(totalTax - spouseDiscount));
  totalTax = Math.round(totalTax);
  showInheritResult(`<div style="padding:26px;width:100%;">
    <h4 style="font-size:1rem;font-weight:800;color:#16425f;margin-bottom:18px;padding-bottom:12px;border-bottom:2px solid #dcebf3;">
      <i class="fa-solid fa-chart-pie" style="color:#e5732c;margin-right:6px;"></i>相続税 試算結果
    </h4>
    <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:18px;">
      ${rr('遺産総額', total.toLocaleString() + '万円', '#16425f')}
      ${rr('基礎控除額', '▲' + basicDeduction.toLocaleString() + '万円', '#6f8494')}
      ${hasInsur ? rr('生命保険非課税枠', '▲' + insuranceExemption.toLocaleString() + '万円', '#6f8494') : ''}
      ${rr('課税遺産総額', taxableTotal.toLocaleString() + '万円', '#e5732c')}
      ${rr('相続税の総額（試算）', totalTax.toLocaleString() + '万円', '#c0392b')}
      ${hasSpouse ? rr('配偶者税額軽減', '▲' + spouseDiscount.toLocaleString() + '万円', '#2aa793') : ''}
    </div>
    <div style="background:#fdeeea;border:2px solid #f6d2b8;border-radius:12px;padding:18px;text-align:center;margin-bottom:14px;">
      <p style="font-size:.75rem;color:#6f8494;margin-bottom:4px;">最終的な相続税額（概算）</p>
      <p style="font-size:2rem;font-weight:900;color:#c0392b;">${finalTax.toLocaleString()}<span style="font-size:1rem;">万円</span></p>
    </div>
    <p style="font-size:.72rem;color:#93a6b3;line-height:1.7;">※ 課税遺産総額を相続人数で均等按分した簡易試算です（実際の法定相続分による計算とは異なる場合があります）。実際の税額は遺産の内容・分割方法・各種特例の適用により異なります。正式な申告・具体的な税務判断は、グループの高橋秀和税理士事務所（税理士）にご確認ください。</p>
    <a href="#reserve" style="display:inline-flex;margin-top:14px;align-items:center;gap:6px;background:#16425f;color:#fff;padding:12px 22px;border-radius:100px;font-weight:800;font-size:.85rem;">相続の詳細を専門家に相談 →</a>
  </div>`);
});

function calcGiftTax(taxable, type) {
  if (type === 'special') {
    if (taxable <= 200) return taxable * .10;
    if (taxable <= 400) return taxable * .15 - 10;
    if (taxable <= 600) return taxable * .20 - 30;
    if (taxable <= 1000) return taxable * .30 - 90;
    if (taxable <= 1500) return taxable * .40 - 190;
    if (taxable <= 3000) return taxable * .45 - 265;
    if (taxable <= 4500) return taxable * .50 - 415;
    return taxable * .55 - 640;
  }
  if (taxable <= 200) return taxable * .10;
  if (taxable <= 300) return taxable * .15 - 10;
  if (taxable <= 400) return taxable * .20 - 25;
  if (taxable <= 600) return taxable * .30 - 65;
  if (taxable <= 1000) return taxable * .40 - 125;
  if (taxable <= 1500) return taxable * .45 - 175;
  if (taxable <= 3000) return taxable * .50 - 250;
  return taxable * .55 - 400;
}
function showGiftResult(html) {
  const el = document.getElementById('gift-result');
  el.style.alignItems = 'flex-start';
  el.innerHTML = html;
}
document.getElementById('calc-gift')?.addEventListener('click', () => {
  const amount = +document.getElementById('gift-amount').value || 0;
  const type = document.getElementById('gift-type').value;
  if (!amount) { toast('贈与金額を入力してください'); return; }
  if (type === 'housing') {
    const exempt = Math.min(amount, 1000);
    const taxable = Math.max(0, amount - 110 - exempt);
    const tax = taxable > 0 ? Math.round(calcGiftTax(taxable, 'special')) : 0;
    showGiftResult(`<div style="padding:26px;width:100%;">
      <h4 style="font-size:.95rem;font-weight:800;color:#16425f;margin-bottom:14px;"><i class="fa-solid fa-house-chimney" style="color:#e5732c;margin-right:6px;"></i>住宅取得資金の贈与（試算）</h4>
      <div style="background:#e9f6f3;border-radius:10px;padding:13px 15px;margin-bottom:14px;font-size:.83rem;color:#16425f;">住宅取得資金の贈与では、最大<strong>1,000万円</strong>（省エネ・耐震住宅）の非課税特例があります。</div>
      ${rr('贈与額', amount.toLocaleString() + '万円', '#16425f')}
      ${rr('非課税特例枠', '▲' + exempt.toLocaleString() + '万円', '#2aa793')}
      ${rr('基礎控除（110万円）', '▲110万円', '#6f8494')}
      ${rr('課税対象額', taxable.toLocaleString() + '万円', '#e5732c')}
      <div style="background:${tax === 0 ? '#eaf7f0' : '#fdeeea'};border-radius:10px;padding:16px;text-align:center;margin-top:14px;">
        <p style="font-size:.75rem;color:#6f8494;margin-bottom:4px;">贈与税額（概算）</p>
        <p style="font-size:1.8rem;font-weight:900;color:${tax === 0 ? '#1d6b46' : '#c0392b'};">${tax.toLocaleString()}<span style="font-size:.9rem;">万円</span></p>
      </div>
      <p style="font-size:.72rem;color:#93a6b3;margin-top:12px;line-height:1.7;">※ 要件を満たす場合の試算です。詳細は、グループの高橋秀和税理士事務所（税理士）にご確認ください。</p>
    </div>`);
    return;
  }
  const taxable = Math.max(0, amount - 110);
  if (taxable <= 0) {
    showGiftResult(`<div style="padding:32px;text-align:center;width:100%;">
      <div style="font-size:2.6rem;margin-bottom:12px;color:#2e9e5b;"><i class="fa-solid fa-circle-check"></i></div>
      <h4 style="font-size:1rem;font-weight:800;color:#1d6b46;">贈与税はかかりません</h4>
      <p style="font-size:.85rem;color:#6f8494;margin-top:8px;">贈与額が基礎控除（110万円）以下のため<br/>贈与税は0円です。</p>
    </div>`);
    return;
  }
  const tax = Math.round(calcGiftTax(taxable, type));
  const rateName = type === 'special' ? '特例税率' : '一般税率';
  showGiftResult(`<div style="padding:26px;width:100%;">
    <h4 style="font-size:.95rem;font-weight:800;color:#16425f;margin-bottom:14px;"><i class="fa-solid fa-gift" style="color:#e5732c;margin-right:6px;"></i>贈与税 試算結果（${rateName}）</h4>
    ${rr('贈与額', amount.toLocaleString() + '万円', '#16425f')}
    ${rr('基礎控除', '▲110万円', '#6f8494')}
    ${rr('課税対象額', taxable.toLocaleString() + '万円', '#e5732c')}
    <div style="background:#fdeeea;border:2px solid #f6d2b8;border-radius:12px;padding:16px;text-align:center;margin:14px 0;">
      <p style="font-size:.75rem;color:#6f8494;margin-bottom:4px;">贈与税額（概算）</p>
      <p style="font-size:1.8rem;font-weight:900;color:#c0392b;">${tax.toLocaleString()}<span style="font-size:.9rem;">万円</span></p>
    </div>
    <p style="font-size:.72rem;color:#93a6b3;line-height:1.7;">※ 簡易試算です。実際の税額は、グループの高橋秀和税理士事務所（税理士）にご確認ください。</p>
    <a href="#reserve" style="display:inline-flex;margin-top:12px;align-items:center;gap:6px;background:#2aa793;color:#fff;padding:11px 20px;border-radius:100px;font-weight:800;font-size:.83rem;">贈与・相続を相談する（無料）→</a>
  </div>`);
});

window.calcHousingTax = () => {
  const val = +document.getElementById('ht-value').value || 0;
  if (!val) { document.getElementById('ht-result').textContent = '評価額を入力してください'; return; }
  const tax = Math.max(0, val * .03);
  const deduction = Math.min(val, 1200) * .03;
  const finalTax = Math.max(0, Math.round(tax - deduction));
  document.getElementById('ht-result').innerHTML =
    `不動産取得税：約 <strong>${finalTax.toLocaleString()}万円</strong><br><span style="font-size:.75rem;color:#93a6b3;">（新築住宅の1,200万円控除適用後の概算）</span>`;
};
window.calcFixedTax = () => {
  const val = +document.getElementById('ft-value').value || 0;
  if (!val) { document.getElementById('ft-result').textContent = '評価額を入力してください'; return; }
  // 小規模住宅用地（200㎡以下の土地）の特例：固定資産税は1/6、都市計画税は1/3に減額
  const fixed = Math.round(val / 6 * .014 * 10) / 10;
  const urban = Math.round(val / 3 * .003 * 10) / 10;
  document.getElementById('ft-result').innerHTML =
    `固定資産税：約 <strong>${fixed.toLocaleString()}万円/年</strong><br>都市計画税：約 <strong>${urban.toLocaleString()}万円/年</strong><br><span style="font-size:.75rem;color:#93a6b3;">（土地・小規模住宅用地の特例適用後の概算。家屋分は含みません）</span>`;
};
window.calcLoanDeduction = () => {
  const balance = +document.getElementById('loan-balance').value || 0;
  if (!balance) { document.getElementById('ld-result').textContent = '残高を入力してください'; return; }
  const deduction = Math.round(balance * .007);
  document.getElementById('ld-result').innerHTML =
    `年間控除額：約 <strong>${deduction.toLocaleString()}万円</strong><br><span style="font-size:.75rem;color:#93a6b3;">（年末ローン残高×0.7%、上限あり）</span>`;
};

/* =====================================================
   FAQ アコーディオン
===================================================== */
document.querySelectorAll('.faq-q').forEach(q => {
  q.addEventListener('click', () => {
    const item = q.closest('.faq-item');
    const ans = item.querySelector('.faq-a');
    const open = item.classList.toggle('open');
    ans.style.maxHeight = open ? ans.scrollHeight + 'px' : '0px';
  });
});

/* =====================================================
   予約（LINE予約のため専用JSは不要）
===================================================== */
