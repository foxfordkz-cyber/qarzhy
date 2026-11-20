/* Interpret supported ledger questions. Arithmetic is performed on the matching records. */
var BudgetQuery = (function () {
  'use strict';
  var categories = {
    food: /^(?:азық|түлік|тамақ|продукт|питани|ед[ау]$)/,
    transport: /^(?:көлік|транспорт)/,
    home: /^(?:үй(?:ге|дің|де|ді|ім)?$|дом(?:а|у)?$|жиль[еёя])/,
    other: /^(?:басқа|проч[ие]|друг(?:ое|ие))/
  };
  var expense = /^(?:расход|трат|потрат|потрач|затрат|жұмса|жұмсаған|шығыс|шығын|ушло|ушли|кетт|кетті)/;
  var income = /^(?:кіріс|табыс|жалақы|доход|зарплат|заработ|поступ|түсті|тапты|получ)/;
  var balance = /^(?:қалдық|қалдығ|қалды$|баланс|остаток|остатка|остал)/;
  var previous = /^(?:өткен|алдыңғы|прошл)/, current = /^(?:осы|бұл|текущ|этом|этот)/;
  var filler = /^(?:қанша\p{L}*|сколько|ақша\p{L}*|денег|деньги|барлығы|жалпы|всего|общ\p{L}*|семь[яиеюй]|отбасы\p{L}*|месяц\p{L}*|ай|айда|айдың|айды|айға|санат\p{L}*|категори\p{L}*|теңге\p{L}*|тенге|сумм\p{L}*|состав\p{L}*|у|в|во|на|за|по|от|и|а|для|мы|я|мои|наши?|наш[аеу]|нас|мен|пен|және|алды|қандай|како[йевя]|какая|кетті|было|был[аи]?|болды|есть|ли|покажи|көрсет|бойынша|таңдалған|выбранн\p{L}*)$/u;
  var unsupportedPeriod = /(?:апта|недел|кеше|вчера|бүгін|сегодня|жыл|позапрошл|(?:^|\s)год|қаңтар|ақпан|наурыз|сәуір|мамыр|маусым|шілде|тамыз|қыркүйек|қазан|қараша|желтоқсан|январ|феврал|март|апрел|(?:^|\s)ма[ейя](?=\s|[?.!]|$)|ию[нл]|август|сентябр|октябр|ноябр|декабр|\d)/;
  function tokenize(text) { return text.toLocaleLowerCase('kk').match(/[\p{L}\d]+(?:-[\p{L}\d]+)*/gu) || []; }
  function parse(question, names, selectedMonth, currentMonth) {
    var quoted = question.match(/[«"]([^»"]+)[»"]/);
    var text = (quoted ? question.replace(quoted[0], ' ') : question).toLocaleLowerCase('kk');
    if (/салыстыр|сравни|динамик|лимит|шек|қауіп|қауіпсіз|жинақ|үнем|совет|сэконом|несие|кредит/.test(text)) return null;
    var top = /больше всего|ең көп|қайда кет|куда (?:ушл|уход)/.test(text);
    var rank = top && (/(?:^|\s)(?:кто|кого|кім)(?:\s|[?.!]|$)/.test(text) ? 'member' : 'category');
    if (top) text = text.replace(/больше всего|ең көп|қайда кет\p{L}*|куда (?:ушл|уход)\p{L}*|(?:^|\s)(?:кто|кого|кім|куда|что|қай|қайсы)(?=\s|[?.!]|$)/gu, ' ');
    var tokens = tokenize(text);
    var wantsExpense = tokens.some(t => expense.test(t));
    var wantsIncome = tokens.some(t => income.test(t));
    var wantsBalance = tokens.some(t => balance.test(t));
    if (!(rank || wantsExpense || wantsIncome || wantsBalance || tokens.some(t => /^(?:қанша|сколько)/.test(t)))) return null;
    var ru = /сколько|расход|трат|доход|баланс|остаток|зарплат|прошл|ушл|получ|покажи|осталось|куда|больше/i.test(question);
    if (unsupportedPeriod.test(text)) return { prompt: 'period', ru: ru };
    var scope = { month: selectedMonth, type: wantsBalance || (wantsIncome && wantsExpense) ? null : wantsIncome ? 'income' : 'expense' };
    if (quoted) scope.note = quoted[1];
    if (tokens.some(t => previous.test(t))) scope.month = currentMonth - 1;
    else if (tokens.some(t => current.test(t))) scope.month = currentMonth;
    // Consume full member names before interpreting ordinary words as categories.
    var people = names.map(name => ({ name: name, words: tokenize(name) })).sort((a, b) => b.words.length - a.words.length);
    for (var i = 0; i < tokens.length; i++) {
      var token = tokens[i];
      var person = people.find(p => p.words.length > 0 && p.words.length <= tokens.length - i &&
        p.words.every((word, j) => OtbasyAI.matchName(tokens[i + j], [word])));
      if (person) {
        if (scope.member && scope.member !== person.name) return { prompt: 'scope', ru: ru };
        scope.member = person.name; i += person.words.length - 1; continue;
      }
      var category = Object.keys(categories).find(k => categories[k].test(token));
      if (category) {
        if (scope.category && scope.category !== category) return { prompt: 'scope', ru: ru };
        scope.category = category; continue;
      }
      var detail = token.match(/^(магнум|magnum|такси|бензин|интернет)/);
      if (detail && !scope.note) { scope.note = detail[1]; continue; }
      if (!(expense.test(token) || income.test(token) || balance.test(token) || previous.test(token) || current.test(token) || filler.test(token))) {
        return { prompt: 'scope', ru: ru };
      }
    }
    if (!rank && !wantsBalance && !wantsExpense && !wantsIncome && !scope.category && !scope.note) return { prompt: 'scope', ru: ru };
    if (rank === 'category' && scope.type !== 'expense') return { prompt: 'scope', ru: ru };
    return { scope: scope, ru: ru, rank: rank };
  }
  return { parse: parse };
})();
