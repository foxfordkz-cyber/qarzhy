/* ---------- OtbasyAI: on-device model (runs in the browser, data never leaves the device) ----------
   1) Multinomial naive Bayes over word stems + character 3-grams, trained at page load on the
      labelled examples below (Kazakh, Russian and mixed). Labels: income / food / transport / home / other.
   2) Rule-based phrase parser: amount (12 500, 12500, 12,5 мың, 12к, 1,2 млн), family member
      (matched against names already used, with Kazakh case endings), description.
   Accuracy is measured on a separate hold-out set in ai/eval.js (not shipped with the page). */
var OtbasyAI = (function () {
  'use strict';
  var LABELS = ['income', 'food', 'transport', 'home', 'other'];
  var TRAIN = [
    /* income */
    'income|жалақы', 'income|жалақы түсті', 'income|айлық түсті', 'income|айлық жалақы', 'income|аванс', 'income|аванс алдым',
    'income|зарплата', 'income|пришла зарплата', 'income|аванс на карту', 'income|стипендия', 'income|стипендия түсті',
    'income|бонус', 'income|сыйақы', 'income|премия', 'income|жылдық премия', 'income|бала жәрдемақысы', 'income|жәрдемақы',
    'income|пособие на ребенка', 'income|зейнетақы', 'income|пенсия', 'income|фриланс', 'income|фриланс тапсырыс төледі',
    'income|тапсырыс үшін ақша түсті', 'income|клиент ақша аударды', 'income|торт тапсырысы', 'income|торт сатып ақша түсті',
    'income|кешбэк', 'income|кэшбэк каспи', 'income|депозит сыйақысы', 'income|проценты по депозиту', 'income|пәтерді жалға беріп түсті',
    'income|аренда квартиры доход', 'income|қарызды қайтарды', 'income|вернули долг', 'income|көлікті сатып түскен ақша',
    'income|продал телефон', 'income|ескі телефонды саттым', 'income|сабақ бергенім үшін', 'income|репетитор табысы',
    'income|подработка', 'income|қосымша табыс', 'income|табыс', 'income|доход', 'income|ақша түсті', 'income|аударым келді',
    'income|перевод от мамы', 'income|сыйлыққа ақша берді', 'income|туған күнге ақша берді', 'income|грант', 'income|ұтыс',
    /* food */
    'food|азық-түлік', 'food|апталық азық-түлік', 'food|продукты', 'food|продукты на неделю', 'food|магнум', 'food|магнумнан азық-түлік',
    'food|small дүкен', 'food|анвар', 'food|дүкеннен', 'food|магазин у дома', 'food|нан', 'food|нан сүт', 'food|сүт қатық',
    'food|ет', 'food|базардан ет', 'food|мясо на базаре', 'food|тауық еті', 'food|балық', 'food|жеміс', 'food|жеміс-жидек',
    'food|көкөніс', 'food|овощи и фрукты', 'food|картоп пияз', 'food|жұмыртқа', 'food|ірімшік', 'food|шай', 'food|қант ұн',
    'food|күріш', 'food|макарон', 'food|май', 'food|сусын', 'food|су бөтелке', 'food|кофе', 'food|кафе', 'food|кафеде түскі ас',
    'food|мейрамхана', 'food|ресторан', 'food|фастфуд', 'food|пицца', 'food|доставка еды', 'food|wolt', 'food|glovo тамақ',
    'food|түскі ас', 'food|бизнес ланч', 'food|тәтті', 'food|торт', 'food|бала тамағы', 'food|детское питание', 'food|ет пен сүт',
    /* transport */
    'transport|такси', 'transport|яндекс такси', 'transport|яндекс го', 'transport|indrive', 'transport|автобус', 'transport|онай',
    'transport|onay карта', 'transport|онай толықтыру', 'transport|метро', 'transport|жанармай', 'transport|бензин', 'transport|аи-92',
    'transport|аи-95', 'transport|заправка', 'transport|газ для машины', 'transport|көлік жуу', 'transport|мойка', 'transport|автомойка',
    'transport|сто', 'transport|көлік жөндеу', 'transport|ремонт машины', 'transport|май ауыстыру', 'transport|замена масла',
    'transport|шиномонтаж', 'transport|дөңгелек', 'transport|резина', 'transport|тұрақ', 'transport|парковка', 'transport|айыппұл жол',
    'transport|штраф пдд', 'transport|сақтандыру көлік', 'transport|автострахование', 'transport|пойыз билеті', 'transport|поезд',
    'transport|авиабилет', 'transport|ұшақ билеті', 'transport|билет алматыға', 'transport|автобус билеті', 'transport|каршеринг',
    'transport|самокат', 'transport|электросамокат', 'transport|көлік салығы', 'transport|техосмотр', 'transport|техбайқау',
    'transport|жол ақысы', 'transport|платная дорога', 'transport|балаларды мектепке такси',
    /* home */
    'home|пәтерақы', 'home|пәтер жалдау', 'home|аренда квартиры', 'home|квартплата', 'home|коммуналдық', 'home|коммуналдық төлемдер',
    'home|коммуналка', 'home|жарық', 'home|электр', 'home|свет', 'home|газ', 'home|газ үйге', 'home|су', 'home|ыстық су',
    'home|жылу', 'home|отопление', 'home|интернет', 'home|үй интернеті', 'home|ұялы байланыс', 'home|мобильная связь', 'home|телефон балансы',
    'home|бейлайн', 'home|kcell', 'home|tele2', 'home|тв', 'home|кабельное', 'home|оси', 'home|ипотека', 'home|ипотека төлемі',
    'home|кредит за квартиру', 'home|жиһаз', 'home|мебель', 'home|диван', 'home|тоңазытқыш', 'home|кір жуғыш машина', 'home|техника үйге',
    'home|жөндеу', 'home|ремонт квартиры', 'home|сантехник', 'home|электрик', 'home|бояу', 'home|обои', 'home|тұрмыстық химия',
    'home|бытовая химия', 'home|ыдыс', 'home|посуда', 'home|төсек жабдықтары', 'home|шам', 'home|лампочка', 'home|үй тазалау',
    /* other */
    'other|дәріхана', 'other|аптека', 'other|дәрі', 'other|лекарства', 'other|дәрігер', 'other|врач', 'other|емхана', 'other|анализы',
    'other|тіс дәрігері', 'other|стоматолог', 'other|балабақша', 'other|детский сад', 'other|мектеп', 'other|школа', 'other|үйірме',
    'other|кружок', 'other|курстар', 'other|курсы английского', 'other|репетитор', 'other|оқу ақысы', 'other|киім', 'other|одежда',
    'other|күзгі киім', 'other|аяқ киім', 'other|обувь', 'other|куртка', 'other|спортзал', 'other|фитнес', 'other|спортзал абонементі',
    'other|бассейн', 'other|кино', 'other|кинотеатр', 'other|театр', 'other|сыйлық', 'other|подарок', 'other|туған күнге сыйлық',
    'other|той', 'other|тойға', 'other|құдалық', 'other|садақа', 'other|шаштараз', 'other|парикмахерская', 'other|маникюр',
    'other|косметика', 'other|ойыншық', 'other|игрушки', 'other|кітап', 'other|канцелярия', 'other|телефон сатып алдым', 'other|наушники',
    'other|подписка', 'other|netflix', 'other|ойын', 'other|демалыс', 'other|отпуск', 'other|қонақүй', 'other|ветеринар',
    /* payment verbs inside expenses, so that "төледі" alone does not mean income */
    'food|дүкенге төледім', 'food|азық-түлікке жұмсадым', 'food|тамаққа төлем', 'food|продуктыға төледік', 'food|оплатил продукты',
    'transport|таксиге төледім', 'transport|жол ақысын төледі', 'transport|бензинге жұмсадым', 'transport|оплатил такси', 'transport|тұраққа төледім',
    'transport|мойкаға төледі', 'transport|indrive жол ақысы', 'transport|көлікке жанармай құйдым',
    'home|пәтерақы төледі', 'home|пәтерге төлем', 'home|жарыққа төледік', 'home|газға төлем', 'home|интернетке төледім', 'home|оплатил коммуналку',
    'home|телефонға төледім', 'home|балансты толтырдым', 'home|шкаф', 'home|шкаф сатып алдық', 'home|кереует', 'home|үстел орындық',
    'other|балабақшаға төледі', 'other|курсқа төлем', 'other|дәріге жұмсадым', 'other|оплатил садик', 'other|сыйлыққа жұмсадым', 'other|сыйлық алдым',
    'other|кроссовки', 'other|аяқ киім сатып алдым', 'other|дәрігерге төледік', 'other|шаштаразға төледім',
    'food|колбаса', 'food|ірімшік пен шұжық', 'food|сыр'
  ];

  function lower(s) { try { return s.toLocaleLowerCase('kk'); } catch (e) { return s.toLowerCase(); } }
  function words(text) { return lower(text).replace(/ё/g, 'е').match(/[a-zа-яәғқңөұүһі0-9-]+/g) || []; }
  /* function words and generic verbs carry no category signal ("сатып алу", "ақша", "үшін", "төлем") */
  var FUNC = {};
  ('сатып алу алды алдым алдық алдық алған ақша ақшасы үшін және мен пен бен төлем төлемі төледі төледім төледік жұмсадым жұмсады ' +
   'салу салдым салды беру берді бердім жіберді жасадық жасау ақысы ақы бір екі жаңа ескі осы ана мына ' +
   'на за в и с для по от до купил купила купили оплатил оплата платеж платёж месяц новый').split(' ').forEach(function (w) { if (w) FUNC[w] = 1; });
  function features(text) {
    var f = [];
    var ws = words(text), content = ws.filter(function (w) { return !FUNC[w]; });
    (content.length ? content : ws).forEach(function (w) {
      if (/^\d+$/.test(w) || w.length < 2) return;
      f.push('w:' + w);
      if (w.length > 5) f.push('s:' + w.slice(0, 5));
      var p = ' ' + w + ' ';
      for (var i = 0; i + 3 <= p.length; i++) f.push('c:' + p.slice(i, i + 3));
    });
    return f;
  }

  var model = null;
  function train(lines) {
    var m = { counts: {}, totals: {}, docs: {}, vocab: {}, nDocs: 0, vocabSize: 0 };
    LABELS.forEach(function (l) { m.counts[l] = {}; m.totals[l] = 0; m.docs[l] = 0; });
    lines.forEach(function (line) {
      var i = line.indexOf('|'), label = line.slice(0, i), text = line.slice(i + 1);
      m.docs[label]++; m.nDocs++;
      features(text).forEach(function (t) {
        m.counts[label][t] = (m.counts[label][t] || 0) + 1;
        m.totals[label]++;
        if (!m.vocab[t]) { m.vocab[t] = 1; m.vocabSize++; }
      });
    });
    return m;
  }
  function predict(text, allowed) {
    if (!model) model = train(TRAIN);
    var f = features(text).filter(function (t) { return model.vocab[t]; });
    var labels = allowed || LABELS, alpha = 0.3, scores = {};
    labels.forEach(function (l) {
      var s = Math.log(model.docs[l] / model.nDocs), denom = model.totals[l] + alpha * model.vocabSize;
      f.forEach(function (t) { s += Math.log(((model.counts[l][t] || 0) + alpha) / denom); });
      scores[l] = s;
    });
    var max = Math.max.apply(null, labels.map(function (l) { return scores[l]; })), sum = 0, probs = {};
    labels.forEach(function (l) { probs[l] = Math.exp(scores[l] - max); sum += probs[l]; });
    var best = labels[0];
    labels.forEach(function (l) { probs[l] /= sum; if (probs[l] > probs[best]) best = l; });
    return { label: best, prob: f.length ? probs[best] : 0, probs: probs, known: f.length };
  }

  /* amount: "12 500", "12500 ₸", "12,5 мың", "12к", "1,2 млн", "5 мыңға" */
  var AMOUNT_RE = /(\d{1,3}(?:[\s ]\d{3})+|\d+(?:[.,]\d+)?)\s*(млн|миллион\w*|мың\w*|тыс\w*|к(?![а-яәғқңөұүһі]))?/gi;
  function parseAmount(text) {
    var best = null, m;
    AMOUNT_RE.lastIndex = 0;
    while ((m = AMOUNT_RE.exec(text))) {
      var n = parseFloat(m[1].replace(/[\s ]/g, '').replace(',', '.'));
      if (!isFinite(n)) continue;
      var mult = m[2] ? lower(m[2]) : '';
      if (/^(млн|миллион)/.test(mult)) n *= 1e6; else if (/^(мың|тыс|к)/.test(mult)) n *= 1000;
      n = Math.round(n);
      if (/^аи-?$/i.test(text.slice(Math.max(0, m.index - 3), m.index).trim()) || /аи-$/i.test(text.slice(0, m.index))) continue; /* АИ-92 */
      if (n > 0 && (!best || n > best.value)) best = { value: n, start: m.index, end: m.index + m[0].length };
    }
    return best;
  }

  var CASE_ENDINGS = ['ның', 'нің', 'дың', 'дің', 'тың', 'тің', 'ға', 'ге', 'қа', 'ке', 'на', 'не', 'а', 'е', 'ды', 'ді', 'ты', 'ті', 'ны', 'ні',
    'дан', 'ден', 'тан', 'тен', 'нан', 'нен', 'мен', 'бен', 'пен', 'да', 'де', 'та', 'те', 'нда', 'нде', 'ның', 'а', 'у', 'ой', 'ей'];
  function matchName(token, names) {
    var t = lower(token);
    for (var i = 0; i < names.length; i++) {
      var n = lower(names[i]);
      if (t === n) return names[i];
      if (t.indexOf(n) === 0 && CASE_ENDINGS.indexOf(t.slice(n.length)) !== -1) return names[i];
    }
    return null;
  }
  function stripEnding(token) {
    var t = token;
    var ends = CASE_ENDINGS.slice().sort(function (a, b) { return b.length - a.length; });
    for (var i = 0; i < ends.length; i++) if (ends[i].length >= 2 && t.length - ends[i].length >= 3 && lower(t).slice(-ends[i].length) === ends[i]) return t.slice(0, -ends[i].length);
    return t;
  }
  var NOT_NAMES = /^(магнум|small|смолл|анвар|каспи|kaspi|яндекс|yandex|indrive|wolt|glovo|onay|онай|аи|kcell|tele2|бейлайн|beeline|netflix|алматы|астана|шымкент)/i;

  function parsePhrase(text, knownNames) {
    var src = String(text || '').trim();
    var res = { type: null, amount: null, member: null, category: null, note: '', confidence: 0, source: 'local' };
    if (!src) return res;
    var amt = parseAmount(src);
    if (amt) res.amount = amt.value;
    var rest = amt ? (src.slice(0, amt.start) + ' ' + src.slice(amt.end)) : src;
    rest = rest.replace(/(теңге[а-яәғқңөұүһі]*|тенге[а-я]*|тг|₸)/gi, ' ').replace(/(^|\s)-?(ға|ге|қа|ке|на|не|ден|дан|тан|тен)(?=\s|$)/gi, ' ');
    var tokens = rest.match(/[A-Za-zА-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүҺһІі-]+/g) || [];
    var names = (knownNames || []).filter(Boolean);
    var nameTok = null;
    for (var i = 0; i < tokens.length && !res.member; i++) { var hit = matchName(tokens[i], names); if (hit) { res.member = hit; nameTok = tokens[i]; } }
    if (!res.member) {
      for (var j = 0; j < tokens.length; j++) {
        var tk = tokens[j];
        if (/^[А-ЯЁӘҒҚҢӨҰҮҺІ][а-яёәғқңөұүһі]{2,}$/.test(tk) && !NOT_NAMES.test(tk)) { res.member = stripEnding(tk); nameTok = tk; break; }
      }
    }
    var noteText = rest;
    if (nameTok) noteText = noteText.replace(nameTok, ' ');
    noteText = noteText.replace(/\s+/g, ' ').replace(/^[\s,.;:-]+|[\s,.;:-]+$/g, '');
    var pred = predict(noteText || src);
    res.type = pred.label === 'income' ? 'income' : 'expense';
    if (res.type === 'expense') {
      var catPred = predict(noteText || src, ['food', 'transport', 'home', 'other']);
      res.category = catPred.label;
      res.confidence = catPred.prob;
    } else res.confidence = pred.prob;
    if (!pred.known) res.confidence = 0;
    res.note = cleanNote(noteText);
    return res;
  }
  /* turn "Магнумнан азық-түлік алды" into a short description; keep the user's words */
  var STOP = ['алды', 'алдым', 'алдық', 'төледі', 'төледім', 'төледік', 'жұмсады', 'жұмсадым', 'сатып', 'потратил', 'потратила', 'заплатил',
    'заплатила', 'купил', 'купила', 'купили', 'оплатил', 'оплатила', 'за', 'на', 'үшін', 'түсті', 'келді', 'пришла', 'пришло', 'пришел', 'салды', 'құйды', 'берді'];
  function cleanNote(s) {
    var t = s.split(/\s+/).filter(function (w) { return w && STOP.indexOf(lower(w)) === -1; }).join(' ').replace(/^[\s,.;:-]+|[\s,.;:-]+$/g, '');
    if (!t) return '';
    return (t.charAt(0).toLocaleUpperCase() + t.slice(1)).slice(0, 60);
  }
  function suggestCategory(text) {
    if (!text || words(text).length === 0) return null;
    var p = predict(text, ['food', 'transport', 'home', 'other']);
    return p.known ? { category: p.label, prob: p.prob } : null;
  }
  return { LABELS: LABELS, predict: predict, parsePhrase: parsePhrase, parseAmount: parseAmount, suggestCategory: suggestCategory, trainSize: TRAIN.length, _train: train, _features: features };
})();
