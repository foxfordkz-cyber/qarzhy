import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { handleBudgetApi } from './api.mjs';

export function memoryD1() {
  const sql = new DatabaseSync(':memory:');
  sql.exec(readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));
  const prepare = query => {
    const statement = sql.prepare(query);
    const bound = args => ({
      first: async () => statement.get(...args) || null,
      run: async () => ({ meta: { changes: statement.run(...args).changes } })
    });
    return { ...bound([]), bind: (...args) => bound(args) };
  };
  return { prepare, close: () => sql.close() };
}
const send = (db, path, method = 'GET', body, headers = {}) =>
  handleBudgetApi(new Request('https://api.example.test/v1/' + path, {
    method, headers: { Origin: 'https://foxfordkz-cyber.github.io', 'Content-Type': 'application/json', ...headers },
    body: body ? JSON.stringify(body) : undefined
  }), db);
test('rooms require a capability and a matching revision, including conditional polling', async () => {
  const db = memoryD1(), path = 'rooms/' + 'a'.repeat(43), auth = { Authorization: 'Bearer ' + 'b'.repeat(43) };
  const box = { iv: 'x'.repeat(16), ciphertext: 'z'.repeat(40) };
  assert.equal((await send(db,path,'POST',{box},auth)).status,201);
  assert.equal((await send(db,path,'POST',{box},auth)).status,200);
  assert.equal((await send(db,path)).status,401);
  assert.equal((await send(db,path+'?since=1','GET',null,{Authorization:'Bearer '+'c'.repeat(43)})).status,404);
  assert.equal((await send(db,path+'?since=1','GET',null,auth)).status,304);
  assert.equal((await send(db,path,'PUT',{box,rev:1},auth)).status,200);
  assert.equal((await send(db,path,'PUT',{box,rev:1},auth)).status,409);
  assert.deepEqual(await (await send(db,path,'GET',null,auth)).json(),{rev:2,box});
  assert.equal((await send(db,path,'DELETE',null,auth)).status,204);
  assert.equal((await send(db,path,'GET',null,auth)).status,404);
  db.close();
});
test('the public pilot counts opted-in sessions once and computes paired medians', async () => {
  const db=memoryD1(), path='pilot/results', orders=['manual-first','ai-first'];
  const empty=await (await send(db,'pilot/summary')).json();
  assert.equal(empty.sessions,0); assert.equal(empty.aiMedianMs,null);
  for(const [i,order] of orders.entries()) {
    const ids=['food-a','income-a','transport-a','food-b','transport-b','income-b'];
    const trials=ids.map((taskId,j)=>{
      const mode=(j<3)===(i===0)?'manual':'ai';
      return {taskId,mode,activeMs:(mode==='manual'?1000:500)*(i+1)+[0,200,400][j%3],wrongAttempts:0,correctedFields:mode==='ai'?1:0};
    });
    const payload={version:1,runId:crypto.randomUUID(),order,trials};
    assert.equal((await send(db,path+'?dryRun=1','POST',payload)).status,200);
    assert.equal((await (await send(db,'pilot/summary')).json()).sessions,i);
    assert.equal((await send(db,path,'POST',payload)).status,201);
    assert.equal((await send(db,path,'POST',payload)).status,200);
    assert.equal((await send(db,path,'POST',{...payload,email:'unwanted'})).status,422);
    payload.trials[0].activeMs++;
    assert.equal((await send(db,path,'POST',payload)).status,409);
  }
  const result=await (await send(db,'pilot/summary')).json();
  assert.deepEqual(result,{sessions:2,manualMedianMs:1700,aiMedianMs:950,manualWrongAttempts:0,aiWrongAttempts:0,aiCorrectedFields:6,orders:{'manual-first':1,'ai-first':1}});
  assert.equal((await send(db,'pilot/results','OPTIONS',null,{Origin:'https://example.test'})).status,403);
  db.close();
});
